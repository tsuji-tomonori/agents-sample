<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# List Agentic RAG QA run events 詳細設計

## 目的

List Agentic RAG QA run events。

## API契約

- Method: `GET`
- Path: `/api/runs/{id}/events`
- Operation ID: `listRunEvents`
- Tag: `runs`

## 処理フロー

1. Hono route handler がリクエストを受け取る。
2. 入力がある場合は Zod schema または handler 内の型制約で検証する。
3. DB アクセスが必要な場合は `apps/api/src/db.ts` の repository 関数を呼び出す。
4. LLM 応答が必要な場合は `apps/api/src/llm.ts` の provider 切り替えを使う。
5. 成功時は JSON response を返す。
6. 例外時は Hono のエラーレスポンスとして返る。

## 主要ソース

- app: `apps/api/src/app.ts`
- database: `apps/api/src/db.ts`
- llm provider: `apps/api/src/llm.ts`
