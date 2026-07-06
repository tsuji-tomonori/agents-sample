<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# Message catalog: `runs/events`

## API

| 項目 | 値 |
| --- | --- |
| operationId | `listRunEvents` |
| method/path | GET `/api/runs/{id}/events` |
| summary | List Agentic RAG QA run events |
| messages | 2 |

## メッセージ一覧

| id | message_id | level | status | ログ概要 |
| --- | --- | --- | --- | --- |
| `M001` | `listRunEvents.validation_failed` | `WARNING` | 400 | 入力検証エラー |
| `M002` | `listRunEvents.unexpected_error` | `ERROR` | 500 | 想定外エラー |
