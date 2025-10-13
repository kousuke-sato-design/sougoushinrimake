import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		throw redirect(303, '/');
	}

	// ユーザーのサイト一覧を取得
	const { data: sites, error } = await locals.supabase
		.from('sites')
		.select('*')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching sites:', error);
	}

	// 各サイトのLP数を取得
	const sitesWithLPCount = await Promise.all(
		(sites || []).map(async (site) => {
			const { count } = await locals.supabase
				.from('landing_pages')
				.select('*', { count: 'exact', head: true })
				.eq('site_id', site.id);

			return {
				...site,
				lp_count: count || 0
			};
		})
	);

	return {
		sites: sitesWithLPCount
	};
};
