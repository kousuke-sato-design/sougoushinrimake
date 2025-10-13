import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	// 未認証の場合はログインページへリダイレクト
	if (!session) {
		throw redirect(303, '/');
	}

	return {
		session
	};
};
