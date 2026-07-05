# Simple AI Chat

[![CI/CD](https://github.com/tsuji-tomonori/agents-sample/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/tsuji-tomonori/agents-sample/actions/workflows/ci-cd.yml)

Nuxt SPA + Hono + PostgreSQL のシンプルな AI チャットアプリです。

ローカルでは Docker Compose で PostgreSQL と Ollama を起動し、最小クラスの日本語対応 OSS モデルとして `qwen2.5:0.5b` を自動取得します。クラウドでは `DATABASE_PROVIDER=dsql` と `LLM_PROVIDER=bedrock` に切り替えることで Aurora DSQL と Amazon Bedrock を使えます。

## Stack

- Frontend: Nuxt 3 SPA, Vite, Vue, vanilla-extract, lucide icons
- Backend: Hono on Node.js
- Local DB: PostgreSQL
- Local LLM: Ollama `qwen2.5:0.5b`
- Cloud DB: Amazon Aurora DSQL through the AWS DSQL node-postgres connector
- Cloud LLM: Amazon Bedrock Converse API

## Repository Layout

This project follows the same broad layout policy as `tsuji-tomonori/saphnexa-v2`:

- `apps/api`: Hono API implementation.
- `apps/web`: Nuxt SPA implementation.
- `db`: implementation-derived database schema metadata.
- `docs/spec`: generated API and screen design documents.
- `docs/database`: generated database design document.
- `openapi`: generated OpenAPI document.
- `scripts`: repository automation scripts.
- `skills`: repository-local Codex skills and agent rules.

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

## MicroVM Agent Chat

Set `LLM_PROVIDER=microvm` to route chat replies through the Lambda MicroVM code-agent runner. The API writes a job payload to S3, starts the configured MicroVM image, waits for the run artifacts, and stores the returned `final_text` as the assistant message.

```bash
LLM_PROVIDER=microvm
MICROVM_AGENT=codex # codex or claude
ARTIFACT_BUCKET=your-agent-artifact-bucket
OUTPUT_PREFIX=chat-runs/
MICROVM_IMAGE_IDENTIFIER=arn:aws:lambda:ap-northeast-1:123456789012:microvm-image:your-image
MICROVM_IMAGE_VERSION=1.0
BEDROCK_REGION=ap-northeast-1
```

Use `CODEX_MICROVM_IMAGE_IDENTIFIER` and `CLAUDE_MICROVM_IMAGE_IDENTIFIER` when Codex and Claude Code use different images. `CODEX_MODEL` or `CLAUDE_MODEL_ID` can be set to select the model passed to the runner.

## Verification

```bash
npm run typecheck
npm run build
```

## CI/CD

GitHub Actions runs `npm ci`, generated design document checks, TypeScript checks, application builds, and Docker Compose configuration validation on pushes and pull requests.

Pushes to `main` also publish Docker images to GHCR:

- `ghcr.io/tsuji-tomonori/agents-sample-api`
- `ghcr.io/tsuji-tomonori/agents-sample-web`

## Generate Design Artifacts From Implementation

```bash
npm run docs:generate
npm run docs:check
```

Generated artifacts:

- `openapi/openapi.gen.json`
- `db/schema.sql`
- `docs/database/schema.md`
- `docs/spec/40.apis/apis-list.gen.md`
- `docs/spec/40.apis/**/{if,detail-design,messages,sequence}.gen.md`
- `docs/spec/45.screens/screens-list.gen.md`

Generated files are marked as direct-edit prohibited. Update the implementation first, then run `npm run docs:generate`.
