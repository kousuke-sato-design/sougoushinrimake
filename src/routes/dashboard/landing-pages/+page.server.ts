import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return { landingPages: [] };
	}

	// ユーザーのLP一覧を取得（最新順）- sitesテーブルをJOINしてsite.slugも取得
	const { data: landingPages, error } = await locals.supabase
		.from('landing_pages')
		.select('id, title, slug, lp_type, status, content, site_id, user_id, created_at, updated_at, description, sites(slug)')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching landing pages:', error);
		return { landingPages: [] };
	}

	return {
		landingPages: landingPages || []
	};
};

export const actions = {
	toggleStatus: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const lpId = formData.get('lp_id') as string;
		const currentStatus = formData.get('current_status') as string;

		if (!lpId) {
			return fail(400, { message: 'LP IDが必要です' });
		}

		// ステータスを切り替え
		let newStatus: string;
		switch (currentStatus) {
			case 'draft':
				newStatus = 'published';
				break;
			case 'published':
				newStatus = 'draft';
				break;
			case 'archived':
				newStatus = 'published';
				break;
			default:
				newStatus = 'published';
		}

		// ステータスを更新
		const { error } = await locals.supabase
			.from('landing_pages')
			.update({ status: newStatus })
			.eq('id', lpId)
			.eq('user_id', session.user.id);

		if (error) {
			console.error('Error updating status:', error);
			return fail(500, { message: 'ステータスの更新に失敗しました' });
		}

		return { success: true, message: `ステータスを「${newStatus}」に変更しました` };
	}
} satisfies Actions;
