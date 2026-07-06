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

## Agentic RAG QA Console MVP

The Agentic RAG QA Console contract is documented in `docs/agentic-rag-qa-console.md` and `openapi/openapi.gen.json`.

The MVP API surface is:

- `POST /api/runs`: create an Agentic RAG QA run for a user question.
- `GET /api/runs/{id}`: fetch the current run state, answer, citations, and artifacts.
- `GET /api/runs/{id}/events`: fetch ordered run progress events.

An Agentic RAG run represents one question-answer workflow. Events record progress such as planning, retrieval, artifact creation, completion, or failure. Artifacts represent generated run outputs such as the final answer or a local simulated runner trace.

AppSync subscriptions, S3 artifact persistence, and a dedicated background runner are local-MVP placeholders until they are implemented. The documented MVP contract can be backed by in-process simulation or local storage while preserving the same client-facing shape.

## AWS CDK Infrastructure

The `infra` workspace defines the cloud baseline for the Agentic RAG QA Console:

- Amazon CloudFront with a CloudFront Function for SPA routing.
- AWS WAF Web ACL for CloudFront in the edge stack.
- Private S3 buckets for SPA assets and logs.
- API Gateway REST API backed by the Hono API Lambda container image.
- AppSync GraphQL API for realtime agent events.
- Lambda worker placeholder for future Codex / Claude Code runner handoff.
- Aurora DSQL through the CloudFormation L1 `AWS::DSQL::Cluster`.
- Bedrock invoke permissions for backend and worker Lambdas.

Route 53 is intentionally not created by this CDK app. The CloudFront default domain is output by the app stack.

Useful commands:

```bash
npm run build
npm test
npm run infra:typecheck
npm run infra:synth
```

`npm test` includes CDK snapshot and assertion tests for the synthesized infrastructure shape.
`npm run infra:synth` applies `cdk-nag` AwsSolutions checks during synthesis. Any intentional suppressions are recorded in `infra/bin/agents-sample-infra.ts` with reasons.

GitHub Actions can run `cdk diff` and `cdk deploy` when these repository variables are configured:

- `AWS_ROLE_ARN`: IAM role ARN assumed by GitHub Actions through OIDC.
- `AWS_REGION`: target AWS region. Defaults to `ap-northeast-1` when omitted.

GitHub Actions can run cost estimation when this repository secret is configured:

- `INFRACOST_API_KEY`: Infracost API key used to estimate cost from the synthesized CloudFormation output in `infra/cdk.out`.

Pull request comments include the unit/snapshot/assertion test result, `cdk-nag` synthesis result, Infracost estimate, and CDK diff output. Long logs are folded with `<details>`.
CDK diff is skipped for forked pull requests and when `AWS_ROLE_ARN` is not configured.
Cost estimation is skipped when `INFRACOST_API_KEY` is not configured.
CDK deploy runs after verification on pushes to `main` when `AWS_ROLE_ARN` is configured, and can also be run manually through `workflow_dispatch` with `deploy_infra=true`.

Common CDK context values:

```bash
npm run infra:synth -- \
  -c appRegion=ap-northeast-1 \
  -c edgeRegion=us-east-1 \
  -c environmentName=dev \
  -c dsqlDeletionProtection=true
```

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run infra:synth
```

## CI/CD

GitHub Actions runs `npm ci`, generated design document checks, unit tests including CDK snapshot/assertion tests, TypeScript checks, application builds, CDK synthesis with `cdk-nag`, Infracost estimation when configured, CDK diff when AWS OIDC is configured, and Docker Compose configuration validation on pushes and pull requests.

For pull requests, GitHub Actions posts or updates a PR comment with the check summary plus folded logs for tests, CDK synth, cost estimate, CDK diff, typecheck, build, docs, and Docker Compose validation.

Pushes to `main` also publish Docker images to GHCR:

- `ghcr.io/tsuji-tomonori/agents-sample-api`
- `ghcr.io/tsuji-tomonori/agents-sample-web`

Pushes to `main` also deploy the CDK stacks when `AWS_ROLE_ARN` is configured. Manual workflow runs can deploy by enabling the `deploy_infra` input.

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
