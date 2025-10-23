-- メール設定テーブル
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 設定名（例: "お問い合わせ自動返信"）
  subject TEXT NOT NULL, -- 件名
  body TEXT NOT NULL, -- 本文（テンプレート変数対応）
  from_name TEXT, -- 送信者名
  reply_to TEXT, -- 返信先メールアドレス
  gmail_config JSONB, -- Gmail IMAP設定（後で使用）
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own email settings"
  ON email_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email settings"
  ON email_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email settings"
  ON email_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email settings"
  ON email_settings FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_email_settings_user_id ON email_settings(user_id);

-- customersテーブルの拡張
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS source_lp_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_section_id TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- コメント追加
COMMENT ON COLUMN customers.source_lp_id IS 'フォーム送信元のLP ID';
COMMENT ON COLUMN customers.source_section_id IS 'フォーム送信元のセクション ID';
COMMENT ON COLUMN customers.custom_fields IS 'カスタムフォームフィールドのデータ（JSON）';
COMMENT ON COLUMN customers.status IS '顧客ステータス（new, contacted, converted等）';

-- updated_at自動更新トリガー（email_settings）
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();
