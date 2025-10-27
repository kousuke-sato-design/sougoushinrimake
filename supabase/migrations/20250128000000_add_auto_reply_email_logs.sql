-- email_logsテーブルを拡張して自動返信メールにも対応
ALTER TABLE email_logs
  ALTER COLUMN campaign_id DROP NOT NULL, -- キャンペーンIDをオプショナルに
  ADD COLUMN IF NOT EXISTS email_type TEXT DEFAULT 'campaign' CHECK (email_type IN ('campaign', 'auto_reply')),
  ADD COLUMN IF NOT EXISTS email_setting_id UUID REFERENCES email_settings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS to_email TEXT,
  ADD COLUMN IF NOT EXISTS from_email TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_setting_id ON email_logs(email_setting_id);

-- RLSポリシーを更新
DROP POLICY IF EXISTS "Users can view logs of own campaigns" ON email_logs;

-- 新しいポリシー：キャンペーン送信と自動返信の両方に対応
CREATE POLICY "Users can view their own email logs" ON email_logs FOR SELECT USING (
  -- キャンペーン送信の場合
  (email_type = 'campaign' AND EXISTS (
    SELECT 1 FROM email_campaigns
    WHERE email_campaigns.id = email_logs.campaign_id
    AND email_campaigns.user_id = auth.uid()
  ))
  OR
  -- 自動返信の場合
  (email_type = 'auto_reply' AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their own email logs" ON email_logs FOR INSERT WITH CHECK (
  -- キャンペーン送信の場合
  (email_type = 'campaign' AND EXISTS (
    SELECT 1 FROM email_campaigns
    WHERE email_campaigns.id = email_logs.campaign_id
    AND email_campaigns.user_id = auth.uid()
  ))
  OR
  -- 自動返信の場合
  (email_type = 'auto_reply' AND user_id = auth.uid())
);

-- コメント追加
COMMENT ON COLUMN email_logs.email_type IS 'メールタイプ: campaign（キャンペーン送信）, auto_reply（自動返信）';
COMMENT ON COLUMN email_logs.email_setting_id IS '自動返信の場合のメール設定ID';
COMMENT ON COLUMN email_logs.subject IS 'メールの件名';
COMMENT ON COLUMN email_logs.body IS 'メールの本文';
COMMENT ON COLUMN email_logs.to_email IS '送信先メールアドレス';
COMMENT ON COLUMN email_logs.from_email IS '送信元メールアドレス';
COMMENT ON COLUMN email_logs.user_id IS 'ユーザーID（自動返信の場合）';
