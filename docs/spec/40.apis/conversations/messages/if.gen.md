<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# 会話のメッセージ一覧を取得する

## 概要

実装 `apps/api/src/app.ts` の `GET /api/conversations/:id/messages` から生成しています。

## 基本情報

- Method: `GET`
- Path: `/api/conversations/{id}/messages`
- Operation ID: `listConversationMessages`
- Tag: `conversations`
- 認証方式: `none`

## レスポンス

| Status | Description |
| --- | --- |
| 200 | メッセージ一覧 |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

```json
null
```

## レスポンス例

```json
{
  "messages": []
}
```
