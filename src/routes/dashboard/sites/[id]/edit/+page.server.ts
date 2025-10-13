import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.getSession();
	if (!session) {
		throw redirect(303, '/');
	}

	const { id } = params;

	// サイト情報を取得
	const { data: site, error: siteError } = await locals.supabase
		.from('sites')
		.select('*')
		.eq('id', id)
		.eq('user_id', session.user.id)
		.single();

	if (siteError || !site) {
		throw error(404, 'サイトが見つかりません');
	}

	// このサイトに紐づくLP数を取得
	const { count: lpCount } = await locals.supabase
		.from('landing_pages')
		.select('*', { count: 'exact', head: true })
		.eq('site_id', id);

	// このサイトに紐づくLP一覧を取得
	const { data: landingPages } = await locals.supabase
		.from('landing_pages')
		.select('id, title, slug, lp_type, status, created_at, updated_at')
		.eq('site_id', id)
		.order('updated_at', { ascending: false });

	return {
		site,
		lpCount: lpCount || 0,
		landingPages: landingPages || []
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const { id } = params;
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

		// スラッグの形式チェック
		if (!/^[a-z0-9-]+$/.test(slug)) {
			return fail(400, {
				message: 'スラッグは英数字とハイフンのみ使用できます',
				name,
				slug,
				description
			});
		}

		// スラッグの重複チェック（自分以外）
		const { data: existingSite } = await locals.supabase
			.from('sites')
			.select('id')
			.eq('slug', slug)
			.neq('id', id)
			.maybeSingle();

		if (existingSite) {
			return fail(400, {
				message: 'このスラッグは既に使用されています',
				name,
				slug,
				description
			});
		}

		// サイトを更新
		const { error: updateError } = await locals.supabase
			.from('sites')
			.update({
				name,
				slug,
				description: description || null
			})
			.eq('id', id)
			.eq('user_id', session.user.id);

		if (updateError) {
			console.error('Site update error:', updateError);
			return fail(500, { message: 'サイトの更新に失敗しました', error: updateError.message });
		}

		return { success: true, message: 'サイトを更新しました' };
	},

	delete: async ({ params, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const { id } = params;

		// サイトを削除（カスケードでLPも削除される）
		const { error: deleteError } = await locals.supabase
			.from('sites')
			.delete()
			.eq('id', id)
			.eq('user_id', session.user.id);

		if (deleteError) {
			console.error('Site deletion error:', deleteError);
			return fail(500, { message: 'サイトの削除に失敗しました', error: deleteError.message });
		}

		// サイト一覧にリダイレクト
		throw redirect(303, '/dashboard/sites');
	}
};
