# Optimus IA — Assistente Inteligente para Dados do SIAFI

Chatbot inteligente para consulta e análise de dados financeiros do **SIAFI (Sistema Integrado de Administração Financeira do Governo Federal)**. Permite fazer perguntas em linguagem natural sobre despesas públicas, empenhos, liquidações, pagamentos e outros aspectos orçamentários e financeiros.

## Como funciona

O projeto utiliza um agente LangChain conectado a um DataFrame pandas carregado de uma planilha Excel. O agente interpreta perguntas em linguagem natural, executa consultas nos dados e retorna respostas formatadas. Inclui um sistema RAG (Retrieval-Augmented Generation) que injeta conhecimento contextual sobre o SIAFI para respostas mais precisas.

```
Usuário  →  Frontend (React)  →  API (FastAPI)  →  Agente LangChain + RAG  →  Seu LLM  →  Resposta
```

## Funcionalidades

- Consultas em linguagem natural sobre dados do SIAFI (empenhos, liquidações, pagamentos, etc.)
- Interface de chat intuitiva com histórico de conversa
- Memória de sessão para continuidade de diálogo
- Autenticação por API Key
- Suporte a qualquer modelo de LLM compatível com a API OpenAI (Ollama local, Claude, OpenAI, Groq, etc.)
- RAG com base de conhecimento sobre SIAFI (fluxos orçamentários, glossário, conceitos)
- Rate limiting e segurança integrada

## Pré-requisitos

| Software | Versão |
|----------|--------|
| Node.js  | 20.x+  |
| Python   | 3.10+  |
| Ollama   | (opcional, para LLM local) |

## Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd OptimusIA
```

### 2. Instale as dependências do frontend

```bash
npm install
```

### 3. Configure o ambiente Python

```bash
cd api
python -m venv venv
```

No **Windows**:
```bash
venv\Scripts\activate
```

No **Linux/macOS**:
```bash
source venv/bin/activate
```

Instale as dependências:
```bash
pip install -r requirements_secure.txt
```

## Configuração do ambiente (.env)

O projeto utiliza **dois arquivos `.env` separados**. Ambos precisam ser configurados antes de rodar o projeto.

### Arquivo `.env` (raiz do projeto)

Crie o arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# URL da API backend
VITE_API_URL=http://localhost:8000

# Chave de acesso — deve ser a MESMA do arquivo api/.env
VITE_API_KEY=sua-chave-secreta-aqui

# Timeout das requisições em milissegundos
VITE_API_TIMEOUT=60000
```

### Arquivo `api/.env` (dentro da pasta api/)

Crie o arquivo `api/.env` dentro da pasta `api/` com o seguinte conteúdo:

```env
# ===== SERVIDOR =====
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=True

# ===== AUTENTICAÇÃO =====
# Esta chave DEVE ser igual à VITE_API_KEY do .env da raiz
API_KEY=sua-chave-secreta-aqui

# ===== CORS =====
# Origens permitidas (separadas por vírgula)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ===== LLM (Escolha UMA das opções abaixo) =====

# Opção 1: Ollama local (recomendado)
LLM_MODEL=qwen3.5:4b
LLM_URL=http://localhost:11434/v1

# Opção 2: OpenAI
# LLM_MODEL=gpt-4o-mini
# LLM_URL=https://api.openai.com/v1

# Opção 3: Groq
# LLM_MODEL=llama-3.1-70b-versatile
# LLM_URL=https://api.groq.com/openai/v1

# ===== EMBEDDINGS PARA RAG =====
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_URL=http://localhost:11434

# ===== SEGURANÇA =====
# Permite que o agente execute código Python no DataFrame (necessário para funcionar)
ALLOW_DANGEROUS_CODE=True

# Tamanho máximo da pergunta em caracteres
MAX_QUERY_LENGTH=1000

# ===== LOGGING =====
LOG_LEVEL=INFO
LOG_FILE=logs/api.log
```

### Gerando uma chave segura

Recomendamos usar uma chave aleatória forte. Execute no terminal:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copie o resultado e cole tanto no `.env` da raiz (`VITE_API_KEY`) quanto no `api/.env` (`API_KEY`). **Os dois valores devem ser idênticos.**

## Configurando o LLM

O projeto é compatível com qualquer modelo que suporte o formato de API da OpenAI. Configure as variáveis `LLM_MODEL` e `LLM_URL` no `api/.env` de acordo com sua escolha:

### Ollama (local, gratuito)

1. Instale o [Ollama](https://ollama.com/)
2. Baixe um modelo:
   ```bash
   ollama pull qwen3.5:4b
   ```
3. Baixe o modelo de embeddings:
   ```bash
   ollama pull nomic-embed-text
   ```
4. Configure no `api/.env`:
   ```env
   LLM_MODEL=qwen3.5:4b
   LLM_URL=http://localhost:11434/v1
   EMBEDDING_MODEL=nomic-embed-text
   EMBEDDING_URL=http://localhost:11434
   ```

### OpenAI

1. Crie uma chave em [platform.openai.com](https://platform.openai.com/)
2. Configure no `api/.env`:
   ```env
   LLM_MODEL=gpt-4o-mini
   LLM_URL=https://api.openai.com/v1
   ```

### Groq (rápido, com tier gratuito)

1. Crie uma chave em [console.groq.com](https://console.groq.com/)
2. Configure no `api/.env`:
   ```env
   LLM_MODEL=llama-3.1-70b-versatile
   LLM_URL=https://api.groq.com/openai/v1
   ```

### Outros provedores

Qualquer serviço compatível com a API OpenAI pode ser usado. Basta definir `LLM_URL` como a base URL do provedor e `LLM_MODEL` como o nome do modelo.

## Como rodar

Inicie na seguinte ordem:

### 1. Backend (API)

```bash
cd api
python api_secure.py
```

A API estará disponível em **http://localhost:8000**

### 2. Frontend

Em outro terminal, na raiz do projeto:

```bash
npm run dev
```

Acesse o chat em **http://localhost:5173**

## Preparando seus dados

O agente lê o arquivo `api/dados.xlsx` ao iniciar. Este arquivo deve conter dados do SIAFI em formato Excel (`.xlsx`).

**Estrutura esperada:**
- Colunas com nomes normalizados (acentos removidos, maiúsculas, underscores)
- Colunas numéricas: `DESP_EMPENHADA`, `DESP_A_LIQUIDAR`, `DESP_LIQUIDADA`, `DESP_LIQUIDADA_A_PAGAR`, `DESP_PAGA`
- Dados relacionados a: UG (Unidade Gestora), PTRES, Natureza da Despesa, Fonte de Recurso, etc.

Para melhor desempenho:
- Use nomes de colunas claros e descritivos
- Mantenha uma linha de cabeçalho
- Evite células mescladas
- Dados numéricos devem estar em formato número, não texto

## Base de Conhecimento RAG

O sistema inclui uma base de conhecimento sobre o SIAFI para enriquecer as respostas:
- Fluxo orçamentário e financeiro
- Glossário de terminologias (UG, PTRES, ND, FR, etc.)
- Visão geral do SIAFI e processos de empenho

A base é automaticamente carregada de `api/knowledge/*.md` e indexada com embeddings.

## Comandos disponíveis

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run lint` | Verifica o código com ESLint |
| `npm run preview` | Visualiza o build de produção localmente |

### Backend

| Comando | Descrição |
|---------|-----------|
| `python api_secure.py` | Inicia o servidor FastAPI |
| `python seed_knowledge.py` | Semeia a base de conhecimento RAG (opcional, executado automaticamente na primeira inicialização) |

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Verifica se a API está funcionando |
| `GET` | `/` | Informações gerais da API |
| `POST` | `/query` | Envia uma pergunta ao agente |
| `DELETE` | `/session/{id}` | Limpa o histórico de uma sessão |

### Exemplo de uso

```bash
curl -X POST http://localhost:8000/query \
  -H "X-API-Key: sua-chave-secreta-aqui" \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual foi o total de despesas empenhadas por UG?"}'
```

## Segurança

- A API Key protege todos os endpoints — sem ela, as requisições são recusadas
- Rate limiting ativo por padrão (10 requisições por minuto por IP)
- CORS restringe as origens permitidas
- Sanitização de queries para prevenir injeção SQL básica
- **Não compartilhe seus arquivos `.env`** — eles contêm suas chaves secretas
- Em produção, nunca use `ALLOW_DANGEROUS_CODE=True` sem uma camada de sandbox

## Estrutura do projeto

```
├── src/                        # Frontend React
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Home/               # Componentes da página principal
│   │   ├── Login/              # Componentes de login/registro
│   │   └── Footer.jsx          # Rodapé
│   ├── pages/                  # Páginas da aplicação
│   ├── context/                # Contextos globais (auth)
│   └── services/               # Comunicação com a API
├── api/                        # Backend Python
│   ├── api_secure.py           # Aplicação FastAPI principal
│   ├── config.py               # Gerenciamento de configurações
│   ├── rag_knowledge.py        # Sistema RAG com Chroma
│   ├── seed_knowledge.py       # Script para semear conhecimento
│   ├── dados.xlsx              # Base de dados SIAFI (substitua pela sua)
│   ├── knowledge/              # Base de conhecimento RAG
│   │   ├── budget_flow.md      # Fluxo orçamentário
│   │   ├── glossary.md         # Glossário de termos
│   │   └── siafi_overview.md   # Visão geral do SIAFI
│   ├── logs/                   # Logs da aplicação
│   └── requirements_secure.txt # Dependências Python
├── .env                        # Variáveis do frontend
├── api/.env                    # Variáveis do backend
├── package.json                # Dependências Node.js
├── vite.config.js              # Configuração Vite
└── eslint.config.js            # Configuração ESLint
```

## Arquitetura Técnica

- **Frontend**: React 19 + Vite 7, JSX (sem TypeScript), React Router 7, localStorage para auth
- **Backend**: FastAPI, LangChain pandas DataFrame agent, Chroma vector store para RAG
- **LLM**: Compatível com API OpenAI (Ollama, OpenAI, Groq, etc.)
- **Embeddings**: Ollama nomic-embed-text para RAG
- **Sessões**: In-memory com TTL de 1h, max 20 trocas por sessão
- **Segurança**: API Key, rate limiting, sanitização de inputs

## Licença

Este projeto é de código aberto.
