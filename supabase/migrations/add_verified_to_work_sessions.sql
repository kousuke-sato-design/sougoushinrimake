-- work_sessionsテーブルにverifiedカラムを追加
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- verification_sourceカラムも追加（どの方法で検証されたか）
ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS verification_source TEXT;

COMMENT ON COLUMN work_sessions.verified IS '作業時間が実際の活動ログで検証されているか';
COMMENT ON COLUMN work_sessions.verification_source IS '検証方法（git_commit, file_modification, database_activity等）';
