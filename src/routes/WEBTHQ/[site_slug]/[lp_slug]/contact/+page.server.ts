import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sendEmail, replaceTemplateVariables } from '$lib/utils/sendEmail';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { site_slug, lp_slug } = params;

	// サイト情報を取得
	const { data: site, error: siteError } = await locals.supabase
		.from('sites')
		.select('*')
		.eq('slug', site_slug)
		.single();

	if (siteError || !site) {
		throw error(404, 'サイトが見つかりません');
	}

	// LP情報を取得
	const { data: landingPage, error: lpError } = await locals.supabase
		.from('landing_pages')
		.select('*')
		.eq('site_id', site.id)
		.eq('slug', lp_slug)
		.eq('status', 'published')
		.single();

	if (lpError || !landingPage) {
		throw error(404, 'ランディングページが見つかりません');
	}

	// お問い合わせセクションからフォームフィールドを取得
	const sections = landingPage.content?.sections || [];
	const contactSection = sections.find(
		(s: any) =>
			s.type === 'contact' ||
			s.type === 'two_column_text_contact' ||
			s.type === 'two_column_contact_image'
	);

	let formFields = [];
	let layoutType = 'single';
	let textColumn = null;
	let imageColumn = null;
	let columnRatio = '50-50';

	if (contactSection) {
		// レイアウトタイプを取得
		layoutType = contactSection.content?.layoutType || 'single';

		// フォームフィールドを取得
		if (contactSection.type === 'contact') {
			formFields = contactSection.content?.formFields || [];
		} else {
			formFields = contactSection.content?.contactColumn?.formFields || [];
		}

		// 2カラムの追加データを取得
		if (layoutType === 'text_contact') {
			textColumn = contactSection.content?.textColumn || null;
			columnRatio = contactSection.content?.layout?.ratio || '50-50';
		} else if (layoutType === 'contact_image') {
			imageColumn = contactSection.content?.imageColumn || null;
			columnRatio = contactSection.content?.layout?.ratio || '50-50';
		}
	}

	// デフォルトのフォームフィールド（見つからない場合）
	if (formFields.length === 0) {
		formFields = [
			{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
			{
				name: 'email',
				label: 'メールアドレス',
				type: 'email',
				required: true,
				placeholder: 'yamada@example.com'
			},
			{
				name: 'message',
				label: 'お問い合わせ内容',
				type: 'textarea',
				required: true,
				placeholder: 'お問い合わせ内容をご記入ください'
			}
		];
	}

	return {
		site,
		landingPage,
		formFields,
		layoutType,
		textColumn,
		imageColumn,
		columnRatio
	};
};

export const actions = {
	submit: async ({ request, params, locals }) => {
		try {
			const rawFormData = await request.formData();

			// サイトとLP情報を取得
			const { site_slug, lp_slug } = params;
			const { data: site, error: siteError } = await locals.supabase
				.from('sites')
				.select('id')
				.eq('slug', site_slug)
				.single();

			if (siteError || !site) {
				return fail(404, {
					message: 'サイトが見つかりません',
					success: false
				});
			}

			const { data: landingPage, error: lpError } = await locals.supabase
				.from('landing_pages')
				.select('id, user_id, content')
				.eq('slug', lp_slug)
				.eq('site_id', site.id)
				.single();

			if (lpError || !landingPage) {
				return fail(404, {
					message: 'ランディングページが見つかりません',
					success: false
				});
			}

			// フォームデータを整形
			const formData: Record<string, any> = {};
			rawFormData.forEach((value, key) => {
				formData[key] = value;
			});

			// 顧客データを準備
			const customerData: any = {
				user_id: landingPage.user_id,
				source_lp_id: landingPage.id,
				status: 'lead', // データベースの制約に合わせる: 'lead' | 'negotiation' | 'customer' | 'lost'
				custom_fields: {}
			};

			// フォームデータから標準フィールドとカスタムフィールドを分離
			for (const [key, value] of Object.entries(formData)) {
				switch (key) {
					case 'name':
					case '名前':
					case 'お名前':
						customerData.contact_name = value; // データベースの列名に合わせる
						break;
					case 'email':
					case 'メールアドレス':
						customerData.email = value;
						break;
					case 'company':
					case 'company_name':
					case '会社名':
						customerData.company_name = value;
						break;
					case 'phone':
					case '電話番号':
						customerData.phone = value;
						break;
					default:
						// その他のフィールドはカスタムフィールドに保存
						customerData.custom_fields[key] = value;
				}
			}

			// 必須フィールドのバリデーション
			if (!customerData.email) {
				return fail(400, {
					message: 'メールアドレスは必須です',
					success: false
				});
			}

			// メールアドレスの簡易バリデーション
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(customerData.email)) {
				return fail(400, {
					message: '有効なメールアドレスを入力してください',
					success: false
				});
			}

			// 顧客データを保存
			const { data: customer, error: customerError } = await locals.supabase
				.from('customers')
				.insert(customerData)
				.select()
				.single();

			if (customerError) {
				console.error('Customer insert error:', customerError);
				console.error('Customer data attempted:', JSON.stringify(customerData, null, 2));
				return fail(500, {
					message: `顧客データの保存に失敗しました: ${customerError.message || JSON.stringify(customerError)}`,
					success: false
				});
			}

			// お問い合わせセクションから自動返信メール設定とフォーム情報を取得
			const sections = landingPage.content?.sections || [];
			const contactSection = sections.find(
				(s: any) =>
					s.type === 'contact' ||
					s.type === 'two_column_text_contact' ||
					s.type === 'two_column_contact_image'
			);

			const autoReplyEmailSettingId =
				contactSection?.content?.autoReplyEmailSettingId ||
				contactSection?.content?.contactColumn?.autoReplyEmailSettingId;

			const formTemplateId =
				contactSection?.content?.formTemplateId ||
				contactSection?.content?.contactColumn?.formTemplateId;

			// フォームテンプレート情報を取得してメタデータに保存
			if (formTemplateId) {
				try {
					const { data: formTemplate } = await locals.supabase
						.from('form_templates')
						.select('name')
						.eq('id', formTemplateId)
						.single();

					if (formTemplate) {
						customerData.custom_fields._meta = {
							form_template_name: formTemplate.name,
							form_template_id: formTemplateId,
							landing_page_title: landingPage.title,
							submitted_from_url: `/WEBTHQ/${site_slug}/${lp_slug}/contact`
						};
					}
				} catch (err) {
					console.error('Form template fetch error:', err);
				}
			}

			// 自動返信メール送信（オプション）
			if (autoReplyEmailSettingId && customerData.email) {
				try {
					// メール設定を取得
					const { data: emailSetting, error: emailSettingError } = await locals.supabase
						.from('email_settings')
						.select('*, imap_accounts(*)')
						.eq('id', autoReplyEmailSettingId)
						.single();

					if (emailSettingError) {
						console.error('Email setting fetch error:', emailSettingError);
					} else if (emailSetting && emailSetting.imap_accounts) {
						const imapAccount = emailSetting.imap_accounts;

						// テンプレート変数を置換
						const variables = {
							name: customerData.contact_name || 'お客様',
							email: customerData.email,
							company_name: customerData.company_name || '',
							...customerData.custom_fields
						};

						const subject = replaceTemplateVariables(
							emailSetting.subject || 'お問い合わせありがとうございます',
							variables
						);
						const body = replaceTemplateVariables(emailSetting.body || '', variables);

						// SMTP設定
						const smtpConfig = {
							host: imapAccount.smtp_host,
							port: imapAccount.smtp_port,
							secure: imapAccount.smtp_port === 465,
							auth: {
								user: imapAccount.email,
								pass: imapAccount.password
							}
						};

						// メール送信
						await sendEmail(smtpConfig, {
							to: customerData.email,
							subject,
							html: body,
							from: `${imapAccount.from_name || ''} <${imapAccount.email}>`
						});

						console.log('Auto-reply email sent to:', customerData.email);
					}
				} catch (emailError) {
					console.error('Auto-reply email error:', emailError);
					// メール送信エラーは無視して続行（顧客データは保存済み）
				}
			}

			return {
				success: true,
				message: 'お問い合わせを受け付けました。担当者より折り返しご連絡いたします。'
			};
		} catch (err: any) {
			console.error('Submit form error:', err);
			return fail(500, {
				message: err.message || 'フォーム送信に失敗しました',
				success: false
			});
		}
	}
} satisfies Actions;
