-- 10月25日の作業セッションを削除
DELETE FROM work_sessions
WHERE session_date = '2025-10-25'
RETURNING id, session_date, description;
