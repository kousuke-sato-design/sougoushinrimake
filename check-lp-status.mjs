// 現在のLPの状態を確認するスクリプト
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LP_ID = 'a54f0f38-c15e-4e41-8a72-1bbc3a20d639';

async function checkLP() {
  console.log('🔍 LPの状態を確認しています...\n');

  const { data, error } = await supabase
    .from('landing_pages')
    .select('id, title, slug, status, lp_type, site_id, content, sites(name, slug)')
    .eq('id', LP_ID)
    .single();

  if (error) {
    console.error('❌ エラー:', error);
    return;
  }

  console.log('📄 LP情報:');
  console.log('  タイトル:', data.title);
  console.log('  スラッグ:', data.slug);
  console.log('  ステータス:', data.status);
  console.log('  LPタイプ:', data.lp_type);
  console.log('  サイト:', data.sites?.name, `(${data.sites?.slug})`);

  console.log('\n📊 セクション情報:');
  if (data.content && data.content.sections) {
    console.log(`  セクション数: ${data.content.sections.length}個`);
    data.content.sections.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.type} (ID: ${section.id})`);
    });
  } else {
    console.log('  ⚠️ セクションがありません');
  }

  console.log('\n🌐 公開URL:');
  if (data.sites && data.slug) {
    const publicUrl = `http://localhost:5173/WEBTHQ/${data.sites.slug}/${data.slug}`;
    console.log(`  ${publicUrl}`);
  }

  console.log('\n✏️ 編集URL:');
  console.log(`  http://localhost:5173/dashboard/landing-pages/${LP_ID}/edit`);

  // ステータスが公開中でない場合、公開に変更するか確認
  if (data.status !== 'published') {
    console.log('\n⚠️ 現在のステータスは「' + data.status + '」です。');
    console.log('💡 公開するには、ステータスを「published」に変更してください。');
  } else {
    console.log('\n✅ ステータスは「published」です。公開ページでアクセスできます。');
  }
}

checkLP();
