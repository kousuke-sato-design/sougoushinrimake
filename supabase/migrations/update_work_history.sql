-- 作業履歴テーブルを作業セッション管理用に変更
DROP TABLE IF EXISTS work_history CASCADE;

CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- 作業時間（分）
  description TEXT, -- 作業内容の簡単な説明
  changes JSONB, -- 変更されたファイルのリスト
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON work_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_created_at ON work_sessions(created_at DESC);

-- RLS有効化
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own work sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work sessions"
  ON work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- updated_atトリガー
CREATE TRIGGER update_work_sessions_updated_at
  BEFORE UPDATE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE work_sessions IS 'Claude Codeでの作業セッションを記録するテーブル';
COMMENT ON COLUMN work_sessions.session_date IS '作業日';
COMMENT ON COLUMN work_sessions.start_time IS '作業開始時刻';
COMMENT ON COLUMN work_sessions.end_time IS '作業終了時刻';
COMMENT ON COLUMN work_sessions.duration_minutes IS '作業時間（分）';
COMMENT ON COLUMN work_sessions.description IS '作業内容の簡単な説明';
COMMENT ON COLUMN work_sessions.changes IS '変更されたファイルのリスト（JSON配列）';
