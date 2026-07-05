<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# 画面一覧

| 画面ID | 画面名 | URL | 認証 | 権限 | レイアウト | 実装状態 |
| --- | --- | --- | --- | --- | --- | --- |
| SCR-CHAT-ROOT | AIチャット | / | 不要 | なし | sidebar + chat panel | 実装済み |

## SCR-CHAT-ROOT 画面仕様

| 項目 | 値 |
| --- | --- |
| 目的 | ローカルまたはクラウド LLM と会話する |
| 主要コンポーネント | 会話一覧、新規チャット、メッセージ一覧、送信フォーム |
| 利用API | `listConversations` / `listConversationMessages`, `postChat` |
| 状態 | empty, loading/sending, conversation selected, error |
| アクセシビリティ | 送信ボタンは `aria-label="送信"` を持つ |
