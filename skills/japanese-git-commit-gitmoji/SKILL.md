---
name: japanese-git-commit-gitmoji
description: 日本語で gitmoji と Conventional Commits を組み合わせた Git commit message を作成し、必要に応じて実際に commit する。
---

# Japanese Git Commit Message with gitmoji

## Use When

- ユーザーが commit、コミット、commit message、コミットコメント、git comment、`git commit` を依頼した。
- `git diff`、`git status`、変更ファイル一覧、PR 内容から commit 文面を作る。

## Rules

- 日本語を基本にする。
- 1 行目は原則 `<emoji> <type>(<scope>): <日本語の要約>`。
- scope が不要または不明なら省略できる。
- 要約は短く具体的にする。目安は 50-72 文字以内。
- 「修正」「対応」「変更」だけで終わらせない。
- 敬体を避ける。
- 複数目的が混在する場合は commit 分割を検討する。
- 実際に commit する前に `git diff --cached --name-only` を確認する。
- commit 作業のためだけに作業レポートを新規作成しない。

## Type And Emoji

| emoji | type | 用途 |
|---|---|---|
| ✨ | `feat` | 新機能 |
| 🐛 | `fix` | 不具合修正 |
| 🩹 | `fix` | 軽微な不具合修正 |
| 💄 | `style` | UI/CSS/見た目 |
| 📝 | `docs` | ドキュメント |
| ✅ | `test` | テスト |
| 🔧 | `chore` | 設定・定型作業 |
| 🔨 | `chore` | 開発スクリプト |
| 🗃️ | `feat` / `chore` | DB 関連 |
| 🧱 | `chore` | Docker/infra |
| ♻️ | `refactor` | リファクタ |
| 🚨 | `fix` | lint/type/compiler 警告修正 |

## Examples

```text
✨ feat(chat): Ollama 経由の会話生成を追加
💄 style(ui): チャット吹き出しの折り返しを調整
📝 docs: Docker Compose 起動手順を追加
🔧 chore(agent): リポジトリローカル skill を追加
```

## Final Checklist

- 適切な gitmoji がある。
- `type` が変更目的と一致している。
- 要約が具体的で短い。
- 複数目的を無理に 1 行へ詰めていない。
- staged files を確認している。
