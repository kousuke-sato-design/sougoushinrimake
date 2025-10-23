-- IMAPアカウント設定テーブル
CREATE TABLE IF NOT EXISTS imap_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 設定名（例: "営業用Gmail"）
  email TEXT NOT NULL, -- メールアドレス
  imap_host TEXT NOT NULL, -- IMAPホスト（例: imap.gmail.com）
  imap_port INTEGER NOT NULL DEFAULT 993, -- IMAPポート
  smtp_host TEXT NOT NULL, -- SMTPホスト（例: smtp.gmail.com）
  smtp_port INTEGER NOT NULL DEFAULT 587, -- SMTPポート
  username TEXT NOT NULL, -- ユーザー名（通常はメールアドレス）
  password TEXT NOT NULL, -- アプリパスワード（暗号化推奨）
  use_ssl BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE imap_accounts ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own imap accounts"
  ON imap_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imap accounts"
  ON imap_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imap accounts"
  ON imap_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imap accounts"
  ON imap_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_imap_accounts_user_id ON imap_accounts(user_id);
CREATE INDEX idx_imap_accounts_email ON imap_accounts(email);

-- email_settingsテーブルを変更
ALTER TABLE email_settings
DROP COLUMN IF EXISTS gmail_config,
DROP COLUMN IF EXISTS reply_to,
ADD COLUMN IF NOT EXISTS imap_account_id UUID REFERENCES imap_accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN email_settings.imap_account_id IS '使用するIMAPアカウント';

-- updated_at自動更新トリガー（imap_accounts）
CREATE OR REPLACE FUNCTION update_imap_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER imap_accounts_updated_at
  BEFORE UPDATE ON imap_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_imap_accounts_updated_at();
