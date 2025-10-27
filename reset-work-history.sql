-- 作業履歴の全データを削除
DELETE FROM work_sessions;

-- 削除結果を確認
SELECT COUNT(*) as remaining_records FROM work_sessions;
