import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
