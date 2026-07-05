<!-- 自動生成・直接編集禁止: npm run docs:generate で更新 -->

# 稼働状態を取得する

## 概要

実装 `apps/api/src/app.ts` の `GET /health` から生成しています。

## 基本情報

- Method: `GET`
- Path: `/health`
- Operation ID: `getHealth`
- Tag: `system`
- 認証方式: `none`

## レスポンス

| Status | Description |
| --- | --- |
| 200 | 稼働状態 |
| 400 | 入力検証エラー |
| 500 | 想定外エラー |

## リクエスト例

```json
null
```

## レスポンス例

```json
{
  "ok": true,
  "provider": "ollama"
}
```
