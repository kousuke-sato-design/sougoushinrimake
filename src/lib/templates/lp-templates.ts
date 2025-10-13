// LPテンプレート定義

import type { Section } from '$lib/types/sections';

export interface LPTemplate {
	id: string;
	name: string;
	description: string;
	thumbnail?: string;
	lpType: 'product_lp' | 'benefit_page' | 'whitepaper';
	sections: Section[];
}

// 商品LP用テンプレート
export const productLPTemplate: LPTemplate = {
	id: 'product-basic',
	name: '商品LP（基本テンプレート）',
	description: 'ヒーロー、特徴、CTAセクションを含む標準的な商品LPテンプレート',
	lpType: 'product_lp',
	sections: [
		{
			id: 'template-product-hero',
			type: 'hero',
			order: 0,
			content: {
				title: 'あなたのビジネスを次のレベルへ',
				subtitle: '革新的なソリューションで成果を最大化',
				description: '私たちの製品は、お客様のビジネス課題を解決し、成長を加速させます。',
				buttonText: 'お問い合わせ',
				buttonLink: './contact'
			}
		},
		{
			id: 'template-product-features',
			type: 'features',
			order: 1,
			content: {
				title: '選ばれる3つの理由',
				features: [
					{
						iconName: 'Zap',
						title: '高速パフォーマンス',
						description: '業界最速の処理速度で、あなたの業務効率を劇的に向上させます。'
					},
					{
						iconName: 'Shield',
						title: '安心のセキュリティ',
						description: 'エンタープライズグレードのセキュリティで、大切なデータを保護します。'
					},
					{
						iconName: 'Users',
						title: '充実のサポート',
						description: '専任のサポートチームが、導入から運用まで手厚くサポートします。'
					}
				]
			}
		},
		{
			id: 'template-product-cta',
			type: 'cta',
			order: 2,
			content: {
				title: '今すぐ始めて、ビジネスを加速させましょう',
				description: '無料トライアルで、その効果を体験してください。',
				buttonText: 'お問い合わせはこちら',
				buttonLink: './contact'
			}
		}
	]
};

// 特典ページ用テンプレート
export const benefitPageTemplate: LPTemplate = {
	id: 'benefit-basic',
	name: '特典ページ（基本テンプレート）',
	description: 'ヒーロー、特典内容、CTAセクションを含む特典獲得ページテンプレート',
	lpType: 'benefit_page',
	sections: [
		{
			id: 'template-benefit-hero',
			type: 'hero',
			order: 0,
			content: {
				title: '限定特典をプレゼント！',
				subtitle: '今だけ！無料で豪華特典をゲット',
				description: 'お申し込みいただいた方全員に、ビジネスに役立つ限定特典を無料でプレゼントいたします。',
				buttonText: '今すぐ特典を受け取る',
				buttonLink: '#contact'
			}
		},
		{
			id: 'template-benefit-features',
			type: 'features',
			order: 1,
			content: {
				title: '豪華特典の内容',
				features: [
					{
						iconName: 'Gift',
						title: '特典1：実践ガイドブック',
						description: '今すぐ使える実践的なノウハウを詰め込んだガイドブックをプレゼント。'
					},
					{
						iconName: 'Video',
						title: '特典2：動画セミナー',
						description: '専門家による動画セミナーで、さらに深く学べます。'
					},
					{
						iconName: 'Headphones',
						title: '特典3：個別相談サポート',
						description: '30分の無料個別相談で、あなたのお悩みを解決します。'
					}
				]
			}
		},
		{
			id: 'template-benefit-cta',
			type: 'cta',
			order: 2,
			content: {
				title: '今すぐ特典を受け取ってください',
				description: '限定特典は今だけ！お早めにお申し込みください。',
				buttonText: '無料で特典を受け取る',
				buttonLink: '#contact'
			}
		}
	]
};

// ホワイトペーパー用テンプレート
export const whitepaperTemplate: LPTemplate = {
	id: 'whitepaper-basic',
	name: 'ホワイトペーパー（基本テンプレート）',
	description: 'ヒーロー、資料内容、ダウンロードフォームを含むホワイトペーパーダウンロードページテンプレート',
	lpType: 'whitepaper',
	sections: [
		{
			id: 'template-whitepaper-hero',
			type: 'hero',
			order: 0,
			content: {
				title: '無料ホワイトペーパーをダウンロード',
				subtitle: 'ビジネス成功のための実践ガイド',
				description: '業界のプロが作成した、実践的なノウハウが詰まったホワイトペーパーを無料でダウンロードできます。',
				buttonText: 'ホワイトペーパーをダウンロード',
				buttonLink: '#contact'
			}
		},
		{
			id: 'template-whitepaper-features',
			type: 'features',
			order: 1,
			content: {
				title: 'このホワイトペーパーで得られること',
				features: [
					{
						iconName: 'BookOpen',
						title: '実践的なノウハウ',
						description: '今すぐ使える実践的なテクニックと戦略をご紹介します。'
					},
					{
						iconName: 'TrendingUp',
						title: 'データに基づく分析',
						description: '最新のデータと統計に基づいた信頼性の高い情報を提供します。'
					},
					{
						iconName: 'Award',
						title: '専門家の知見',
						description: '業界の第一線で活躍する専門家による貴重な知見が満載です。'
					}
				]
			}
		},
		{
			id: 'template-whitepaper-contact',
			type: 'contact',
			order: 2,
			content: {
				title: 'ホワイトペーパーをダウンロード',
				description: '以下のフォームに必要事項を入力して、ホワイトペーパーをダウンロードしてください。',
				formFields: [
					{ name: 'name', label: 'お名前', type: 'text', required: true },
					{ name: 'email', label: 'メールアドレス', type: 'email', required: true },
					{ name: 'company', label: '会社名', type: 'text', required: true },
					{ name: 'position', label: '役職', type: 'text', required: false },
					{ name: 'message', label: 'ご質問・ご要望', type: 'textarea', required: false }
				]
			}
		}
	]
};

// すべてのテンプレート
export const allTemplates: LPTemplate[] = [
	productLPTemplate,
	benefitPageTemplate,
	whitepaperTemplate
];

// LPタイプに応じたテンプレートを取得
export function getTemplatesByType(lpType: 'product_lp' | 'benefit_page' | 'whitepaper'): LPTemplate[] {
	return allTemplates.filter(t => t.lpType === lpType);
}

// テンプレートIDで取得
export function getTemplateById(id: string): LPTemplate | undefined {
	return allTemplates.find(t => t.id === id);
}
