"""
API segura com autenticação, rate limiting e logging.
"""
import logging
import os
import unicodedata
import uuid
from collections import defaultdict
from datetime import datetime
from time import time
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field
import pandas as pd
from langchain_openai import ChatOpenAI
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent

from config import get_settings

# ======================== LOGGING ========================
def setup_logging(settings):
    """Configura logging estruturado"""
    os.makedirs("logs", exist_ok=True)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Handler para arquivo
    file_handler = logging.FileHandler(settings.LOG_FILE)
    file_handler.setFormatter(formatter)
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger = logging.getLogger("api")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


settings = get_settings()
settings.validate()  # Valida configurações críticas

logger = setup_logging(settings)

# ======================== AUTENTICAÇÃO ========================
async def verify_api_key(x_api_key: str = Header(...)) -> str:
    """Verifica a API Key fornecida"""
    if x_api_key != settings.API_KEY:
        logger.warning(f"Tentativa de acesso com API key inválida: {x_api_key[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key inválida"
        )
    return x_api_key


# ======================== RATE LIMITING ========================
class RateLimiter:
    """Limita requisições por IP"""
    def __init__(self, requests: int, window: int):
        self.requests = requests
        self.window = window
        self.clients = defaultdict(lambda: {"count": 0, "reset_at": time()})
    
    def is_allowed(self, client_ip: str) -> bool:
        """Verifica se o cliente pode fazer requisição"""
        now = time()
        client_data = self.clients[client_ip]
        
        if now > client_data["reset_at"]:
            client_data["count"] = 0
            client_data["reset_at"] = now + self.window
        
        if client_data["count"] >= self.requests:
            return False
        
        client_data["count"] += 1
        return True


rate_limiter = RateLimiter(
    requests=settings.RATE_LIMIT_REQUESTS,
    window=settings.RATE_LIMIT_WINDOW
)


def get_rate_limit_check(client_ip: str = "unknown") -> bool:
    """Middleware de rate limiting"""
    if settings.RATE_LIMIT_ENABLED and not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit excedido para IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas requisições. Aguarde antes de tentar novamente."
        )
    return True


# ======================== SESSION MEMORY ========================
class SessionStore:
    """Armazena histórico de conversas por sessão com expiração automática."""

    SESSION_TTL = 3600  # 1 hora
    MAX_HISTORY = 20    # Máximo de trocas por sessão (input + output)

    def __init__(self):
        self.sessions: dict[str, dict] = {}

    def get_or_create(self, session_id: Optional[str] = None) -> tuple[str, list]:
        """Retorna (session_id, chat_history). Cria nova sessão se necessário."""
        if session_id and session_id in self.sessions:
            session = self.sessions[session_id]
            if time() - session["created_at"] > self.SESSION_TTL:
                del self.sessions[session_id]
            else:
                return session_id, session["history"][:self.MAX_HISTORY]

        new_id = str(uuid.uuid4())
        self.sessions[new_id] = {"created_at": time(), "history": []}
        return new_id, []

    def add_exchange(self, session_id: str, query: str, output: str):
        """Adiciona um par pergunta/resposta ao histórico da sessão."""
        if session_id in self.sessions:
            self.sessions[session_id]["history"].extend([
                {"role": "user", "content": query},
                {"role": "assistant", "content": output},
            ])
            self.sessions[session_id]["created_at"] = time()

    def delete(self, session_id: str) -> bool:
        """Remove uma sessão."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    def cleanup_expired(self):
        """Remove sessões expiradas."""
        now = time()
        expired = [sid for sid, s in self.sessions.items() if now - s["created_at"] > self.SESSION_TTL]
        for sid in expired:
            del self.sessions[sid]
        if expired:
            logger.info(f"Sessões expiradas removidas: {len(expired)}")


session_store = SessionStore()


# ======================== INICIALIZAÇÃO DA API ========================
# Carrega dados uma única vez
try:
    df = pd.read_excel(settings.DATA_FILE)

    # Limpa nomes de colunas (remove acentos, espaços extras, normaliza)
    def _clean_col_name(name: str) -> str:
        normalized = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
        cleaned = normalized.strip().upper().replace(' ', '_')
        cleaned = ''.join(c for c in cleaned if c.isalnum() or c == '_')
        return cleaned

    df.columns = [_clean_col_name(c) for c in df.columns]

    # Garante que colunas numéricas estejam com tipo correto
    numeric_cols = ['DESP_EMPENHADA', 'DESP_A_LIQUIDAR', 'DESP_LIQUIDADA',
                    'DESP_LIQUIDADA_A_PAGAR', 'DESP__PAGA']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Converte coluna de data para string legível
    date_cols = df.select_dtypes(include=['datetime']).columns
    for col in date_cols:
        df[col] = df[col].dt.strftime('%Y-%m-%d')

    logger.info(f"Dados carregados com sucesso: {settings.DATA_FILE} ({len(df)} linhas, {len(df.columns)} colunas)")
    logger.info(f"Colunas: {list(df.columns)}")
except Exception as e:
    logger.error(f"Erro ao carregar dados: {e}")
    raise

# Constrói descrição do schema para o agente
def _build_df_description(dataframe: pd.DataFrame) -> str:
    """Gera descrição compacta das colunas para o prompt do agente.

    Usa formato mínimo: nome, dtype, não-nulos, únicos e 1 exemplo curto.
    Isso evita que o LLM pequeno confunda exemplos com o dataset completo.
    """
    lines = []
    for col in dataframe.columns:
        dtype = dataframe[col].dtype
        non_null = int(dataframe[col].notna().sum())
        n_unique = int(dataframe[col].nunique())
        first_val = dataframe[col].dropna().iloc[0] if non_null > 0 else None
        if first_val is not None and isinstance(first_val, str) and len(first_val) > 40:
            first_val = first_val[:40] + "..."
        lines.append(f"  {col}: {dtype}, nulls={len(dataframe) - non_null}, unique={n_unique}, example={first_val!r}")
    return "\n".join(lines)

df_description = _build_df_description(df)

NUM_ROWS = len(df)
NUM_COLS = len(df.columns)

# Configura o modelo LLM
try:
    llm = ChatOpenAI(
        model=settings.MODEL_NAME,
        base_url=settings.LOCAL_URL,
        api_key="not_required",
        temperature=0.1,
        timeout=settings.LLM_TIMEOUT,
        max_retries=2,
    )
    logger.info(f"LLM configurado: {settings.MODEL_NAME}")
except Exception as e:
    logger.error(f"Erro ao configurar LLM: {e}")
    raise

# Cria o agente uma única vez
try:
    agent = create_pandas_dataframe_agent(
        llm=llm,
        df=df,
        agent_type="openai-tools",
        allow_dangerous_code=settings.ALLOW_DANGEROUS_CODE,
        verbose=True,
        handle_parsing_errors=True,
        prefix=(
            f"Você é um analista de dados especialista em consultas a planilhas de empenhos de despesas públicas. "
            f"Você tem acesso a um DataFrame pandas chamado 'df' com EXATAMENTE {NUM_ROWS} linhas e {NUM_COLS} colunas.\n\n"
            "Schema do DataFrame (exemplos são APENAS 1 valor — NUNCA use para cálculos):\n"
            f"{df_description}\n\n"
            "Instruções:\n"
            f"1. SEMPRE use o DataFrame completo 'df' ({NUM_ROWS} linhas) para cálculos. NUNCA use df.head() para somas, médias, contagens.\n"
            "2. Use df['coluna'].sum() para totais — isso considera TODAS as linhas.\n"
            "3. Para filtros por data, a coluna 'MES_LANCAMENTO' esta no formato 'YYYY-MM-DD' como string.\n"
            "4. Para filtros por texto, use str.contains() com case=False e na=False.\n"
            "5. Para contagem de registros: use len(df) ou df.shape[0].\n"
            "6. SEMPRE imprima o resultado final usando print(result).\n"
            "7. Responda em português de forma clara e concisa.\n"
            "8. Destaque valores numéricos formatados como R$ com separador de milhar.\n"
            "9. Se a query for ambígua, explique sua interpretação antes de responder.\n"
        ),
    )
    logger.info("Agente criado com sucesso")
except Exception as e:
    logger.error(f"Erro ao criar agente: {e}")
    raise

# ======================== APLICAÇÃO FASTAPI ========================
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

# ======================== MIDDLEWARES ========================
# 1. Trusted Host - Protege contra ataques de host injection
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.CORS_ORIGINS + ["localhost", "127.0.0.1"]
)

# 2. CORS - Configura origens permitidas
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", settings.API_KEY_HEADER],
)

# ======================== MODELS ========================
class QueryRequest(BaseModel):
    """Modelo de entrada"""
    query: str = Field(
        ...,
        min_length=1,
        max_length=settings.MAX_QUERY_LENGTH,
        description="Pergunta a ser processada",
        example="Quais foram as despesas em 2025?"
    )
    session_id: Optional[str] = Field(
        None,
        description="ID da sessão de conversa para manter contexto"
    )


class QueryResponse(BaseModel):
    """Modelo de saída"""
    query: str
    output: str
    timestamp: str
    status: str = "success"
    session_id: str = Field(description="ID da sessão para manter continuidade")


class ErrorResponse(BaseModel):
    """Modelo de erro"""
    status: str = "error"
    message: str
    timestamp: str


# ======================== ENDPOINTS ========================
@app.get("/health", tags=["Health"])
async def health_check():
    """Verifica o status da API"""
    logger.info("Health check realizado")
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.API_VERSION
    }


@app.post(
    "/query",
    response_model=QueryResponse,
    dependencies=[Depends(verify_api_key)],
    tags=["Queries"]
)
async def process_query(
    request: QueryRequest,
    x_api_key: str = Depends(verify_api_key),
    client_ip: str = "unknown"
):
    """
    Processa uma pergunta.
    
    Requer: Header `X-API-Key` com a chave de autenticação válida
    
    **Exemplo de requisição:**
    ```
    POST /query
    X-API-Key: sua_chave_aqui
    Content-Type: application/json
    
    {
        "query": "Qual foi o total de despesas com material?"
    }
    ```
    """
    # Rate limiting
    get_rate_limit_check(client_ip)

    # Session memory: get or create session and retrieve history
    active_session_id, chat_history = session_store.get_or_create(request.session_id)

    timestamp = datetime.utcnow().isoformat()
    logger.info(f"Query recebida (session={active_session_id[:8]}): {request.query[:100]}...")

    try:
        # Valida se a query não contém caracteres suspeitos
        if any(char in request.query for char in [";", "--", "/*", "*/"]):
            logger.warning(f"Query suspeita bloqueada: {request.query}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query contém caracteres inválidos"
            )

        # Processa a query com histórico da sessão
        resp = agent.invoke({
            "input": request.query,
            "chat_history": chat_history,
        })

        output = resp.get("output", "")

        if not output or output.strip().lower() in ["i don't know", "unknown", "n/a", ""]:
            logger.warning(f"Agente retornou resposta vazia para query: {request.query[:100]}")
        else:
            # Salva a troca no histórico da sessão
            session_store.add_exchange(active_session_id, request.query, output)

        logger.info(f"Query processada com sucesso (session={active_session_id[:8]}): {request.query[:100]}...")

        return QueryResponse(
            query=request.query,
            output=output,
            timestamp=timestamp,
            status="success",
            session_id=active_session_id,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Erro ao processar query: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )


@app.delete(
    "/session/{session_id}",
    dependencies=[Depends(verify_api_key)],
    tags=["Sessions"]
)
async def delete_session(session_id: str):
    """Reseta o histórico de uma sessão de conversa."""
    if session_store.delete(session_id):
        logger.info(f"Sessão deletada: {session_id[:8]}...")
        return {"status": "deleted", "session_id": session_id}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Sessão não encontrada"
    )


@app.get("/", tags=["Root"])
async def root():
    """Informações da API"""
    logger.info("Acesso ao root")
    return {
        "message": "Bem-vindo ao QueryBot API",
        "version": settings.API_VERSION,
        "endpoints": {
            "health": "/health (GET)",
            "query": "/query (POST) - Requer X-API-Key",
            "docs": "/docs (GET)" if not settings.is_production else None
        }
    }


# ======================== STARTUP/SHUTDOWN ========================
@app.on_event("startup")
async def startup_event():
    """Executado ao iniciar a aplicação"""
    logger.info("="*50)
    logger.info("API iniciada com segurança ativada")
    logger.info(f"Ambiente: {'PRODUÇÃO' if settings.is_production else 'DESENVOLVIMENTO'}")
    logger.info(f"Host: {settings.HOST}:{settings.PORT}")
    logger.info(f"Session TTL: {session_store.SESSION_TTL}s, Max history: {session_store.MAX_HISTORY}")
    logger.info("="*50)


@app.on_event("shutdown")
async def shutdown_event():
    """Executado ao desligar a aplicação"""
    logger.info("API desligada")


# ======================== ENTRADA ========================
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "api_secure:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
