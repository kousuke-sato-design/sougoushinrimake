import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getTemplateById } from '$lib/templates/lp-templates';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return { hasApiKey: false, sites: [] };
	}

	// アクティブなAPIキーが設定されているかチェック
	const { data: activeKey } = await locals.supabase
		.from('user_api_keys')
		.select('api_key')
		.eq('user_id', session.user.id)
		.eq('is_active', true)
		.maybeSingle();

	// ユーザーのサイト一覧を取得
	const { data: sites } = await locals.supabase
		.from('sites')
		.select('id, name, slug')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	// ユーザーのテンプレート一覧を取得
	// 注: lp_templatesテーブルにはuser_idカラムがないため、
	// 現在はシステムテンプレートのみをサポート
	const userTemplates: any[] = [];

	// 新しいuser_api_keysテーブルにアクティブなキーがない場合、
	// 古いapi_settingsテーブルも確認（後方互換性）
	if (!activeKey?.api_key) {
		const { data: apiSettings } = await locals.supabase
			.from('api_settings')
			.select('gemini_api_key')
			.eq('user_id', session.user.id)
			.maybeSingle();

		return {
			hasApiKey: !!apiSettings?.gemini_api_key,
			sites: sites || [],
			userTemplates: userTemplates || []
		};
	}

	return {
		hasApiKey: true,
		sites: sites || [],
		userTemplates: userTemplates || []
	};
};

export const actions = {
	createLP: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const siteId = formData.get('site_id') as string;
		const lpType = formData.get('lp_type') as string;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const slug = formData.get('slug') as string;
		const templateId = formData.get('template_id') as string;

		// デバッグログ: 受信したフォームデータ
		console.log('=== createLP アクション デバッグ ===');
		console.log('受信したlp_type:', lpType);
		console.log('受信したtitle:', title);
		console.log('受信したtemplate_id:', templateId);

		// バリデーション
		if (!siteId || siteId.trim().length === 0) {
			return fail(400, { message: 'サイトを選択してください', lpType, title, description, slug });
		}

		if (!lpType || !['product_lp', 'benefit_page', 'whitepaper'].includes(lpType)) {
			return fail(400, { message: 'LPタイプを選択してください' });
		}

		if (!title || title.trim().length === 0) {
			return fail(400, { message: 'タイトルは必須です', lpType, title, description, slug });
		}

		if (!slug || slug.trim().length === 0) {
			return fail(400, { message: 'スラッグは必須です', lpType, title, description, slug });
		}

		// スラッグの重複チェック（同じサイト内で）
		const { data: existingLP } = await locals.supabase
			.from('landing_pages')
			.select('id')
			.eq('site_id', siteId)
			.eq('slug', slug)
			.maybeSingle();

		if (existingLP) {
			return fail(400, {
				message: 'このスラッグは既に使用されています',
				lpType,
				title,
				description,
				slug
			});
		}

		// テンプレートが選択されている場合は、そのセクションを使用
		let initialContent = { sections: [] };
		if (templateId) {
			// user-で始まる場合はデータベースのユーザーテンプレート
			if (templateId.startsWith('user-')) {
				const dbTemplateId = templateId.replace('user-', '');
				const { data: userTemplate } = await locals.supabase
					.from('lp_templates')
					.select('content')
					.eq('id', dbTemplateId)
					.single();

				if (userTemplate?.content) {
					initialContent = userTemplate.content;
				}
			} else {
				// システムテンプレート
				const template = getTemplateById(templateId);
				if (template) {
					// テンプレートのセクション構造を公開LP表示用に変換
					// section.content.* → section.* に展開
					const transformedSections = template.sections.map((section) => {
						const { id, type, order, content } = section;
						return {
							type,
							...content // contentの中身を展開して直接セクションに配置
						};
					});
					initialContent = { sections: transformedSections };

					console.log('テンプレート変換後:', JSON.stringify(initialContent, null, 2));
				}
			}
		}

		// LPを作成
		const { data: newLP, error } = await locals.supabase
			.from('landing_pages')
			.insert({
				user_id: session.user.id,
				site_id: siteId,
				lp_type: lpType,
				title,
				description: description || null,
				slug,
				content: initialContent,  // JSONB型なのでJSON.stringify()不要
				status: 'draft'
			})
			.select()
			.single();

		if (error) {
			return fail(500, { message: 'LPの作成に失敗しました', error: error.message });
		}

		// 編集ページへリダイレクト
		throw redirect(303, `/dashboard/landing-pages/${newLP.id}/edit`);
	},

	generateWithAI: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const siteId = formData.get('site_id') as string;
		const lpType = formData.get('lp_type') as string;
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const companyInfo = formData.get('company_info') as string;

		// サイトIDのバリデーション
		if (!siteId || siteId.trim().length === 0) {
			return fail(400, { message: 'サイトを選択してください' });
		}

		// アクティブなAPIキーを取得
		let { data: activeKey } = await locals.supabase
			.from('user_api_keys')
			.select('api_key, model')
			.eq('user_id', session.user.id)
			.eq('is_active', true)
			.maybeSingle();

		if (!activeKey?.api_key) {
			// 古いapi_settingsテーブルからも試す（後方互換性）
			const { data: apiSettings } = await locals.supabase
				.from('api_settings')
				.select('gemini_api_key')
				.eq('user_id', session.user.id)
				.maybeSingle();

			if (!apiSettings?.gemini_api_key) {
				return fail(400, { message: 'Gemini APIキーが設定されていません。AI APIページでキーを追加してください。' });
			}

			// 古い設定がある場合はそれを使用（デフォルトモデル）
			activeKey = {
				api_key: apiSettings.gemini_api_key,
				model: 'models/gemini-1.5-flash-latest'
			};
		}

		const apiKey = activeKey.api_key;
		const modelName = activeKey.model || 'models/gemini-1.5-flash-latest';

		// Gemini APIを使用してLP生成
		try {
			// LPタイプに応じたプロンプト
			const lpTypeLabel =
				lpType === 'product_lp'
					? '商品紹介ランディングページ'
					: '特典・資料ダウンロードページ';

			const prompt = `あなたは優秀なマーケティングコピーライターです。以下の情報を元に、魅力的な${lpTypeLabel}のコンテンツを生成してください。

【入力情報】
- タイトル: ${title}
- 説明: ${description}
- 企業情報: ${companyInfo}
- LPタイプ: ${lpTypeLabel}

【出力指示】
以下のJSON構造で、実際のコンテンツを含めて出力してください。JSON以外のテキストは一切含めないでください。

{
  "slug": "${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}",
  "content": {
    "sections": [
      {
        "type": "hero",
        "title": "キャッチーなメインタイトル",
        "subtitle": "サブタイトル（ベネフィットを明確に）",
        "cta": "行動を促すボタンテキスト"
      },
      {
        "type": "features",
        "title": "特徴・メリットのセクションタイトル",
        "items": [
          { "title": "特徴1のタイトル", "description": "特徴1の詳細説明（100文字程度）" },
          { "title": "特徴2のタイトル", "description": "特徴2の詳細説明（100文字程度）" },
          { "title": "特徴3のタイトル", "description": "特徴3の詳細説明（100文字程度）" }
        ]
      },
      {
        "type": "cta",
        "title": "最後のCTAタイトル",
        "description": "行動を促す説明文",
        "buttonText": "ボタンのテキスト"
      }
    ]
  }
}

必ずJSON形式のみで返答してください。`;

			// models/プレフィックスがない場合は追加
			const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						contents: [
							{
								parts: [{ text: prompt }]
							}
						],
						generationConfig: {
							temperature: 0.9,
							topK: 40,
							topP: 0.95,
							maxOutputTokens: 8192,
							responseMimeType: 'application/json'
						}
					})
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Gemini API Error:', errorData);
				return fail(500, {
					message: 'AI生成に失敗しました',
					error: errorData.error?.message || 'Unknown error'
				});
			}

			const result = await response.json();
			const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

			console.log('Gemini Response:', generatedText);

			// JSONをパース（responseMimeTypeでJSONを指定しているので直接パース可能）
			let generatedData;
			try {
				// まずそのままパースを試みる
				generatedData = JSON.parse(generatedText);
			} catch (e) {
				// 失敗したら正規表現で抽出を試みる
				const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					console.error('JSON extraction failed:', generatedText);
					return fail(500, {
						message: 'AI応答の解析に失敗しました。生成されたテキストがJSON形式ではありません。'
					});
				}
				try {
					generatedData = JSON.parse(jsonMatch[0]);
				} catch (parseError) {
					console.error('JSON parse failed:', parseError);
					return fail(500, {
						message: 'AI応答のJSON解析に失敗しました。'
					});
				}
			}

			// スラッグの重複チェック
			const { data: existingLP } = await locals.supabase
				.from('landing_pages')
				.select('id')
				.eq('slug', generatedData.slug)
				.maybeSingle();

			// 重複していたらタイムスタンプを追加
			const finalSlug = existingLP
				? `${generatedData.slug}-${Date.now()}`
				: generatedData.slug;

			// LPを作成
			const { data: newLP, error } = await locals.supabase
				.from('landing_pages')
				.insert({
					user_id: session.user.id,
					site_id: siteId,
					lp_type: lpType,
					title,
					description: description || null,
					slug: finalSlug,
					content: generatedData.content || { sections: [] },  // JSONB型なのでJSON.stringify()不要
					status: 'draft'
				})
				.select()
				.single();

			if (error) {
				return fail(500, { message: 'LPの作成に失敗しました', error: error.message });
			}

			// 生成ログを保存
			await locals.supabase.from('ai_generation_logs').insert({
				user_id: session.user.id,
				lp_id: newLP.id,
				request_type: 'full_generation',
				user_prompt: prompt,
				generated_content: generatedText,
				success: true
			});

			// 編集ページへリダイレクト
			throw redirect(303, `/dashboard/landing-pages/${newLP.id}/edit`);
		} catch (error) {
			return fail(500, {
				message: 'AI生成中にエラーが発生しました',
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
} satisfies Actions;
