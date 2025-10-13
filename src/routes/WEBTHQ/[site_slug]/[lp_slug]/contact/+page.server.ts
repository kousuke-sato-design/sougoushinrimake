import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { site_slug, lp_slug } = params;

	// サイト情報を取得
	const { data: site, error: siteError } = await locals.supabase
		.from('sites')
		.select('*')
		.eq('slug', site_slug)
		.single();

	if (siteError || !site) {
		throw error(404, 'サイトが見つかりません');
	}

	// LP情報を取得
	const { data: landingPage, error: lpError } = await locals.supabase
		.from('landing_pages')
		.select('*')
		.eq('site_id', site.id)
		.eq('slug', lp_slug)
		.eq('status', 'published')
		.single();

	if (lpError || !landingPage) {
		throw error(404, 'ランディングページが見つかりません');
	}

	return {
		site,
		landingPage
	};
};

export const actions = {
	submit: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const company = formData.get('company') as string;
		const phone = formData.get('phone') as string;
		const message = formData.get('message') as string;

		// バリデーション
		if (!name || !email || !message) {
			return fail(400, {
				message: 'お名前、メールアドレス、お問い合わせ内容は必須です',
				success: false
			});
		}

		// メールアドレスの簡易バリデーション
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				message: '有効なメールアドレスを入力してください',
				success: false
			});
		}

		// サイトとLP情報を取得
		const { site_slug, lp_slug } = params;
		const { data: site } = await locals.supabase
			.from('sites')
			.select('id')
			.eq('slug', site_slug)
			.single();

		const { data: landingPage } = await locals.supabase
			.from('landing_pages')
			.select('id')
			.eq('slug', lp_slug)
			.eq('site_id', site?.id)
			.single();

		// お問い合わせデータをデータベースに保存（将来的に実装）
		// 今は簡易的にログだけ出力
		console.log('お問い合わせ受信:', {
			name,
			email,
			company,
			phone,
			message,
			site_id: site?.id,
			landing_page_id: landingPage?.id,
			created_at: new Date().toISOString()
		});

		// TODO: 後でcontactsテーブルを作成してデータを保存
		// TODO: メール通知機能を追加

		return {
			success: true,
			message: 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。'
		};
	}
} satisfies Actions;
