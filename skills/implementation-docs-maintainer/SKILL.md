---
name: implementation-docs-maintainer
description: 実装、設定、API、Docker、LLM/DB provider、運用手順変更に伴う README、AGENTS.md、docs 更新要否を判断する。
---

# Implementation Docs Maintainer

## Workflow

1. Identify user-visible or maintainer-visible behavior that changed.
2. Search related docs with `rg` before assuming none exist.
3. Update the smallest durable document.
4. If docs are unnecessary, record the reason in final response.
5. Inspect diff for stale commands, paths, environment variables, API names, and trailing whitespace.

## Update Triggers

- Environment variables or setup steps changed.
- Docker Compose, Ollama, PostgreSQL, DSQL, or Bedrock behavior changed.
- API endpoint, request, or response shape changed.
- UI behavior or accessibility changed.
- Repository-local agent instructions or skills changed.

## Preferred Targets

- Repository-wide agent behavior: `AGENTS.md`.
- Setup and runtime usage: `README.md`.
- Focused architecture or operations material: `docs/`.
- Temporary task logs: not `docs/`.
