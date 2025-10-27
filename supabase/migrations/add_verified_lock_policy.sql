-- 検証済み作業セッションの更新・削除を防止するポリシー

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can update their own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can update unverified work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can delete their own work sessions" ON work_sessions;
DROP POLICY IF EXISTS "Users can delete unverified work sessions" ON work_sessions;

-- 検証されていないセッションのみ更新可能
CREATE POLICY "Users can update unverified work sessions"
  ON work_sessions FOR UPDATE
  USING (auth.uid() = user_id AND (verified = FALSE OR verified IS NULL));

-- 検証されていないセッションのみ削除可能
CREATE POLICY "Users can delete unverified work sessions"
  ON work_sessions FOR DELETE
  USING (auth.uid() = user_id AND (verified = FALSE OR verified IS NULL));

COMMENT ON POLICY "Users can update unverified work sessions" ON work_sessions IS '検証されていない作業セッションのみ更新可能';
COMMENT ON POLICY "Users can delete unverified work sessions" ON work_sessions IS '検証されていない作業セッションのみ削除可能';
