# セットアップガイド

## Supabaseメール認証の設定

新規登録時のメール確認エラーを解決するため、以下の手順でSupabase設定を変更してください。

### 方法1: メール確認を無効化（開発環境用・推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Authentication** → **Settings** → **Auth Providers**
4. **Email** セクションを開く
5. **Confirm email** を **OFF** に設定
6. **Save** をクリック

これで、新規登録後すぐにログインできるようになります。

### 方法2: リダイレクトURLを設定（本番環境用）

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL** を設定: `http://localhost:5173`
3. **Redirect URLs** に追加: `http://localhost:5173/**`
4. **Save** をクリック

### メール確認メールのテンプレート設定

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. **Confirm signup** テンプレートを編集
3. 確認URL: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

## 確認ページの作成

メール確認用のページを作成します：
