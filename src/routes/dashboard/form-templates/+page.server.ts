import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return { templates: [], customerCounts: {} };
	}

	// フォームテンプレート一覧を取得
	const { data: templates } = await locals.supabase
		.from('form_templates')
		.select('*')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	// 各テンプレートに紐づく顧客数を取得
	const customerCounts: Record<string, number> = {};

	if (templates && templates.length > 0) {
		// 全顧客データを取得してフィルタリング（デバッグ用）
		const { data: allCustomers } = await locals.supabase
			.from('customers')
			.select('custom_fields')
			.eq('user_id', session.user.id);

		console.log('All customers custom_fields:', JSON.stringify(allCustomers, null, 2));

		for (const template of templates) {
			// カウント方法1: contains を使用
			const { count: containsCount, error: containsError } = await locals.supabase
				.from('customers')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', session.user.id)
				.contains('custom_fields', { _meta: { form_template_id: template.id } });

			console.log(`Template ${template.name} (${template.id}):`, {
				containsCount,
				containsError
			});

			// カウント方法2: クライアントサイドでフィルタリング
			const filteredCount = allCustomers?.filter(
				c => c.custom_fields?._meta?.form_template_id === template.id
			).length || 0;

			console.log(`Filtered count for ${template.name}:`, filteredCount);

			customerCounts[template.id] = filteredCount;
		}
	}

	return {
		templates: templates || [],
		customerCounts
	};
};
