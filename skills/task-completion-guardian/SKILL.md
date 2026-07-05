---
name: task-completion-guardian
description: 複数ステップの依頼、完了まで続ける依頼、実装から検証まで必要な依頼で premature completion を防ぐ。
---

# Task Completion Guardian

## Operating Contract

1. Convert the request into an explicit checklist.
2. Identify acceptance criteria and validation commands.
3. Execute all actionable checklist items.
4. If validation fails, repair and rerun when in scope.
5. Do not claim completion while actionable items remain.

## Completion Gate

- Requested deliverables are present.
- Relevant checks were run, or concrete skipped reasons are documented.
- No unresolved known failures remain.
- Blocked items are labeled as blocked.
