import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		throw redirect(303, '/');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;

		// バリデーション
		if (!name || name.trim().length === 0) {
			return fail(400, { message: 'サイト名は必須です', name, slug, description });
		}

		if (!slug || slug.trim().length === 0) {
			return fail(400, { message: 'スラッグは必須です', name, slug, description });
		}

		// スラッグの形式チェック（英数字とハイフンのみ）
		if (!/^[a-z0-9-]+$/.test(slug)) {
			return fail(400, {
				message: 'スラッグは英数字とハイフンのみ使用できます',
				name,
				slug,
				description
			});
		}

		// スラッグの重複チェック
		const { data: existingSite } = await locals.supabase
			.from('sites')
			.select('id')
			.eq('slug', slug)
			.maybeSingle();

		if (existingSite) {
			return fail(400, {
				message: 'このスラッグは既に使用されています',
				name,
				slug,
				description
			});
		}

		// サイトを作成
		const { data: newSite, error } = await locals.supabase
			.from('sites')
			.insert({
				user_id: session.user.id,
				name,
				slug,
				description: description || null
			})
			.select()
			.single();

		if (error) {
			console.error('Site creation error:', error);
			return fail(500, { message: 'サイトの作成に失敗しました', error: error.message });
		}

		// サイト一覧にリダイレクト
		throw redirect(303, '/dashboard/sites');
	}
};
