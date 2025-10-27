-- work_sessionsテーブルのRLSポリシーを修正
-- UPDATEポリシーにWITH CHECKを追加

-- 既存のUPDATEポリシーを削除
DROP POLICY IF EXISTS "Users can update their own work sessions" ON work_sessions;

-- 新しいUPDATEポリシーを作成（WITH CHECKを追加）
CREATE POLICY "Users can update their own work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETEポリシーも追加（念のため）
DROP POLICY IF EXISTS "Users can delete their own work sessions" ON work_sessions;

CREATE POLICY "Users can delete their own work sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE work_sessions IS 'Claude Codeでの作業セッションを記録するテーブル（RLS修正版）';
