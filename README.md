# Chat App

Next.js + Supabase + Vercel で構築したリアルタイムチャットアプリです。

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| 認証 | Supabase Auth |
| データベース | Supabase (PostgreSQL) |
| リアルタイム通信 | Supabase Realtime |
| ホスティング | Vercel |
| CI/CD | GitHub Actions |
| 開発環境 | Docker |

---

## ローカル開発のセットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-org/chat-app.git
cd chat-app
```

### 2. Supabase の準備

1. [supabase.com](https://supabase.com) でプロジェクトを新規作成
2. **SQL Editor** を開き、`supabase-schema.sql` の内容を貼り付けて実行
3. **Authentication → Providers** でログイン方法を有効化
   - Email / Password: デフォルトで有効
   - Google: Client ID と Secret を設定（任意）

### 3. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、Supabase の値を入力します。
値は **Supabase ダッシュボード → Project Settings → API** から確認できます。

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. 開発サーバーを起動

**Docker を使う場合（推奨・全員の環境を統一できる）:**

```bash
docker compose up
```

**ローカルで直接起動する場合:**

```bash
npm install
npm run dev
```

→ http://localhost:3000 でアクセス可能

---

## Vercel へのデプロイ

### Vercel の初期設定（初回のみ）

1. [vercel.com](https://vercel.com) にログインし、GitHub リポジトリをインポート
2. **Environment Variables** に以下を追加

| 変数名 | 値の取得場所 |
|--------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

3. **Deploy** を実行（以降は GitHub push で自動デプロイ）

### GitHub Actions との連携（CI を通過してからデプロイしたい場合）

GitHub リポジトリの **Settings → Secrets and variables → Actions** に以下を追加:

| Secret 名 | 値の取得場所 |
|-----------|------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID |

設定後は以下のフローで自動デプロイされます。

```
main ブランチに push
  → GitHub Actions 起動
    → 型チェック・Lint
    → Vercel に本番デプロイ
```

---

## ブランチ運用

```
main        本番環境（直接 push 禁止推奨）
feature/*   機能開発
fix/*       バグ修正
```

PR を main にマージしたタイミングで自動デプロイされます。

---

## コマンド一覧

```bash
npm run dev        # 開発サーバー起動（localhost:3000）
npm run build      # 本番ビルド
npm run typecheck  # 型チェック
npm run lint       # Lint
```

---

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # / → /chat にリダイレクト
│   ├── login/
│   │   └── page.tsx        # ログイン画面
│   └── chat/
│       └── page.tsx        # チャット画面
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx   # ログインフォーム
│   └── chat/
│       └── ChatWindow.tsx  # チャット UI・リアルタイム通信
├── lib/
│   └── supabase/
│       ├── client.ts       # クライアント用 Supabase
│       └── server.ts       # サーバー用 Supabase
├── types/
│   └── index.ts            # 型定義
└── middleware.ts            # 認証ガード（未ログインを /login へ）
```
