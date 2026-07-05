---
name: repository-test-runner
description: リポジトリの typecheck、build、Docker smoke、docs/skills checks を実行・再実行・報告する。
---

# Repository Test Runner

## Rules

- Targeted checks before broad checks.
- Do not claim skipped, blocked, timed-out, or interrupted checks as passed.
- If a check fails, classify the cause:
  - real regression
  - stale expectation
  - missing dependency/service
  - Docker/WSL/runtime issue
  - flaky or timeout behavior
- Fix in-scope regressions and rerun the failed check.
- Do not run production credentials, deployment, release, or destructive integration tests without user confirmation.

## Standard Report

```markdown
### 実行した検証

- `<command>`: pass
- `<command>`: fail -> 修正後 pass

### 未実施・制約

- `<command>`: 未実施。理由: <reason>
```

## Documentation And Skill Changes

Default minimum checks:

- `git diff --check`
- Frontmatter inspection for changed `SKILL.md`
- Path/reference inspection for `AGENTS.md`
