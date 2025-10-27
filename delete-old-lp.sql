-- 古いLP（section.idがundefinedのもの）を削除するSQL

-- 問題のあるLPのIDを確認
-- このLPは id = '8e7b3032-f02f-40e4-8924-9eda9abb2929'

-- 削除実行
DELETE FROM landing_pages
WHERE id = '8e7b3032-f02f-40e4-8924-9eda9abb2929';

-- または、すべての古いLPを削除する場合（注意！）
-- DELETE FROM landing_pages
-- WHERE created_at < '2025-10-27 04:35:00';
