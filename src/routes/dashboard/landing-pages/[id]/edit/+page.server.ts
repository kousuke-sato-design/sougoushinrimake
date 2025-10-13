import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { generateSectionWithGemini, validateSection } from '$lib/utils/ai';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: landingPage, error: lpError } = await locals.supabase
		.from('landing_pages')
		.select('id, title, slug, lp_type, status, content, site_id, user_id, created_at, updated_at, sites(id, name, slug)')
		.eq('id', params.id)
		.single();

	if (lpError || !landingPage) {
		throw error(404, 'ランディングページが見つかりません');
	}

	// 所有者チェック
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user || landingPage.user_id !== user.id) {
		throw error(403, 'このページを編集する権限がありません');
	}

	// アクティブなAPIキー取得
	const { data: activeApiKey } = await locals.supabase
		.from('user_api_keys')
		.select('id, key_name, model, is_active')
		.eq('user_id', user.id)
		.eq('is_active', true)
		.maybeSingle();

	// 全てのAPIキー一覧を取得
	const { data: apiKeys } = await locals.supabase
		.from('user_api_keys')
		.select('id, key_name, model, is_active')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	// 編集履歴を取得（最新50件）- テーブルが存在しない場合はスキップ
	let editHistory: any[] = [];
	try {
		const { data } = await locals.supabase
			.from('lp_edit_history')
			.select('*')
			.eq('landing_page_id', params.id)
			.order('created_at', { ascending: false })
			.limit(50);
		editHistory = data || [];
	} catch (e) {
		console.log('Edit history table not found, skipping...');
	}

	// AI会話履歴を取得（最新100件）- テーブルが存在しない場合はスキップ
	let conversationHistory: any[] = [];
	try {
		const { data } = await locals.supabase
			.from('ai_conversation_history')
			.select('*')
			.eq('landing_page_id', params.id)
			.order('created_at', { ascending: false })
			.limit(100);
		conversationHistory = data || [];
	} catch (e) {
		console.log('Conversation history table not found, skipping...');
	}

	return {
		landingPage,
		apiKeys: apiKeys || [],
		activeApiKey: activeApiKey,
		hasApiKey: !!activeApiKey,
		model: activeApiKey?.model || 'gemini-pro',
		editHistory,
		conversationHistory
	};
};

export const actions: Actions = {
	updateContent: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const content = formData.get('content');

		if (!content) {
			return fail(400, { message: 'コンテンツが必要です' });
		}

		let parsedContent;
		try {
			parsedContent = JSON.parse(content as string);
		} catch (e) {
			return fail(400, { message: 'コンテンツのJSON形式が不正です' });
		}

		// ユーザー取得
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { message: 'ログインが必要です' });
		}

		// 現在のコンテンツを取得（履歴保存用）
		const { data: currentLP } = await locals.supabase
			.from('landing_pages')
			.select('content')
			.eq('id', params.id)
			.single();

		// コンテンツを更新
		const { error: updateError } = await locals.supabase
			.from('landing_pages')
			.update({
				content: parsedContent,
				updated_at: new Date().toISOString()
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { message: 'コンテンツの更新に失敗しました', error: updateError.message });
		}

		// 編集履歴を保存（テーブルがない場合はスキップ）
		try {
			await locals.supabase.from('lp_edit_history').insert({
				landing_page_id: params.id,
				user_id: user.id,
				action_type: 'update',
				content_before: currentLP?.content,
				content_after: parsedContent,
				change_summary: 'LPコンテンツを更新'
			});
		} catch (e) {
			console.log('Could not save edit history:', e);
		}

		return { success: true, message: 'コンテンツを更新しました' };
	},

	updateStatus: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const status = formData.get('status');

		if (!status || !['draft', 'published', 'archived'].includes(status as string)) {
			return fail(400, { message: '有効なステータスを選択してください' });
		}

		const { error: updateError } = await locals.supabase
			.from('landing_pages')
			.update({
				status: status as string,
				updated_at: new Date().toISOString()
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(500, { message: 'ステータスの更新に失敗しました', error: updateError.message });
		}

		return { success: true, message: 'ステータスを更新しました' };
	},

	delete: async ({ locals, params }) => {
		const { error: deleteError } = await locals.supabase
			.from('landing_pages')
			.delete()
			.eq('id', params.id);

		if (deleteError) {
			return fail(500, { message: 'LPの削除に失敗しました', error: deleteError.message });
		}

		throw redirect(303, '/dashboard/landing-pages');
	},

	generateWithAI: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const prompt = formData.get('prompt') as string;
		const existingSectionsJson = formData.get('existingSections') as string;
		const conversationHistoryJson = formData.get('conversationHistory') as string | null;

		if (!prompt) {
			return fail(400, { message: 'プロンプトを入力してください' });
		}

		// ユーザーとAPIキー取得
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { message: 'ログインが必要です' });
		}

		// API key IDを取得（オプション）
		const apiKeyId = formData.get('apiKeyId') as string | null;

		let apiKeyData;
		if (apiKeyId) {
			// 指定されたAPIキーを取得
			const { data } = await locals.supabase
				.from('user_api_keys')
				.select('api_key, model')
				.eq('user_id', user.id)
				.eq('id', apiKeyId)
				.maybeSingle();
			apiKeyData = data;
		} else {
			// アクティブなAPIキーを取得
			const { data } = await locals.supabase
				.from('user_api_keys')
				.select('api_key, model')
				.eq('user_id', user.id)
				.eq('is_active', true)
				.maybeSingle();
			apiKeyData = data;
		}

		if (!apiKeyData?.api_key) {
			return fail(400, { message: 'APIキーが設定されていません。/dashboard/ai-api でAPIキーを登録してください。' });
		}

		// LP情報取得
		const { data: landingPage } = await locals.supabase
			.from('landing_pages')
			.select('lp_type, title')
			.eq('id', params.id)
			.single();

		try {
			const existingSections = existingSectionsJson ? JSON.parse(existingSectionsJson) : [];
			const conversationHistory = conversationHistoryJson ? JSON.parse(conversationHistoryJson) : [];

			// ユーザーメッセージを会話履歴に保存（テーブルがない場合はスキップ）
			try {
				await locals.supabase.from('ai_conversation_history').insert({
					landing_page_id: params.id,
					user_id: user.id,
					role: 'user',
					content: prompt,
					model: apiKeyData.model || 'gemini-pro'
				});
			} catch (e) {
				console.log('Could not save conversation history:', e);
			}

			// 新しい会話型AI関数を使用
			const { generateWithConversation } = await import('$lib/utils/ai');

			// モデル名から "models/" プレフィックスを削除（APIのURLに既に含まれているため）
			let modelName = apiKeyData.model || 'gemini-1.5-flash-latest';
			if (modelName.startsWith('models/')) {
				modelName = modelName.substring(7); // "models/" を削除
			}

			console.log('Using model:', modelName, 'Original:', apiKeyData.model);

			const result = await generateWithConversation(
				apiKeyData.api_key,
				modelName,
				{
					prompt,
					conversationHistory,
					existingSections,
					lpType: landingPage?.lp_type as any
				}
			);

			// AIの応答を会話履歴に保存（テーブルがない場合はスキップ）
			try {
				await locals.supabase.from('ai_conversation_history').insert({
					landing_page_id: params.id,
					user_id: user.id,
					role: 'assistant',
					content: result.message,
					sections_generated: result.sections.length > 0 ? result.sections : null,
					model: apiKeyData.model || 'gemini-pro'
				});
			} catch (e) {
				console.log('Could not save conversation history:', e);
			}

			// ログ記録（既存）
			await locals.supabase.from('ai_generation_logs').insert({
				user_id: user.id,
				landing_page_id: params.id,
				prompt,
				response: JSON.stringify({
					message: result.message,
					sections: result.sections
				}),
				model: apiKeyData.model || 'gemini-pro'
			});

			// セクションが生成された場合は編集履歴も保存（テーブルがない場合はスキップ）
			if (result.sections.length > 0) {
				try {
					await locals.supabase.from('lp_edit_history').insert({
						landing_page_id: params.id,
						user_id: user.id,
						action_type: 'add_section',
						content_after: { sections: result.sections },
						change_summary: `AI生成: ${result.sections.length}個のセクションを追加`
					});
				} catch (e) {
					console.log('Could not save edit history:', e);
				}
			}

			return {
				success: true,
				message: result.message,
				sections: result.sections
			};
		} catch (error: any) {
			console.error('AI generation error details:', {
				error: error.message,
				stack: error.stack,
				apiKeyExists: !!apiKeyData?.api_key,
				model: apiKeyData?.model
			});

			return fail(500, {
				message: `AIによる生成中にエラーが発生しました: ${error.message}`,
				error: error.message,
				details: error.stack
			});
		}
	},

	saveAsTemplate: async ({ request, locals, params }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { message: 'ログインが必要です' });
		}

		const formData = await request.formData();
		const templateName = formData.get('templateName') as string;
		const templateDescription = formData.get('templateDescription') as string;

		if (!templateName || templateName.trim().length === 0) {
			return fail(400, { message: 'テンプレート名を入力してください' });
		}

		// LP情報取得
		const { data: landingPage, error: lpError } = await locals.supabase
			.from('landing_pages')
			.select('lp_type, content')
			.eq('id', params.id)
			.single();

		if (lpError || !landingPage) {
			return fail(404, { message: 'ランディングページが見つかりません' });
		}

		// テンプレートとして保存
		const { error: templateError } = await locals.supabase
			.from('lp_templates')
			.insert({
				user_id: user.id,
				name: templateName,
				description: templateDescription || null,
				lp_type: landingPage.lp_type,
				content: landingPage.content,
				is_public: false
			});

		if (templateError) {
			console.error('Template save error:', templateError);
			return fail(500, {
				message: 'テンプレートの保存に失敗しました',
				error: templateError.message
			});
		}

		return { success: true, message: 'テンプレートとして保存しました' };
	}
};
