<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# Get an Agentic RAG QA run

## 概要

実装 `apps/api/src/app.ts` の `GET /api/runs/:id` から生成しています。

## 基本情報

- Method: `GET`
- Path: `/api/runs/{id}`
- Operation ID: `getRun`
- Tag: `runs`
- 認証方式: `none`

## レスポンス

| Status | Description |
| --- | --- |
| 200 | Run state |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

```json
null
```

## レスポンス例

```json
{
  "run": {
    "id": "uuid",
    "status": "completed",
    "question": "What changed in the latest architecture notes?",
    "documentScope": "docs/spec",
    "answer": {
      "text": "Simulated Agentic RAG answer.",
      "citations": [],
      "confidence": 0.72
    },
    "events": [],
    "artifacts": [],
    "documentAccesses": []
  }
}
```
