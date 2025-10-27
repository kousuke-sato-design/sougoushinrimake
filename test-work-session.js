// 作業セッション記録のテスト
// このスクリプトは作業履歴システムのテストデータを作成します

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://vqxbcnxzpwbtzukyswdn.supabase.co';
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeGJjbnh6cHdidHp1a3lzd2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjY4NDcsImV4cCI6MjA1MzU0Mjg0N30.RvC-VNdF6BpHZx9Cy4qWIp9M8XUPx-j7TxKL6T5-c9o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestWorkSession() {
  try {
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('ユーザーが見つかりません。先にログインしてください。');
      return;
    }

    console.log('ユーザーID:', user.id);

    // 作業セッションを作成（開始時刻から2時間30分の作業）
    const now = new Date();
    const startTime = new Date(now.getTime() - 2.5 * 60 * 60 * 1000); // 2.5時間前
    const durationMinutes = 150; // 2時間30分

    const { data, error } = await supabase
      .from('work_sessions')
      .insert({
        user_id: user.id,
        session_date: now.toISOString().split('T')[0],
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration_minutes: durationMinutes,
        description: '作業履歴システムの実装完了。ダッシュボードに作業開始/終了ボタンを追加、10分間のアイドル自動終了機能を実装、変更ファイルの自動トラッキング機能を追加。',
        changes: [
          'src/lib/stores/workSession.ts',
          'src/routes/dashboard/+page.svelte',
          'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte',
          'src/lib/types/work-history.ts',
          'src/lib/components/WorkHistory.svelte',
          'src/routes/dashboard/work-history/+page.svelte',
          'src/routes/dashboard/work-history/record/+page.svelte'
        ]
      })
      .select()
      .single();

    if (error) {
      console.error('エラー:', error);
      return;
    }

    console.log('✅ 作業セッションを記録しました:');
    console.log('  開始時刻:', startTime.toLocaleString('ja-JP'));
    console.log('  終了時刻:', now.toLocaleString('ja-JP'));
    console.log('  作業時間:', durationMinutes, '分 (', Math.floor(durationMinutes / 60), '時間', durationMinutes % 60, '分)');
    console.log('  変更ファイル:', data.changes.length, '個');
    console.log('\nダッシュボードの作業履歴で確認してください: http://localhost:5173/dashboard/work-history');

  } catch (e) {
    console.error('予期しないエラー:', e);
  }
}

createTestWorkSession();
