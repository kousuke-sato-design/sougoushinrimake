import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		return {
			stats: {
				totalLPs: 0,
				totalCustomers: 0,
				monthlyInquiries: 0,
				publishedLPs: 0,
				draftLPs: 0
			},
			recentLPs: []
		};
	}

	// LP総数を取得
	const { count: totalLPs } = await locals.supabase
		.from('landing_pages')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', user.id);

	// 公開中のLP数
	const { count: publishedLPs } = await locals.supabase
		.from('landing_pages')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.eq('status', 'published');

	// 下書きのLP数
	const { count: draftLPs } = await locals.supabase
		.from('landing_pages')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.eq('status', 'draft');

	// 総顧客数を取得
	const { count: totalCustomers } = await locals.supabase
		.from('customers')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', user.id);

	// 今月の問い合わせ数（今月作成された顧客数）
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
	const { count: monthlyInquiries } = await locals.supabase
		.from('customers')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.gte('created_at', startOfMonth);

	// 最近のLP（最新5件）
	const { data: recentLPs } = await locals.supabase
		.from('landing_pages')
		.select('id, title, status, created_at, updated_at')
		.eq('user_id', user.id)
		.order('updated_at', { ascending: false })
		.limit(5);

	return {
		stats: {
			totalLPs: totalLPs || 0,
			totalCustomers: totalCustomers || 0,
			monthlyInquiries: monthlyInquiries || 0,
			publishedLPs: publishedLPs || 0,
			draftLPs: draftLPs || 0
		},
		recentLPs: recentLPs || []
	};
};
