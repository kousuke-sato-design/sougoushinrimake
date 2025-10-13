# テストアカウントの作成方法

## 方法1: Supabase Dashboardで手動作成（推奨）

### 手順:

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にアクセス
   - プロジェクト（bxhdtvinktljwzpyysrg）を選択

2. **Authentication → Users に移動**
   - 左サイドバーの **Authentication** をクリック
   - **Users** タブをクリック

3. **Add user をクリック**
   - 右上の **Add user** ボタン（または **Create new user**）をクリック

4. **ユーザー情報を入力**
   ```
   Email: kousuke-sato@sipe-selye.co.jp
   Password: 13581358
   Auto Confirm User: ✅ ON（チェックを入れる）
   ```

5. **Create user をクリック**

6. **完了！**
   - これで、メール確認なしですぐにログインできます

## 方法2: アプリケーションから新規登録

メール確認をOFFにしているので、アプリから直接登録できます：

### 手順:

1. **ブラウザで http://localhost:5173 を開く**

2. **新規登録タブをクリック**

3. **情報を入力**
   ```
   メールアドレス: kousuke-sato@sipe-selye.co.jp
   パスワード: 13581358
   ```

4. **新規登録ボタンをクリック**
   - すぐにダッシュボードにリダイレクトされます ✅

## ログイン方法

アカウント作成後、以下でログインできます：

1. http://localhost:5173 を開く
2. **ログイン**タブ（デフォルトで表示）
3. メールアドレス: `kousuke-sato@sipe-selye.co.jp`
4. パスワード: `13581358`
5. **ログイン**ボタンをクリック

## トラブルシューティング

### 「User already registered」エラーが出る場合:

このメールアドレスで既にアカウントが作成されています。以下を試してください：

1. **既存のユーザーを削除**:
   - Supabase Dashboard → Authentication → Users
   - kousuke-sato@sipe-selye.co.jp のユーザーを探す
   - 右側の **...** メニュー → **Delete user**
   - 再度作成する

2. **または、そのままログイン**:
   - すでにアカウントが存在する場合は、ログインページから直接ログインできます

### パスワードが違うと言われる場合:

Supabase Dashboardから：
1. Authentication → Users
2. ユーザーを選択
3. **Send password recovery** でパスワードをリセット
4. または、ユーザーを削除して再作成

## 次のステップ

ログインに成功したら：
1. **設定** → Gemini APIキーを設定
2. **LP作成** → AIでランディングページを生成
3. **顧客リスト** → 顧客データを管理
4. **メール送信** → キャンペーンを作成

すべての機能が使用可能になります！
