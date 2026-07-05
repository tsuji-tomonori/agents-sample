---
name: local-ai-chat-stack-maintainer
description: Docker Compose、Hono API、PostgreSQL/Aurora DSQL、Ollama、Amazon Bedrock、Nuxt SPA runtime の実装・設定・検証に使う。
---

# Local AI Chat Stack Maintainer

## Scope

Use this skill when changing:

- `docker-compose.yml`
- `apps/backend`
- `apps/frontend` runtime config
- PostgreSQL or Aurora DSQL connection logic
- Ollama or Bedrock provider logic
- environment variables in `.env.example`
- README setup/deployment instructions

## Local Runtime Contract

- `docker compose up --build -d` should start:
  - `postgres`
  - `ollama`
  - `ollama-pull`
  - `backend`
  - `frontend`
- Backend health should respond at `http://localhost:8787/health`.
- Frontend should respond at `http://localhost:3000`.
- Local provider defaults should be:
  - `LLM_PROVIDER=ollama`
  - `OLLAMA_MODEL=qwen2.5:0.5b`
  - `DATABASE_PROVIDER=postgres`

## Cloud Contract

- `LLM_PROVIDER=bedrock` routes chat generation through Bedrock Converse API.
- `DATABASE_PROVIDER=dsql` routes database access through the Aurora DSQL node-postgres connector.
- Required cloud variables must be documented in `.env.example` and README:
  - `AWS_REGION`
  - `BEDROCK_MODEL_ID`
  - `DSQL_HOST`
  - `DSQL_USER`
  - `DSQL_DATABASE`

## Verification

Select the smallest relevant subset:

- Config syntax: `docker compose config --quiet`
- Backend typecheck: `npm run typecheck -w @agents-sample/backend`
- Frontend typecheck: `npm run typecheck -w @agents-sample/frontend`
- Build: `npm run build`
- Runtime smoke:
  - `docker compose up --build -d`
  - `Invoke-RestMethod http://localhost:8787/health`
  - `Invoke-WebRequest http://localhost:3000 -UseBasicParsing`
  - POST `/api/chat` with a short Japanese message when validating LLM behavior

## Avoid

- Do not use cloud credentials for local smoke unless explicitly requested.
- Do not change local model size upward without explaining the runtime cost.
- Do not claim DSQL or Bedrock production connectivity was verified unless actual cloud credentials and endpoints were used.
