<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# 画面一覧

| 画面ID | 画面名 | URL | 認証 | 権限 | レイアウト | 実装状態 |
| --- | --- | --- | --- | --- | --- | --- |
| SCR-RUN-CONSOLE | Agentic RAG QA Console | / | 不要 | なし | question form + run detail panel | 実装済み |

## SCR-RUN-CONSOLE 画面仕様

| 項目 | 値 |
| --- | --- |
| 目的 | Agentic RAG QA run を作成し、進捗、回答、根拠、artifact、document access を確認する |
| 主要コンポーネント | 質問フォーム、任意の資料スコープ、run status、timeline、answer、citations、document accesses、artifacts |
| 利用API | `createRun` / `getRun` / `listRunEvents` |
| 状態 | idle, queued, running, completed, failed, error |
| アクセシビリティ | フォームコントロールは label を持ち、結果領域は `aria-live` と送信後 focus を持つ |
