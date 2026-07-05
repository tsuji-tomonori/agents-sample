---
name: verification-repair-loop
description: code/config/build/test/doc changes を検証し、失敗時に修正して再実行する。
---

# Verification Repair Loop

## Required Behavior

1. Select relevant validation commands.
2. Run targeted checks first.
3. If a check fails, inspect root cause before changing code.
4. Fix in-scope root causes.
5. Re-run the failing check.
6. Run broader checks when shared behavior, build, Docker, or API contracts are affected.
7. Do not report completion with known unresolved failures.

## Failure Reporting

When a failure remains:

- State the command.
- State the observed error.
- State why it could not be resolved in the current scope.
- Mark the work as blocked or partially complete, not complete.
