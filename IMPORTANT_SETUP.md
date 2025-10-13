# 🔴 重要：メール認証エラーの解決方法

## 問題
新規登録時に「無効な確認リンクです」というエラーが表示される

## 解決方法（必須）

開発環境でアプリケーションを使用するには、Supabaseのメール確認を無効化する必要があります。

### ステップ1: Supabase Dashboardにアクセス

1. ブラウザで https://supabase.com/dashboard を開く
2. ログインする
3. 作成したプロジェクト（bxhdtvinktljwzpyysrg）を選択

### ステップ2: Email Provider設定を開く

1. 左サイドバーの **Authentication** アイコンをクリック
2. **Providers** タブをクリック
3. リストから **Email** を探してクリック

### ステップ3: Confirm emailを無効化

1. **Confirm email** のトグルスイッチを探す
2. **ON（緑色）から OFF（グレー）** に切り替える
3. ページ下部の **Save** ボタンをクリック

### ステップ4: 確認

設定後、以下を試してください：

1. ブラウザで http://localhost:5173 を開く
2. **新規登録**をクリック
3. メールアドレスとパスワードを入力
4. **新規登録**ボタンをクリック
5. **メールを確認せずに、すぐにダッシュボードにログインできるはずです**

## 📸 スクリーンショット付きガイド

### 正しい設定:
```
Authentication > Providers > Email
  ├── Enable Email provider: ✅ ON
  ├── Confirm email: ⬜ OFF  ← これを OFF にする
  └── Secure email change: ⬜ OFF
```

## ❓ よくある質問

### Q: メール確認は本番環境で必要ですか？
A: はい。本番環境では **Confirm email を ON** にすることを推奨します。開発環境では OFF にして開発をスムーズに進めてください。

### Q: 既に登録したユーザーはどうなりますか？
A: Supabase Dashboard の **Authentication > Users** から、ユーザーを手動で削除して再登録できます。

### Q: それでもエラーが出る場合は？
A: 以下を確認してください：
1. Supabaseの設定を保存したか
2. ブラウザのキャッシュをクリアしたか
3. 開発サーバーを再起動したか

## 🔄 代替方法（上級者向け）

メール確認を有効にしたまま使用したい場合：

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL** を `http://localhost:5173` に設定
3. **Redirect URLs** に `http://localhost:5173/**` を追加
4. **Email Templates** → **Confirm signup** を編集
5. Confirmation URL を確認: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

ただし、開発環境では **Confirm emailをOFF** にする方が簡単です。
