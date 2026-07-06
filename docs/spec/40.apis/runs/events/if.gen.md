<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# List Agentic RAG QA run events

## 概要

実装 `apps/api/src/app.ts` の `GET /api/runs/:id/events` から生成しています。

## 基本情報

- Method: `GET`
- Path: `/api/runs/{id}/events`
- Operation ID: `listRunEvents`
- Tag: `runs`
- 認証方式: `none`

## レスポンス

| Status | Description |
| --- | --- |
| 200 | Run events |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

```json
null
```

## レスポンス例

```json
{
  "events": [
    {
      "id": "uuid",
      "runId": "uuid",
      "type": "run.completed",
      "message": "Answer synthesized successfully.",
      "status": "completed",
      "createdAt": "2026-07-06T00:00:00.000Z"
    }
  ]
}
```
