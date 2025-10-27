import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recordTodayWork() {
  // 今日の作業を記録
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - 2); // 2時間前に開始したと仮定
  
  const endTime = new Date();
  const durationMinutes = Math.round((endTime - startTime) / 60000);

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('User not authenticated. Please login first.');
    return;
  }

  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      user_id: user.id,
      session_date: new Date().toISOString().split('T')[0],
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      description: '作業履歴システムを実装: サイドバーメニュー追加、work_sessionsテーブル作成、作業時間計測機能、UIコンポーネント作成、CLAUDE.mdに記録ルール追記',
      changes: [
        'src/routes/dashboard/+layout.svelte',
        'src/routes/dashboard/work-history/+page.svelte',
        'src/lib/components/WorkHistory.svelte',
        'src/lib/types/work-history.ts',
        'src/lib/utils/workSession.ts',
        'supabase/migrations/update_work_history.sql',
        'CLAUDE.md'
      ]
    })
    .select();

  if (error) {
    console.error('Error recording work session:', error);
  } else {
    console.log('Successfully recorded today\'s work session:', data);
    console.log(`Duration: ${durationMinutes} minutes`);
  }
}

recordTodayWork();
