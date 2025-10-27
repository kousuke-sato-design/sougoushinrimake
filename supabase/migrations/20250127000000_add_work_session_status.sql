-- work_sessionsテーブルにstatus列を追加
-- draft: 下書き（開始時刻のみ記録）
-- completed: 完了（終了時刻・作業内容記録済み）

ALTER TABLE work_sessions
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft', 'completed'));

-- 既存のレコードはすべて completed とする
UPDATE work_sessions SET status = 'completed' WHERE status IS NULL;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions(status);

COMMENT ON COLUMN work_sessions.status IS '作業セッションの状態: draft (下書き) | completed (完了)';
