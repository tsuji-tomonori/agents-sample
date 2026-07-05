<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# API一覧

| Method | Path | Operation ID | Summary | Auth |
| --- | --- | --- | --- | --- |
| GET | `/health` | `getHealth` | 稼働状態を取得する | none |
| GET | `/api/conversations` | `listConversations` | 会話一覧を取得する | none |
| POST | `/api/conversations` | `createConversation` | 新しい会話を作成する | none |
| GET | `/api/conversations/{id}/messages` | `listConversationMessages` | 会話のメッセージ一覧を取得する | none |
| POST | `/api/chat` | `postChat` | AIチャットへメッセージを送信する | none |
