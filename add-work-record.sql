-- 作業セッションを記録
-- 注意: user_id は実際のユーザーIDに置き換えてください

INSERT INTO work_sessions (
  user_id,
  session_date,
  start_time,
  end_time,
  duration_minutes,
  description,
  changes
)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- 最初のユーザー
  CURRENT_DATE,
  NOW() - INTERVAL '2 hours 30 minutes',
  NOW(),
  150,
  '作業履歴システムの完全実装。ダッシュボードに作業セッション管理UI追加、10分間アイドル自動終了機能実装、LP編集での変更自動トラッキング機能実装。',
  '["src/lib/stores/workSession.ts - 作業セッションストア作成", "src/routes/dashboard/+page.svelte - 作業開始/終了UI実装", "src/routes/dashboard/landing-pages/[id]/edit/+page.svelte - 自動記録機能追加", "src/lib/types/work-history.ts - 型定義更新", "src/lib/components/WorkHistory.svelte - 履歴表示", "src/routes/dashboard/work-history/+page.svelte - 履歴ページ", "src/routes/dashboard/work-history/record/+page.svelte - 手動記録ページ"]'::jsonb
)
RETURNING
  id,
  session_date,
  to_char(start_time, 'YYYY-MM-DD HH24:MI') as start_time,
  to_char(end_time, 'YYYY-MM-DD HH24:MI') as end_time,
  duration_minutes,
  description;
