import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return { apiSettings: null };
	}

	// 既存のAPI設定を取得
	const { data: apiSettings } = await locals.supabase
		.from('api_settings')
		.select('*')
		.eq('user_id', session.user.id)
		.maybeSingle();

	// APIキーはマスクして返す（セキュリティのため）
	if (apiSettings?.gemini_api_key) {
		const maskedKey =
			apiSettings.gemini_api_key.substring(0, 8) +
			'*'.repeat(Math.max(0, apiSettings.gemini_api_key.length - 12)) +
			apiSettings.gemini_api_key.substring(apiSettings.gemini_api_key.length - 4);
		apiSettings.gemini_api_key = maskedKey;
	}

	return {
		apiSettings
	};
};

export const actions = {
	updateApiKey: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const geminiApiKey = formData.get('gemini_api_key') as string;

		// バリデーション
		if (!geminiApiKey || geminiApiKey.trim().length === 0) {
			return fail(400, { message: 'Gemini APIキーを入力してください' });
		}

		// 簡易的なAPIキーフォーマットチェック
		if (!geminiApiKey.startsWith('AIza') || geminiApiKey.length < 30) {
			return fail(400, { message: '無効なAPIキー形式です。Gemini APIキーは"AIza"で始まります' });
		}

		// 既存の設定をチェック
		const { data: existingSettings } = await locals.supabase
			.from('api_settings')
			.select('id')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (existingSettings) {
			// 更新
			const { error } = await locals.supabase
				.from('api_settings')
				.update({
					gemini_api_key: geminiApiKey,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', session.user.id);

			if (error) {
				return fail(500, { message: 'API設定の更新に失敗しました', error: error.message });
			}
		} else {
			// 新規作成
			const { error } = await locals.supabase.from('api_settings').insert({
				user_id: session.user.id,
				gemini_api_key: geminiApiKey
			});

			if (error) {
				return fail(500, { message: 'API設定の作成に失敗しました', error: error.message });
			}
		}

		return { success: true, message: 'Gemini APIキーを保存しました' };
	},

	testApiKey: async ({ locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		// APIキーを取得
		const { data: apiSettings } = await locals.supabase
			.from('api_settings')
			.select('gemini_api_key')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (!apiSettings?.gemini_api_key) {
			return fail(400, { message: 'APIキーが設定されていません' });
		}

		try {
			// Gemini APIをテスト呼び出し
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiSettings.gemini_api_key}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						contents: [
							{
								parts: [
									{
										text: 'Hello'
									}
								]
							}
						]
					})
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				return fail(400, {
					message: 'APIキーが無効です',
					error: errorData.error?.message || 'Unknown error'
				});
			}

			return { success: true, message: 'APIキーは有効です！Gemini 2.0に接続できました' };
		} catch (error) {
			return fail(500, {
				message: 'API接続テストに失敗しました',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
} satisfies Actions;
