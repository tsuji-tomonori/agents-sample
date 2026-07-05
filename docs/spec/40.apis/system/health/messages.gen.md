<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# Message catalog: `system/health`

## API

| 項目 | 値 |
| --- | --- |
| operationId | `getHealth` |
| method/path | GET `/health` |
| summary | 稼働状態を取得する |
| messages | 2 |

## メッセージ一覧

| id | message_id | level | status | ログ概要 |
| --- | --- | --- | --- | --- |
| `M001` | `getHealth.validation_failed` | `WARNING` | 400 | 入力検証エラー |
| `M002` | `getHealth.unexpected_error` | `ERROR` | 500 | 想定外エラー |
