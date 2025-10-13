import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateWithConversation } from '$lib/utils/ai';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const { prompt, existingSections, conversationHistory, apiKeyId, landingPageId, lpType } =
			body;

		if (!prompt) {
			return json({ error: 'プロンプトを入力してください' }, { status: 400 });
		}

		// ユーザー認証
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return json({ error: 'ログインが必要です' }, { status: 401 });
		}

		// APIキー取得
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
			return json(
				{ error: 'APIキーが設定されていません。/dashboard/ai-api でAPIキーを登録してください。' },
				{ status: 400 }
			);
		}

		// モデル名から "models/" プレフィックスを削除
		let modelName = apiKeyData.model || 'gemini-1.5-flash-latest';
		if (modelName.startsWith('models/')) {
			modelName = modelName.substring(7);
		}

		console.log('API: Using model:', modelName, 'Original:', apiKeyData.model);

		// ユーザーメッセージを会話履歴に保存（テーブルがない場合はスキップ）
		if (landingPageId) {
			try {
				await locals.supabase.from('ai_conversation_history').insert({
					landing_page_id: landingPageId,
					user_id: user.id,
					role: 'user',
					content: prompt,
					model: modelName
				});
			} catch (e) {
				console.log('Could not save conversation history:', e);
			}
		}

		// AI生成実行
		const result = await generateWithConversation(apiKeyData.api_key, modelName, {
			prompt,
			conversationHistory: conversationHistory || [],
			existingSections: existingSections || [],
			lpType: (lpType as any) || 'product_lp'
		});

		// AIの応答を会話履歴に保存（テーブルがない場合はスキップ）
		if (landingPageId) {
			try {
				await locals.supabase.from('ai_conversation_history').insert({
					landing_page_id: landingPageId,
					user_id: user.id,
					role: 'assistant',
					content: result.message,
					sections_generated: result.sections.length > 0 ? result.sections : null,
					model: modelName
				});
			} catch (e) {
				console.log('Could not save conversation history:', e);
			}

			// ログ記録
			try {
				await locals.supabase.from('ai_generation_logs').insert({
					user_id: user.id,
					landing_page_id: landingPageId,
					prompt,
					response: JSON.stringify({
						message: result.message,
						sections: result.sections
					}),
					model: modelName
				});
			} catch (e) {
				console.log('Could not save generation log:', e);
			}

			// セクションが生成された場合は編集履歴も保存
			if (result.sections.length > 0) {
				try {
					await locals.supabase.from('lp_edit_history').insert({
						landing_page_id: landingPageId,
						user_id: user.id,
						action_type: 'add_section',
						content_after: { sections: result.sections },
						change_summary: `AI生成: ${result.sections.length}個のセクションを追加`
					});
				} catch (e) {
					console.log('Could not save edit history:', e);
				}
			}
		}

		return json({
			success: true,
			message: result.message,
			sections: result.sections
		});
	} catch (err: any) {
		console.error('API generate-sections error:', err);
		return json(
			{
				error: err.message || 'セクション生成中にエラーが発生しました',
				details: err.stack
			},
			{ status: 500 }
		);
	}
};
