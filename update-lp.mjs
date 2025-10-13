// 総合心理教育研究所のLPを直接更新するスクリプト
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// .envファイルから設定を読み込む
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

const newSections = [
  {
    id: `section-${Date.now()}-1`,
    type: 'hero',
    order: 0,
    content: {
      title: '50年の実績が支える、企業のメンタルヘルス',
      subtitle: '総合心理教育研究所　THQ ストレスチェック',
      description: 'カナダ・ストレス研究所と連携し、30万人以上の臨床データに基づくメンタルヘルスサービスを提供。10,000社以上の企業・官公庁が導入する信頼のサービスです。',
      buttonText: '無料相談・お問い合わせ',
      buttonLink: '#contact'
    },
    style: {
      backgroundColor: '#1E40AF',
      textColor: '#FFFFFF'
    }
  },
  {
    id: `section-${Date.now()}-2`,
    type: 'stats',
    order: 1,
    content: {
      title: '信頼の実績',
      subtitle: '半世紀にわたる研究と実践',
      stats: [
        { value: '10,000+', label: '導入企業・官公庁', description: '幅広い業種で信頼' },
        { value: '50年', label: '研究・実践の歴史', description: 'ストレス科学の先駆者' },
        { value: '30万人+', label: '臨床データ', description: '科学的根拠に基づく' },
        { value: '90%+', label: '復職支援成功率', description: '確かなサポート体制' }
      ]
    },
    style: { backgroundColor: '#F3F4F6', textColor: '#1F2937' }
  },
  {
    id: `section-${Date.now()}-3`,
    type: 'features',
    order: 2,
    content: {
      title: '包括的なメンタルヘルスサービス',
      subtitle: 'ストレスチェックから復職支援まで、ワンストップで対応',
      features: [
        { iconName: 'ClipboardCheck', title: 'THQストレスチェック', description: '厚生労働省推奨の科学的ストレスチェック。Web上で実施・確認可能な職場診断と組織分析。高ストレス社員の早期発見と部署ごとの職務満足度測定が可能です。' },
        { iconName: 'GraduationCap', title: '企業・団体研修', description: 'ストレスチェック結果を活用した職場・個人のメンタルヘルス改善研修。セルフケア、ラインケアの実践的なスキルを習得いただけます。' },
        { iconName: 'MessageCircle', title: 'カウンセリング', description: '常勤の臨床心理士による専門的なカウンセリング。対面・電話・ビデオ会議から選択可能。遠隔地や海外拠点にも対応しています。' },
        { iconName: 'HeartHandshake', title: '復職支援', description: 'メンタル不調で休職された方の復職を段階的にサポート。産業医や人事部門と連携し、90%以上の成功率を実現しています。' }
      ]
    },
    style: { backgroundColor: '#FFFFFF', textColor: '#1F2937' }
  },
  {
    id: `section-${Date.now()}-4`,
    type: 'two_column_text_image',
    order: 3,
    content: {
      textColumn: {
        title: '代表からのメッセージ',
        subtitle: '代表　佐藤隆',
        description: '総合心理教育研究所は、カナダのストレス研究の父・ハンス・セリエ博士のストレス研究所と連携し、約50年にわたりストレス科学と産業メンタルヘルスの研究・教育・臨床に取り組んでまいりました。\n\n私自身も現場に立ち、研修やカウンセリングを実施しています。企業のメンタルヘルスは、従業員一人ひとりの幸福だけでなく、組織全体の生産性や持続的な成長に直結する重要な経営課題です。\n\n30万人を超える臨床データと科学的根拠に基づいた当研究所のサービスで、貴社の従業員と組織の健康をサポートいたします。',
        buttonText: 'サービス詳細',
        buttonLink: '#services'
      },
      imageColumn: {
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop',
        imageAlt: '代表 佐藤隆',
        caption: ''
      },
      layout: { ratio: '50-50' }
    },
    style: { backgroundColor: '#EFF6FF', textColor: '#1F2937' }
  },
  {
    id: `section-${Date.now()}-5`,
    type: 'testimonials',
    order: 4,
    content: {
      title: '導入企業様の声',
      subtitle: '多くの企業様から高い評価をいただいています',
      testimonials: [
        { name: '田中健一', position: '人事部長', company: '製造業A社（従業員500名）', content: 'THQストレスチェックの導入により、従業員のストレス状態を可視化でき、早期発見・早期対応が可能になりました。復職支援プログラムの成功率の高さにも驚いています。', rating: 5 },
        { name: '山田美穂', position: '総務担当役員', company: 'IT企業B社（従業員200名）', content: '常勤の臨床心理士による質の高いカウンセリングサービスが従業員から好評です。電話やビデオ会議でも対応可能な点が、リモートワーク中心の当社には最適でした。', rating: 5 },
        { name: '佐々木誠', position: '代表取締役', company: 'サービス業C社（従業員80名）', content: '50年の歴史と10,000社以上の導入実績が決め手でした。研修内容も科学的根拠に基づいており、管理職のメンタルヘルスリテラシーが向上しています。', rating: 5 }
      ]
    },
    style: { backgroundColor: '#FFFFFF', textColor: '#1F2937' }
  },
  {
    id: `section-${Date.now()}-6`,
    type: 'faq',
    order: 5,
    content: {
      title: 'よくあるご質問',
      subtitle: 'お客様からよくいただく質問をまとめました',
      items: [
        { question: 'ストレスチェックの実施方法は？', answer: 'Web上で簡単に実施できます。従業員の方はパソコンやスマートフォンから回答し、結果もオンラインで確認できます。管理画面では組織分析も可能です。' },
        { question: 'カウンセリングはどこで受けられますか？', answer: '対面、電話、ビデオ会議（Zoom等）の3つの方法からお選びいただけます。遠隔地や海外拠点の従業員様にも対応可能です。' },
        { question: '復職支援の内容を教えてください', answer: 'メンタル不調で休職された方の段階的な復職をサポートします。産業医や人事部門と連携し、90%以上の成功率を誇るプログラムです。' },
        { question: '料金体系について教えてください', answer: '企業規模やご利用サービスに応じてカスタマイズいたします。まずは無料相談でご要望をお聞かせください。お気軽にお問い合わせください。' },
        { question: '導入までの期間は？', answer: 'お申し込みから最短2週間で導入可能です。ヒアリング、システム設定、社内説明会まで丁寧にサポートいたします。' },
        { question: 'どのような企業が導入していますか？', answer: '製造業、IT業、サービス業など、業種を問わず10,000社以上の企業・官公庁にご導入いただいています。従業員数50名から5,000名以上の企業まで幅広く対応しています。' }
      ]
    },
    style: { backgroundColor: '#F9FAFB', textColor: '#1F2937' }
  },
  {
    id: `section-${Date.now()}-7`,
    type: 'contact',
    order: 6,
    content: {
      title: '無料相談・お問い合わせ',
      description: '貴社の課題やご要望をお聞かせください。専門スタッフが最適なプランをご提案いたします。まずはお気軽にご相談ください。',
      formFields: [
        { name: 'company_name', label: '企業名', type: 'text', required: true },
        { name: 'name', label: 'ご担当者名', type: 'text', required: true },
        { name: 'position', label: '部署・役職', type: 'text', required: false },
        { name: 'email', label: 'メールアドレス', type: 'email', required: true },
        { name: 'phone', label: '電話番号', type: 'tel', required: true },
        { name: 'employee_count', label: '従業員数', type: 'select', required: true, options: ['50名以下', '51-100名', '101-300名', '301-500名', '501-1000名', '1001名以上'] },
        { name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true }
      ],
      submitButtonText: '送信する',
      privacyText: '個人情報の取り扱いについては、プライバシーポリシーをご確認ください。'
    },
    style: { backgroundColor: '#EFF6FF', textColor: '#1F2937' }
  }
];

async function updateLP() {
  console.log('🚀 LPの更新を開始します...');
  console.log(`📝 LP ID: ${LP_ID}`);

  try {
    const { data, error } = await supabase
      .from('landing_pages')
      .update({
        content: { sections: newSections },
        updated_at: new Date().toISOString()
      })
      .eq('id', LP_ID)
      .select();

    if (error) {
      console.error('❌ エラーが発生しました:', error);
      return;
    }

    console.log('✅ LPの更新に成功しました！');
    console.log(`📊 更新されたセクション数: ${newSections.length}`);
    console.log('\n🎉 完了！ブラウザでページをリロードして確認してください。');
    console.log(`🔗 URL: http://localhost:5173/dashboard/landing-pages/${LP_ID}/edit`);

  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }
}

updateLP();
