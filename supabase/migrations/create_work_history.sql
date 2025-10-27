-- 作業履歴テーブル
CREATE TABLE IF NOT EXISTS work_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'section_added', 'section_edited', 'section_deleted', 'content_saved', 'ai_generated', etc.
  description TEXT NOT NULL,
  details JSONB, -- 詳細情報（変更前後のデータなど）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_work_history_user_id ON work_history(user_id);
CREATE INDEX IF NOT EXISTS idx_work_history_landing_page_id ON work_history(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_work_history_created_at ON work_history(created_at DESC);

-- RLS有効化
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own work history"
  ON work_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work history"
  ON work_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_atトリガー（念のため）
CREATE TRIGGER update_work_history_updated_at
  BEFORE UPDATE ON work_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE work_history IS '作業履歴を記録するテーブル';
COMMENT ON COLUMN work_history.action_type IS 'アクションの種類';
COMMENT ON COLUMN work_history.description IS 'アクションの説明（日本語）';
COMMENT ON COLUMN work_history.details IS 'アクションの詳細情報（JSON形式）';
