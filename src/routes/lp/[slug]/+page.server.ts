import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	// 公開されているLPを取得
	const { data: landingPage, error: fetchError } = await locals.supabase
		.from('landing_pages')
		.select('*')
		.eq('slug', params.slug)
		.eq('status', 'published')
		.single();

	if (fetchError || !landingPage) {
		throw error(404, 'ランディングページが見つかりません');
	}

	// contentがJSON文字列の場合はパース
	let parsedContent = landingPage.content;
	if (typeof landingPage.content === 'string') {
		try {
			parsedContent = JSON.parse(landingPage.content);
		} catch (e) {
			parsedContent = { sections: [] };
		}
	}

	// デバッグ: contentの構造を確認
	console.log('=== LP表示デバッグ ===');
	console.log('LPタイトル:', landingPage.title);
	console.log('content:', JSON.stringify(parsedContent, null, 2));

	// 企業情報を取得（ロゴやブランドカラー用）
	const { data: companyProfile } = await locals.supabase
		.from('company_profiles')
		.select('*')
		.eq('user_id', landingPage.user_id)
		.single();

	return {
		landingPage: {
			...landingPage,
			content: parsedContent
		},
		companyProfile
	};
};
