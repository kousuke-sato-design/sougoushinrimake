import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	// すでにログインしている場合はダッシュボードへ
	if (session) {
		throw redirect(303, '/dashboard');
	}

	return {};
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return { success: false, error: error.message };
		}

		throw redirect(303, '/dashboard');
	},

	signup: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${request.url.split('/')[0]}//${request.url.split('/')[2]}/auth/confirm`
			}
		});

		if (error) {
			return { success: false, error: error.message };
		}

		// メール確認が不要な場合（開発環境でConfirm emailがOFFの場合）
		if (data.session) {
			throw redirect(303, '/dashboard');
		}

		return {
			success: true,
			message:
				'登録が完了しました。メールを確認してアカウントを有効化してください。メールが届かない場合は、Supabase Dashboardで「Confirm email」設定を確認してください。'
		};
	}
};
