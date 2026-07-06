<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# Message catalog: `runs/detail`

## API

| 項目 | 値 |
| --- | --- |
| operationId | `getRun` |
| method/path | GET `/api/runs/{id}` |
| summary | Get an Agentic RAG QA run |
| messages | 2 |

## メッセージ一覧

| id | message_id | level | status | ログ概要 |
| --- | --- | --- | --- | --- |
| `M001` | `getRun.validation_failed` | `WARNING` | 400 | 入力検証エラー |
| `M002` | `getRun.unexpected_error` | `ERROR` | 500 | 想定外エラー |
