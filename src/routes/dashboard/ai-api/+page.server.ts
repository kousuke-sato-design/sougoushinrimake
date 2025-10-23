import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		throw redirect(303, '/');
	}

	// 保存されているAPIキーのリストを取得
	const { data: apiKeys } = await locals.supabase
		.from('user_api_keys')
		.select('*')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	// マスキングして返す
	const maskedKeys = (apiKeys || []).map((key) => ({
		id: key.id,
		key_name: key.key_name,
		api_key: key.api_key.substring(0, 8) + '••••••••••••••••' + key.api_key.substring(key.api_key.length - 4),
		is_active: key.is_active,
		model: key.model || 'models/gemini-1.5-flash-latest',
		created_at: key.created_at,
		updated_at: key.updated_at
	}));

	// アクティブなAPIキーがあるかチェック
	const hasActiveKey = apiKeys?.some((key) => key.is_active) || false;

	// AI生成履歴を取得
	const { data: generationLogs } = await locals.supabase
		.from('ai_generation_logs')
		.select(
			`
			id,
			created_at,
			model,
			prompt,
			response,
			landing_page_id,
			landing_pages (
				id,
				title,
				lp_type,
				status
			)
		`
		)
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false })
		.limit(10);

	// 統計情報を取得
	const { count: totalGenerations } = await locals.supabase
		.from('ai_generation_logs')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', session.user.id);

	// 今月の生成回数
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const { count: monthlyGenerations } = await locals.supabase
		.from('ai_generation_logs')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', session.user.id)
		.gte('created_at', startOfMonth.toISOString());

	// 利用可能なGeminiモデル
	const availableModels = [
		{
			value: 'models/gemini-1.5-flash-latest',
			label: 'Gemini 1.5 Flash (最新・高速)',
			description: '最も高速で低コスト'
		},
		{
			value: 'models/gemini-1.5-pro-latest',
			label: 'Gemini 1.5 Pro (最新・高性能)',
			description: '高度な推論能力'
		},
		{
			value: 'models/gemini-2.0-flash-exp',
			label: 'Gemini 2.0 Flash (実験版)',
			description: '次世代モデル・実験的'
		},
		{
			value: 'models/gemini-1.0-pro',
			label: 'Gemini 1.0 Pro (安定版)',
			description: '安定した旧モデル'
		}
	];

	// 利用可能なClaudeモデル
	const claudeModels = [
		{
			value: 'claude-3-5-sonnet-20241022',
			label: 'Claude 3.5 Sonnet (最新)',
			description: '最高性能・推奨'
		},
		{
			value: 'claude-3-5-haiku-20241022',
			label: 'Claude 3.5 Haiku',
			description: '高速・軽量'
		},
		{
			value: 'claude-3-opus-20240229',
			label: 'Claude 3 Opus',
			description: '最高品質'
		},
		{
			value: 'claude-3-sonnet-20240229',
			label: 'Claude 3 Sonnet',
			description: 'バランス型'
		}
	];

	return {
		apiKeys: maskedKeys,
		hasActiveKey,
		generationLogs: generationLogs || [],
		stats: {
			totalGenerations: totalGenerations || 0,
			monthlyGenerations: monthlyGenerations || 0
		},
		availableModels,
		claudeModels
	};
};

export const actions: Actions = {
	listModels: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const testApiKey = formData.get('test_api_key')?.toString();

		if (!testApiKey || !testApiKey.startsWith('AIza')) {
			return fail(400, { message: 'APIキーを入力してください' });
		}

		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models?key=${testApiKey}`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('List Models Error:', errorData);
				return fail(400, {
					message: `モデル取得失敗: ${errorData.error?.message || '不明なエラー'}`
				});
			}

			const result = await response.json();
			const models = result.models || [];

			// generateContentをサポートするモデルのみをフィルター
			const generationModels = models
				.filter(
					(model: any) =>
						model.supportedGenerationMethods?.includes('generateContent') ||
						model.supportedGenerationMethods?.includes('streamGenerateContent')
				)
				.map((model: any) => ({
					value: model.name.replace('models/', ''),
					label: model.displayName || model.name,
					description: model.description || 'Geminiモデル'
				}));

			return {
				success: true,
				models: generationModels,
				message: `${generationModels.length}個のモデルを取得しました`
			};
		} catch (error) {
			console.error('List Models Exception:', error);
			return fail(500, {
				message: `モデル取得エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
			});
		}
	},


	saveApiKey: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const keyName = formData.get('key_name')?.toString() || '';
		const apiKey = formData.get('api_key')?.toString() || '';
		const model = formData.get('model')?.toString() || 'models/gemini-1.5-flash-latest';
		const provider = formData.get('provider')?.toString() || 'gemini';
		const setAsActive = formData.get('set_as_active') === 'true';

		// バリデーション
		if (!keyName || keyName.trim().length === 0) {
			return fail(400, { message: 'キー名を入力してください' });
		}

		if (!apiKey) {
			return fail(400, { message: 'APIキーを入力してください' });
		}

		// プロバイダーに応じたバリデーション
		if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
			return fail(400, { message: '無効なGemini APIキーです（AIzaで始まる必要があります）' });
		}

		if (provider === 'claude' && !apiKey.startsWith('sk-ant-')) {
			return fail(400, { message: '無効なClaude APIキーです（sk-ant-で始まる必要があります）' });
		}

		// APIキーをテスト
		try {
			if (provider === 'gemini') {
				// Gemini APIのテスト
				const modelPath = model.startsWith('models/') ? model : `models/${model}`;

				const response = await fetch(
					`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contents: [{ parts: [{ text: 'こんにちは' }] }],
							generationConfig: {
								temperature: 0.7,
								maxOutputTokens: 100
							}
						})
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					console.error('Gemini API Key Test Error:', errorData);
					return fail(400, {
						message: `Gemini APIキーが無効です: ${errorData.error?.message || '接続テストに失敗しました'}`
					});
				}

				const result = await response.json();
				if (!result.candidates || result.candidates.length === 0) {
					return fail(400, { message: 'APIキーは有効ですが、応答が空です' });
				}
			} else if (provider === 'claude') {
				// Claude APIのテスト
				const response = await fetch('https://api.anthropic.com/v1/messages', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': apiKey,
						'anthropic-version': '2023-06-01'
					},
					body: JSON.stringify({
						model: model,
						max_tokens: 100,
						messages: [{ role: 'user', content: 'こんにちは' }]
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					console.error('Claude API Key Test Error:', errorData);
					return fail(400, {
						message: `Claude APIキーが無効です: ${errorData.error?.message || '接続テストに失敗しました'}`
					});
				}

				const result = await response.json();
				if (!result.content || result.content.length === 0) {
					return fail(400, { message: 'APIキーは有効ですが、応答が空です' });
				}
			}
		} catch (error) {
			console.error('API Key Validation Error:', error);
			return fail(400, {
				message: `APIキーの検証に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
			});
		}

		// アクティブに設定する場合、他のキーを非アクティブにする
		if (setAsActive) {
			await locals.supabase
				.from('user_api_keys')
				.update({ is_active: false })
				.eq('user_id', session.user.id);
		}

		// データベースに保存
		const insertData = {
			user_id: session.user.id,
			key_name: keyName,
			api_key: apiKey,
			model: model,
			provider: provider,
			is_active: setAsActive
		};

		console.log('Inserting data:', insertData);

		const { data: insertedData, error } = await locals.supabase
			.from('user_api_keys')
			.insert(insertData)
			.select();

		if (error) {
			console.error('API設定の保存エラー:', error);
			console.error('Error details:', JSON.stringify(error, null, 2));
			return fail(500, {
				message: `API設定の保存に失敗しました: ${error.message || '不明なエラー'}`,
				details: error.details,
				hint: error.hint
			});
		}

		console.log('Successfully inserted:', insertedData);

		// 古いapi_settingsテーブルも更新（後方互換性のため）
		if (setAsActive) {
			await locals.supabase.from('api_settings').upsert(
				{
					user_id: session.user.id,
					gemini_api_key: apiKey,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'user_id' }
			);
		}

		return {
			success: true,
			message: `「${keyName}」を保存しました。${setAsActive ? 'このキーがアクティブになりました。' : ''}`
		};
	},

	setActive: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const keyId = formData.get('key_id')?.toString();

		if (!keyId) {
			return fail(400, { message: 'キーIDが指定されていません' });
		}

		// すべてのキーを非アクティブにする
		await locals.supabase
			.from('user_api_keys')
			.update({ is_active: false })
			.eq('user_id', session.user.id);

		// 指定されたキーをアクティブにする
		const { data: activeKey, error } = await locals.supabase
			.from('user_api_keys')
			.update({ is_active: true })
			.eq('id', keyId)
			.eq('user_id', session.user.id)
			.select()
			.single();

		if (error) {
			return fail(500, { message: 'APIキーの有効化に失敗しました' });
		}

		// 古いapi_settingsテーブルも更新
		if (activeKey) {
			await locals.supabase.from('api_settings').upsert(
				{
					user_id: session.user.id,
					gemini_api_key: activeKey.api_key,
					updated_at: new Date().toISOString()
				},
				{ onConflict: 'user_id' }
			);
		}

		return {
			success: true,
			message: 'APIキーをアクティブに設定しました'
		};
	},

	deleteApiKey: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const keyId = formData.get('key_id')?.toString();

		if (!keyId) {
			return fail(400, { message: 'キーIDが指定されていません' });
		}

		// キーを削除
		const { error } = await locals.supabase
			.from('user_api_keys')
			.delete()
			.eq('id', keyId)
			.eq('user_id', session.user.id);

		if (error) {
			return fail(500, { message: 'APIキーの削除に失敗しました' });
		}

		return {
			success: true,
			message: 'APIキーを削除しました'
		};
	},

	testConnection: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			throw redirect(303, '/');
		}

		const formData = await request.formData();
		const keyId = formData.get('key_id')?.toString();

		if (!keyId) {
			return fail(400, { message: 'キーIDが指定されていません' });
		}

		// APIキーを取得
		const { data: apiKey } = await locals.supabase
			.from('user_api_keys')
			.select('api_key, key_name, model')
			.eq('id', keyId)
			.eq('user_id', session.user.id)
			.single();

		if (!apiKey) {
			return fail(400, { message: 'APIキーが見つかりません' });
		}

		try {
			const modelName = apiKey.model || 'models/gemini-1.5-flash-latest';
			// models/プレフィックスがない場合は追加
			const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey.api_key}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ parts: [{ text: '接続テスト: 短い返答をください' }] }],
						generationConfig: {
							temperature: 0.7,
							maxOutputTokens: 100
						}
					})
				}
			);

			if (response.ok) {
				const result = await response.json();
				const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
				console.log('Connection Test Success:', responseText);
				return {
					success: true,
					message: `✓ 「${apiKey.key_name}」は正常に動作しています！`
				};
			} else {
				const errorData = await response.json();
				console.error('Connection Test Error:', errorData);
				return fail(400, {
					message: `接続テスト失敗: ${errorData.error?.message || '不明なエラー'}`
				});
			}
		} catch (error) {
			console.error('Connection Test Exception:', error);
			return fail(500, {
				message: `APIへの接続に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
			});
		}
	}
};
