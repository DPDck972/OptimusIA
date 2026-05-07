# Optimus IA — Assistente Orçamentário Inteligente

Chatbot para consultas em dados de despesas e empenhos públicos do TRE-RN, usando inteligência artificial local (Ollama) e análise de dados com pandas.

## Arquitetura

```
Frontend (React/Vite)  →  POST /query (X-API-Key)  →  FastAPI  →  LangChain Agent  →  Ollama LLM
```

- **Frontend**: React 19 + Vite 7, sem TypeScript, CSS puro
- **Backend**: FastAPI (Python) com agente LangChain pandas
- **LLM**: Ollama (modelo `qwen3.5:4b`)
- **Dados**: `api/dados.xlsx` — 2504 registros de despesas governamentais

## Pré-requisitos

| Software | Versão mínima |
|----------|---------------|
| Node.js  | 20.x          |
| Python   | 3.10+         |
| Ollama   | instalado e rodando (`ollama serve`) |

O modelo Ollama necessário deve estar instalado:

```bash
ollama pull qwen3.5:4b
```

## Como rodar

### 1. Frontend

```bash
npm install
npm run dev
```

Acesse: **http://localhost:5173**

### 2. Backend (API)

```bash
cd api
.API/Scripts/python.exe api_secure.py
```

A API roda em: **http://localhost:8000**

> **Nota**: O virtual env `.API/` é específico do Windows. Em Linux/macOS, crie e ative com `python -m venv venv && source venv/bin/activate`.

### 3. Ollama

Certifique-se de que o Ollama está rodando antes de iniciar a API:

```bash
ollama serve
```

## Ordem de inicialização

1. Inicie o **Ollama** (`ollama serve`)
2. Inicie a **API** (`python api_secure.py`)
3. Inicie o **Frontend** (`npm run dev`)

## Scripts disponíveis

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Build para produção (gera `dist/`) |
| `npm run lint` | Verificação ESLint |
| `npm run preview` | Preview do build de produção localmente |

### Backend

| Comando | Descrição |
|---------|-----------|
| `python api_secure.py` | Iniciar servidor FastAPI |

## Variáveis de ambiente

Existem **dois arquivos `.env` separados**:

### `.env` (raiz do projeto) — Frontend

```env
VITE_API_URL=http://localhost:8000
VITE_API_KEY=uj-1O0o8TTJyN1xQduch5qXBcjWtKAMcsz6_dvD0qic
VITE_API_TIMEOUT=30000
```

### `api/.env` — Backend

```env
API_HOST=127.0.0.1
API_PORT=8000
API_KEY=uj-1O0o8TTJyN1xQduch5qXBcjWtKAMcsz6_dvD0qic
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LLM_MODEL=qwen3.5:4b
LLM_URL=http://localhost:11434/v1
DEBUG=False
ALLOW_DANGEROUS_CODE=True
```

> **Importante**: `VITE_API_KEY` (frontend) e `API_KEY` (backend) **devem ser idênticos**.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Verificação de status |
| `POST` | `/query` | Envia uma pergunta ao agente |
| `DELETE` | `/session/{id}` | Reseta o histórico de uma sessão |

### Exemplo de requisição

```bash
curl -X POST http://localhost:8000/query \
  -H "X-API-Key: uj-1O0o8TTJyN1xQduch5qXBcjWtKAMcsz6_dvD0qic" \
  -H "Content-Type: application/json" \
  -d '{"query": "Qual foi o total de despesas empenhadas?"}'
```

## Solução de problemas

| Problema | Solução |
|----------|---------|
| API não responde | Verifique se `python api_secure.py` está rodando |
| Erro de API Key | Confira se `VITE_API_KEY` e `API_KEY` são idênticos |
| LLM não responde | Verifique se `ollama serve` está ativo e o modelo está instalado (`ollama list`) |
| Respostas incorretas | O agente usa `qwen3.5:4b` — modelo pequeno, pode errar em cálculos complexos |
