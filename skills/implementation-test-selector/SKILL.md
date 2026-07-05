---
name: implementation-test-selector
description: 実装、修正、リファクタ、設定変更、ドキュメント変更の完了前に、変更範囲に応じた最小十分な検証を選ぶ。
---

# Implementation Test Selector

## Workflow

1. `git diff --name-only` と、staging 後は `git diff --cached --name-only` を確認する。
2. 変更範囲ごとに最小十分な検証を選ぶ。
3. 共有設定、build 出力、Docker、API contract、UI 表示に影響する場合は広めの検証を選ぶ。
4. 実行・再実行・報告には `skills/repository-test-runner/SKILL.md` を併用する。
5. 失敗した検証は `skills/verification-repair-loop/SKILL.md` に従い、原因を直して再実行する。

## Command Selection

- Backend code: `npm run typecheck -w @agents-sample/backend`
- Frontend code: `npm run typecheck -w @agents-sample/frontend`
- Build-affecting changes: `npm run build`
- Docker Compose changes: `docker compose config --quiet`
- Runtime smoke when Docker is available:
  - `docker compose up --build -d`
  - `Invoke-RestMethod http://localhost:8787/health`
  - `Invoke-WebRequest http://localhost:3000 -UseBasicParsing`
- Markdown, skills, and agent instructions:
  - `git diff --check`
  - inspect changed `SKILL.md` frontmatter and referenced paths

## Reporting

Always report:

- Commands run and pass/fail result.
- Commands skipped and concrete reason.
- Residual risk when only lightweight checks were applicable.
