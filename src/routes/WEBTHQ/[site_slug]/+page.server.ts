import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { site_slug } = params;

	console.log('🔍 Loading site with slug:', site_slug);

	// サイト情報を取得
	const { data: site, error: siteError } = await locals.supabase
		.from('sites')
		.select('*')
		.eq('slug', site_slug)
		.single();

	if (siteError || !site) {
		console.error('❌ Site not found:', siteError);
		throw error(404, 'サイトが見つかりません');
	}

	console.log('✅ Site found:', site);

	// このサイトに属する公開済みLPを取得
	const { data: landingPages, error: lpError } = await locals.supabase
		.from('landing_pages')
		.select('id, title, description, slug, lp_type, created_at, updated_at, site_id, status')
		.eq('site_id', site.id)
		.eq('status', 'published')
		.order('created_at', { ascending: false });

	console.log('📄 Landing pages query result:', {
		siteId: site.id,
		lpCount: landingPages?.length || 0,
		landingPages,
		lpError
	});

	if (lpError) {
		console.error('❌ Error fetching landing pages:', lpError);
	}

	return {
		site,
		landingPages: landingPages || []
	};
};
