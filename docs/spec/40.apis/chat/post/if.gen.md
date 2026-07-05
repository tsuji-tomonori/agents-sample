<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# AIチャットへメッセージを送信する

## 概要

実装 `apps/api/src/app.ts` の `POST /api/chat` から生成しています。

## 基本情報

- Method: `POST`
- Path: `/api/chat`
- Operation ID: `postChat`
- Tag: `chat`
- 認証方式: `none`

## レスポンス

| Status | Description |
| --- | --- |
| 200 | 生成された assistant メッセージ |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

```json
{
  "message": "こんにちは"
}
```

## レスポンス例

```json
{
  "conversationId": "uuid",
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "assistant",
    "content": "こんにちは。何をお手伝いできますか？",
    "createdAt": "2026-07-05T00:00:00.000Z"
  }
}
```
