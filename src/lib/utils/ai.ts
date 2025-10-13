// AI生成ユーティリティ関数

import type { Section } from '$lib/types/sections';

export interface Message {
	role: 'user' | 'assistant';
	content: string;
}

export interface GenerateSectionRequest {
	prompt: string;
	sectionType?: 'hero' | 'features' | 'cta' | 'contact';
	existingSections?: Section[];
	lpType?: 'product_lp' | 'whitepaper';
	companyInfo?: string;
}

export interface ConversationalRequest {
	prompt: string;
	conversationHistory?: Message[];
	existingSections?: Section[];
	lpType?: 'product_lp' | 'benefit_page' | 'whitepaper';
}

export interface ConversationalResponse {
	message: string;
	sections: Section[];
}

export async function generateSectionWithGemini(
	apiKey: string,
	model: string,
	request: GenerateSectionRequest
): Promise<Section[]> {
	const systemPrompt = `あなたはプロフェッショナルなマーケティングコピーライターです。
ランディングページのセクションをJSON形式で生成してください。
以下のTypeScript型定義に従って、正確なJSON形式で出力してください。

セクションタイプ:
- hero: メインビジュアル。title, subtitle, description, buttonText, buttonLinkを含む
- features: 機能や特徴。title, features配列（各アイテムはiconName（lucide-svelteのアイコン名）, title, description）を含む
- cta: 行動喚起。title, description, buttonText, buttonLinkを含む
- contact: お問い合わせフォーム。title, description, formFields配列を含む

デザインガイドライン:
- 色: 青系（blue-600, indigo-600）を基調とする
- フラットデザイン、落ち着いた単色アイコン
- アイコンはlucide-svelteのアイコン名を使用（例: "Sparkles", "Zap", "Check", "Star"）
- テキストは簡潔で分かりやすく
- BtoBマーケティング向けの専門的な雰囲気

レスポンス形式:
必ずJSON配列で返してください。各セクションは以下の形式です：
{
  "id": "ランダムなUUID",
  "type": "セクションタイプ",
  "order": 0,
  "content": { セクション固有のコンテンツ }
}`;

	const userPrompt = buildUserPrompt(request);

	try {
		console.log('Calling Gemini API with model:', model);
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
									text: `${systemPrompt}\n\n${userPrompt}`
								}
							]
						}
					],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 2048
					}
				})
			}
		);

		console.log('Gemini API response status:', response.status);

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Gemini API error:', errorData);
			throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
		}

		const data = await response.json();
		const generatedText = data.candidates[0]?.content?.parts[0]?.text;

		console.log('Generated text length:', generatedText?.length || 0);
		console.log('Generated text preview:', generatedText?.substring(0, 200));

		if (!generatedText) {
			throw new Error('No content generated');
		}

		// JSONを抽出（```json ... ```で囲まれている場合に対応）
		const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) ||
		                  generatedText.match(/```\s*([\s\S]*?)\s*```/) ||
		                  [null, generatedText];

		const jsonText = jsonMatch[1] || generatedText;
		console.log('Extracted JSON:', jsonText.substring(0, 200));
		const sections = JSON.parse(jsonText.trim());

		console.log('Parsed sections:', sections);

		// 配列でない場合は配列に変換
		return Array.isArray(sections) ? sections : [sections];
	} catch (error) {
		console.error('Error generating sections:', error);
		throw error;
	}
}

function buildUserPrompt(request: GenerateSectionRequest): string {
	let prompt = `ユーザーの要望: ${request.prompt}\n\n`;

	if (request.lpType) {
		prompt += `LPタイプ: ${request.lpType === 'product_lp' ? '商品LP（商品・サービスの紹介）' : '特典ページ（限定特典・資料ダウンロード）'}\n\n`;
	}

	if (request.companyInfo) {
		prompt += `企業/商品情報:\n${request.companyInfo}\n\n`;
	}

	if (request.existingSections && request.existingSections.length > 0) {
		prompt += `既存のセクション（${request.existingSections.length}個）:\n`;
		request.existingSections.forEach((section, index) => {
			prompt += `${index + 1}. ${section.type}\n`;
		});
		prompt += '\n';
	}

	if (request.sectionType) {
		prompt += `生成するセクションタイプ: ${request.sectionType}\n\n`;
	}

	prompt += `上記の情報を元に、魅力的で効果的なセクションを1つまたは複数生成してください。
JSON形式で配列として返してください。`;

	return prompt;
}

// セクションの検証
export function validateSection(section: any): section is Section {
	if (!section || typeof section !== 'object') return false;

	// 全てのセクションタイプに対応
	const validTypes = [
		'hero',
		'features',
		'cta',
		'contact',
		'pricing',
		'testimonials',
		'faq',
		'team',
		'stats',
		'gallery',
		'video',
		'newsletter',
		'custom'
	];

	if (!section.type || !validTypes.includes(section.type)) {
		console.warn('Invalid section type:', section.type);
		return false;
	}

	if (!section.content || typeof section.content !== 'object') {
		console.warn('Invalid section content:', section.content);
		return false;
	}

	return true;
}

// 会話型AIによるセクション生成
export async function generateWithConversation(
	apiKey: string,
	model: string,
	request: ConversationalRequest
): Promise<ConversationalResponse> {
	const systemPrompt = `あなたはプロフェッショナルなマーケティングコピーライターです。
ユーザーと会話しながら、ランディングページのセクションを生成・編集します。

【重要な動作ルール】
1. ユーザーの指示を理解し、適切なセクションを生成または編集してください
2. セクションを生成・編集する場合は、必ずJSON形式でセクションを返してください
3. 会話のみで済む場合（質問への回答、確認など）は、空の配列を返してください
4. 常にユーザーフレンドリーで丁寧な口調で応答してください

【セクションタイプ】
- hero: メインビジュアル。title, subtitle, description, buttonText, buttonLinkを含む
- features: 機能や特徴。title, features配列（各アイテムはiconName, title, description）を含む
- cta: 行動喚起。title, description, buttonText, buttonLinkを含む
- contact: お問い合わせフォーム。title, description, formFields配列を含む
- pricing: 料金表。title, subtitle, plans配列（各プランにname, price, period, features, buttonText, buttonLinkなど）
- testimonials: お客様の声。title, subtitle, testimonials配列（各項目にname, position, company, content, rating）
- faq: よくある質問。title, subtitle, items配列（各項目にquestion, answer）
- team: チーム紹介。title, subtitle, members配列（各メンバーにname, position, bio）
- stats: 数字・実績。title, subtitle, stats配列（各項目にvalue, label, description）
- gallery: ギャラリー。title, subtitle, images配列（各画像にurl, alt, caption）
- video: 動画。title, subtitle, videoUrl, videoType（youtube/vimeo/direct）
- newsletter: ニュースレター登録。title, description, placeholder, buttonText

【デザインガイドライン】
- 色: 青系（blue-600, indigo-600）を基調
- アイコンはlucide-svelteのアイコン名を使用（例: "Sparkles", "Zap", "Shield", "Users"）
- BtoBマーケティング向けの専門的で洗練された雰囲気

【レスポンス形式】
必ず以下のJSON形式で返してください：
{
  "message": "ユーザーへの応答メッセージ（日本語で丁寧に）",
  "sections": [
    {
      "id": "ランダムなUUID",
      "type": "セクションタイプ",
      "order": 0,
      "content": { セクション固有のコンテンツ }
    }
  ]
}

例1（セクション生成）：
{
  "message": "ヒーローセクションを追加しました！キャッチーなタイトルと行動を促すボタンを配置しています。",
  "sections": [{ セクションデータ }]
}

例2（会話のみ）：
{
  "message": "了解しました！どのようなセクションを追加したいですか？",
  "sections": []
}`;

	// 会話履歴を構築
	const messages: { parts: { text: string }[] }[] = [];

	// システムプロンプトを追加
	messages.push({
		parts: [{ text: systemPrompt }]
	});

	// 会話履歴を追加（最近の5件のみ）
	if (request.conversationHistory && request.conversationHistory.length > 0) {
		const recentHistory = request.conversationHistory.slice(-5);
		const historyText = recentHistory.map(msg =>
			`${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`
		).join('\n');

		messages.push({
			parts: [{ text: `【過去の会話】\n${historyText}\n` }]
		});
	}

	// 現在のLP状態を追加
	let contextInfo = '';

	if (request.lpType) {
		const lpTypeLabel = request.lpType === 'product_lp'
			? '商品LP（商品・サービスの紹介）'
			: request.lpType === 'benefit_page'
			? '特典ページ（限定特典・資料ダウンロード）'
			: 'ホワイトペーパー（資料ダウンロード）';
		contextInfo += `LPタイプ: ${lpTypeLabel}\n`;
	}

	if (request.existingSections && request.existingSections.length > 0) {
		contextInfo += `\n現在のセクション（${request.existingSections.length}個）:\n`;
		request.existingSections.forEach((section, index) => {
			const sectionTitle = section.content?.title || section.type;
			contextInfo += `${index + 1}. [${section.type}] ${sectionTitle}\n`;
		});
	}

	// 現在のユーザーリクエストを追加
	const currentRequest = `${contextInfo}\n\n【ユーザーの新しい指示】\n${request.prompt}\n\n上記の指示に従って、適切に応答してください。`;

	messages.push({
		parts: [{ text: currentRequest }]
	});

	try {
		console.log('Calling Gemini API (conversational) with model:', model);

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: messages,
					generationConfig: {
						temperature: 0.8,
						maxOutputTokens: 4096,
						responseMimeType: 'application/json'
					}
				})
			}
		);

		if (!response.ok) {
			const errorData = await response.json();
			console.error('Gemini API error:', errorData);
			throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
		}

		const data = await response.json();
		const generatedText = data.candidates[0]?.content?.parts[0]?.text;

		if (!generatedText) {
			throw new Error('No content generated');
		}

		console.log('Conversational AI response:', generatedText);

		// JSONをパース
		let result: ConversationalResponse;
		try {
			result = JSON.parse(generatedText);
		} catch (e) {
			// パースに失敗した場合は、JSONを抽出してみる
			const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('Could not extract JSON from response');
			}
			result = JSON.parse(jsonMatch[0]);
		}

		// セクションを検証してフィルタリング
		const validSections = (result.sections || []).filter(validateSection);

		return {
			message: result.message || 'セクションを生成しました',
			sections: validSections
		};
	} catch (error) {
		console.error('Error in conversational generation:', error);
		throw error;
	}
}
