<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# 新しい会話を作成する

## 概要

実装 `apps/api/src/app.ts` の `POST /api/conversations` から生成しています。

## 基本情報

- Method: `POST`
- Path: `/api/conversations`
- Operation ID: `createConversation`
- Tag: `conversations`
- 認証方式: `none`

## レスポンス

| Status | Description |
| --- | --- |
| 201 | 作成した会話 |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

```json
null
```

## レスポンス例

```json
{
  "conversation": {
    "id": "uuid",
    "title": "New chat"
  }
}
```
