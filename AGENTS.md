# Repository Agent Instructions

このリポジトリで作業する AI agent は、以下を守る。

## 共通

- 指定 skill が利用可能一覧に出ない場合も、リポジトリローカルの明示ルールとして該当 `skills/*/SKILL.md` を読む。
- 実施していないテスト、確認、検証を実施済みとして書かない。
- 既存の未コミット変更やユーザー作業を勝手に戻さない。
- 実装・設定・ドキュメントを変更した場合は、変更範囲に応じた検証を選び、可能なものは実行する。
- 破壊的削除、履歴改変、本番・外部サービス状態の変更、deploy/release は最終実行前にユーザー確認を取る。

## Project Shape

- Monorepo: npm workspaces under `apps/*`.
- Frontend: `apps/frontend`, Nuxt 3 SPA, Vite, Vue, vanilla-extract.
- Backend: `apps/backend`, Hono on Node.js.
- Local runtime: Docker Compose with PostgreSQL and Ollama.
- Local LLM: Ollama `qwen2.5:0.5b`.
- Cloud targets: Aurora DSQL and Amazon Bedrock.

## Required Skills By Task

- Commit or commit message work:
  - `skills/japanese-git-commit-gitmoji/SKILL.md`
- Implementation, refactor, config, docs, or UI changes:
  - `skills/implementation-test-selector/SKILL.md`
  - `skills/repository-test-runner/SKILL.md`
  - `skills/verification-repair-loop/SKILL.md`
  - `skills/implementation-docs-maintainer/SKILL.md`
- Docker, Ollama, PostgreSQL, DSQL, or Bedrock integration work:
  - `skills/local-ai-chat-stack-maintainer/SKILL.md`
- Frontend UI/UX or accessibility work:
  - `skills/mobile-first-web-app-ui-ux-a11y/SKILL.md`
- Long or multi-step tasks:
  - `skills/task-completion-guardian/SKILL.md`

## Completion Discipline

- 完了条件を満たすまで「完了」と報告しない。
- 複数ステップの作業では、着手前または初期調査後に目的、受け入れ条件、検証方法を明確にする。
- 検証失敗時は原因を切り分け、スコープ内なら修正して再実行する。
- 未解決の失敗や未実施の検証がある場合は、理由と残リスクを明示する。

## Verification Defaults

変更範囲に応じて最小十分な検証を選ぶ。

- Backend TypeScript: `npm run typecheck -w @agents-sample/backend`
- Frontend TypeScript/UI: `npm run typecheck -w @agents-sample/frontend`
- Build-impacting changes: `npm run build`
- Docker/Compose changes: `docker compose config --quiet`
- Runtime smoke when Docker is available:
  - `docker compose up --build -d`
  - `Invoke-RestMethod http://localhost:8787/health`
  - `Invoke-WebRequest http://localhost:3000 -UseBasicParsing`
- Markdown/skills/agent-instruction changes:
  - `git diff --check`
  - inspect changed `SKILL.md` frontmatter and paths

## Documentation Maintenance

- Setup, runtime, environment variable, API, Docker, Bedrock, or DSQL behavior changes should update `README.md` or a focused `docs/` file.
- Repository-wide agent behavior belongs in `AGENTS.md`.
- Temporary task logs should not be added to `docs/`.

## Commit Rules

- Commit messages are Japanese by default.
- Use gitmoji + Conventional Commits:

```text
<emoji> <type>(<scope>): <日本語の要約>
```

- Before committing, inspect staged files with `git diff --cached --name-only`.
- Do not include generated runtime artifacts such as screenshots, `node_modules`, `.nuxt`, `.output`, database volumes, or Ollama data.
