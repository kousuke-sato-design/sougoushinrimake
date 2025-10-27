import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqxbcnxzpwbtzukyswdn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeGJjbnh6cHdidHp1a3lzd2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjY4NDcsImV4cCI6MjA1MzU0Mjg0N30.RvC-VNdF6BpHZx9Cy4qWIp9M8XUPx-j7TxKL6T5-c9o';

// ここにユーザーのアクセストークンを設定してください
const userAccessToken = process.argv[2];

if (!userAccessToken) {
  console.error('使用方法: node record-work.mjs <access_token>');
  console.error('ブラウザの開発者ツールでlocalStorageから "sb-vqxbcnxzpwbtzukyswdn-auth-token" を取得してください');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${userAccessToken}`
    }
  }
});

async function recordWork() {
  try {
    // 現在時刻と2時間30分前を計算
    const now = new Date();
    const startTime = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
    const durationMinutes = 150;

    const { data, error } = await supabase
      .from('work_sessions')
      .insert({
        session_date: now.toISOString().split('T')[0],
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration_minutes: durationMinutes,
        description: '作業履歴システムの完全実装。ダッシュボードに作業セッション管理UI追加、10分間アイドル自動終了機能実装、LP編集での変更自動トラッキング機能実装。',
        changes: [
          'src/lib/stores/workSession.ts - 作業セッションストア作成',
          'src/routes/dashboard/+page.svelte - 作業開始/終了UI実装',
          'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte - 自動記録機能追加',
          'src/lib/types/work-history.ts - 型定義',
          'src/lib/components/WorkHistory.svelte - 履歴表示コンポーネント',
          'src/routes/dashboard/work-history/+page.svelte - 履歴ページ',
          'src/routes/dashboard/work-history/record/+page.svelte - 手動記録ページ'
        ]
      })
      .select()
      .single();

    if (error) {
      console.error('❌ エラー:', error.message);
      return;
    }

    console.log('✅ 作業セッションを記録しました!');
    console.log('📅 日付:', data.session_date);
    console.log('⏰ 開始:', new Date(data.start_time).toLocaleString('ja-JP'));
    console.log('⏰ 終了:', new Date(data.end_time).toLocaleString('ja-JP'));
    console.log('⏱️  時間:', Math.floor(data.duration_minutes / 60), '時間', data.duration_minutes % 60, '分');
    console.log('📝 説明:', data.description);
    console.log('📁 変更:', data.changes.length, 'ファイル');
    console.log('\n✨ http://localhost:5173/dashboard/work-history で確認できます');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}

recordWork();
