# Optimus IA — Agent Guide

## Quick start

```bash
# Backend (from api/)
cd api && python api_secure.py              # FastAPI on :8000

# Frontend (from repo root, separate terminal)
npm run dev                                  # Vite on :5173
npm run lint                                 # ESLint (no type checker — JS only)
npm run build                                # Production build
```

No tests exist in this repo — no test runner, no test files.

## Architecture

- **Frontend** (`src/`): React 19, Vite 7, React Router 7, JSX (no TypeScript)
  - `main.jsx` — mounts `<BrowserRouter>` + `<UserProvider>`
  - Routes: `/` (login), `/recuperacao` (pass recovery), `/home` (protected chat)
  - Auth: localStorage-based (`user_logged_name`, `user_logged_email`), not a real auth system
  - `src/services/chatService.js` — calls `POST /query` with `X-API-Key` header
- **Backend** (`api/`): FastAPI, LangChain `create_pandas_dataframe_agent` over `dados.xlsx`
  - `api_secure.py:458` — entrypoint via `uvicorn.run()`
  - `config.py` — `Settings` loaded from `api/.env` via `python-dotenv`
  - Session memory in `SessionStore` (in-memory dict, 1h TTL, max 20 exchanges)
  - Rate limiter: 10 req/min per IP, default on
  - **RAG**: `rag_knowledge.py` — `KnowledgeBase` class using `OllamaEmbeddings` + Chroma. Retrieves top-3 relevant chunks from domain docs (`api/knowledge/*.md`) and injects as `suffix` in agent calls at `/query`. Seed with `python seed_knowledge.py`.

## Critical setup

**Two `.env` files** — both required:

| File | Key |
|---|---|
| Root `.env` | `VITE_API_URL`, `VITE_API_KEY`, `VITE_API_TIMEOUT` |
| `api/.env` | `API_KEY`, `LLM_MODEL`, `LLM_URL`, `ALLOW_DANGEROUS_CODE`, `EMBEDDING_MODEL`, `EMBEDDING_URL` |

- `VITE_API_KEY` (root) must equal `API_KEY` (api/.env) — mismatch = 403
- Backend reads env from `api/.env` (via `python-dotenv` + `load_dotenv()`) — the root `.env` is ignored by Python
- Default LLM: Ollama `qwen3.5:4b` at `http://localhost:11434/v1`
- Default embedding: Ollama `nomic-embed-text` at `http://localhost:11434` (CPU, ~275MB) — `ollama pull nomic-embed-text`
- `ALLOW_DANGEROUS_CODE=True` is required — the LangChain agent executes Python on the DataFrame
- Data file is `api/dados.xlsx` (excluded from git — supply your own)
- Vite dev server expects backend at `http://localhost:8000`

## Key gotchas

- Column names are auto-normalized: accent removal, uppercase, spaces→underscores, stripped of non-alphanumeric (see `api_secure.py:163`)
- Numeric columns `DESP_EMPENHADA`, `DESP_A_LIQUIDAR`, `DESP_LIQUIDADA`, `DESP_LIQUIDADA_A_PAGAR`, `DESP__PAGA` are force-cast to numeric at startup
- Request bodies with `;`, `--`, `/*`, `*/` are rejected (basic SQLi guard in `api_secure.py:366`)
- Swagger docs (`/docs`, `/redoc`) are disabled in production (`DEBUG=False`)
- Backend fails fast at startup if `dados.xlsx` is missing — check `config.py:71`
- `session_id` returned from `/query` can be passed back for conversation continuity; send `DELETE /session/{id}` to reset

## Conventions

- No TypeScript anywhere — write `.jsx` files, no type annotations
- Style: single-quoted strings in JSX, 2-space indent
- Lint config in `eslint.config.js` — `api/` and `dist/` are globally ignored
- High-contrast accessibility stored in `localStorage` key `high_contrast` (bool string)
