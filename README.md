# MAツール - BtoB向けマーケティングオートメーション

SvelteKit + Supabase + Gemini 2.5 APIを使用したBtoB企業向けのマーケティングオートメーションツールです。

## 主な機能

- **LP作成・管理**: 3種類のLPテンプレート（トップページ、商品LP、ホワイトペーパーページ）
- **AI自動生成**: Gemini 2.5による完全自動LP生成とコード編集アシスタント
- **顧客管理**: リード獲得から育成までの一元管理
- **メール送信**: Resend APIを使用した一括メール配信
- **企業ブランディング**: ロゴからのブランドカラー自動抽出

## 技術スタック

- **フロントエンド**: SvelteKit, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI**: Gemini 2.5 API
- **メール**: Resend API

## セットアップ手順

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. Supabaseプロジェクトのセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. プロジェクトのURLとAPIキーを取得

### 3. 環境変数の設定

\`.env\`ファイルを作成し、以下の情報を設定:

\`\`\`env
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
\`\`\`

### 4. データベースマイグレーションの実行

Supabase Dashboard → SQL Editorで以下のファイルを順番に実行:

1. \`supabase/migrations/20250109000000_initial_schema.sql\`
2. \`supabase/migrations/20250109000001_create_storage.sql\`

### 5. Supabase認証設定（重要）

開発環境でメール確認を無効化します：

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Authentication** → **Providers** → **Email**
4. **Confirm email** を **OFF** に設定
5. **Save** をクリック

これにより、新規登録後すぐにログインできるようになります。

詳細は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

### 6. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで [http://localhost:5173](http://localhost:5173) を開く

## プロジェクト構造

\`\`\`
├── src/
│   ├── lib/
│   │   ├── components/      # Svelteコンポーネント
│   │   ├── stores/          # 状態管理
│   │   ├── types/           # TypeScript型定義
│   │   ├── utils/           # ユーティリティ関数
│   │   └── supabase.ts      # Supabaseクライアント
│   ├── routes/              # ページルーティング
│   │   ├── +page.svelte     # ログインページ
│   │   ├── dashboard/       # ダッシュボード
│   │   └── lp/              # 公開LP
│   ├── app.css              # グローバルCSS
│   └── app.html             # HTMLテンプレート
├── static/                  # 静的ファイル
├── supabase/
│   └── migrations/          # データベースマイグレーション
├── claude.md                # プロジェクト要件定義
└── README.md                # このファイル
\`\`\`

## 開発の進捗

### ✅ 完了済み (全機能実装完了)

#### フェーズ1: MVP基盤
- [x] プロジェクト初期化 (SvelteKit + TypeScript + Tailwind CSS)
- [x] Supabaseクライアント設定
- [x] データベーステーブル作成 (全7テーブル + RLS設定)
- [x] Supabase Storage設定 (logosバケット作成)
- [x] 環境変数設定
- [x] 認証機能実装 (ログイン/ログアウト/サインアップ)
- [x] ダッシュボードレイアウト実装 (サイドバー + メインコンテンツ)
- [x] ダッシュボードトップページ (ウィジェット表示)

#### フェーズ2: コア機能
- [x] 企業情報設定ページ (ロゴアップロード機能付き)
- [x] API設定ページ (Gemini APIキー管理 + 接続テスト)
- [x] LP作成・編集・一覧機能 (3タイプ対応: トップページ/商品LP/ホワイトペーパー)
- [x] AI自動LP生成機能 (Gemini 2.0 Flash統合)
- [x] 公開LP表示ページ (ブランドカラー対応)
- [x] 顧客リスト管理機能 (CRUD + CSV インポート/エクスポート)
- [x] メール送信機能 (Resend API統合 + キャンペーン管理)

## 参考資料

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## ライセンス

MIT
# sougoushinrimake
