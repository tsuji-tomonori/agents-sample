# Simple AI Chat

Nuxt SPA + Hono + PostgreSQL のシンプルな AI チャットアプリです。

ローカルでは Docker Compose で PostgreSQL と Ollama を起動し、最小クラスの日本語対応 OSS モデルとして `qwen2.5:0.5b` を自動取得します。クラウドでは `DATABASE_PROVIDER=dsql` と `LLM_PROVIDER=bedrock` に切り替えることで Aurora DSQL と Amazon Bedrock を使えます。

## Stack

- Frontend: Nuxt 3 SPA, Vite, Vue, vanilla-extract, lucide icons
- Backend: Hono on Node.js
- Local DB: PostgreSQL
- Local LLM: Ollama `qwen2.5:0.5b`
- Cloud DB: Amazon Aurora DSQL through the AWS DSQL node-postgres connector
- Cloud LLM: Amazon Bedrock Converse API

## Local Run

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8787/health

The first run downloads the Ollama model, so it can take several minutes.

## Local Development

```bash
npm install
npm run dev
```

For local development without Docker, start PostgreSQL and Ollama yourself, then pull the model:

```bash
ollama pull qwen2.5:0.5b
```

Use `.env.example` as the environment variable reference.

## Cloud Settings

Set these environment variables for Bedrock + Aurora DSQL:

```bash
DATABASE_PROVIDER=dsql
DSQL_HOST=your-cluster-id.dsql.ap-northeast-1.on.aws
DSQL_USER=admin
DSQL_DATABASE=postgres

LLM_PROVIDER=bedrock
AWS_REGION=ap-northeast-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
```

AWS credentials must be available through environment variables, an AWS profile, or a workload role. The DSQL connector handles IAM token generation for PostgreSQL connections.

## Verification

```bash
npm run typecheck
npm run build
```
