<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# getRun sequence

```mermaid
sequenceDiagram
  autonumber
  participant User as User
  participant API as Hono API
  participant DB as PostgreSQL/DSQL
  participant LLM as Ollama/Bedrock
  User->>API: GET /api/runs/{id}
  API->>DB: run, event, artifact, document access を読み書き
  API-->>User: HTTP 200
  alt 入力検証エラー
    API-->>User: HTTP 400
  end
  alt 想定外エラー
    API-->>User: HTTP 500
  end
```
