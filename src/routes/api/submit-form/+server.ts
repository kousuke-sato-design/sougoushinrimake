import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail, replaceTemplateVariables, textToHtml } from '$lib/utils/sendEmail';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { formData, sectionId, landingPageId } = await request.json();

		if (!formData || !landingPageId) {
			return json({ error: 'フォームデータとランディングページIDが必要です' }, { status: 400 });
		}

		// ランディングページ情報を取得
		const { data: lpData, error: lpError } = await locals.supabase
			.from('landing_pages')
			.select('user_id, site_id, content')
			.eq('id', landingPageId)
			.single();

		if (lpError || !lpData) {
			console.error('LP fetch error:', lpError);
			return json({ error: 'ランディングページが見つかりません' }, { status: 404 });
		}

		// セクション情報を取得してフォームテンプレートIDを確認
		const sections = lpData.content?.sections || [];
		const section = sections.find((s: any) => s.id === sectionId);
		const formTemplateId = section?.content?.formTemplateId || section?.content?.contactColumn?.formTemplateId;

		// 顧客データを準備
		const customerData: any = {
			user_id: lpData.user_id,
			source_lp_id: landingPageId,
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

		// フォームテンプレート情報をメタデータに保存
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
						landing_page_id: landingPageId,
						section_id: sectionId
					};
				}
			} catch (err) {
				console.error('Form template fetch error:', err);
			}
		}

	// 既存顧客を確認
	const { data: existingCustomer } = await locals.supabase
		.from('customers')
		.select('id')
		.eq('user_id', lpData.user_id)
		.eq('email', customerData.email)
		.maybeSingle();

	let customer;

	if (existingCustomer) {
		// 既存顧客を更新
		const { data: updatedCustomer, error: updateError } = await locals.supabase
			.from('customers')
			.update({
				...customerData,
				updated_at: new Date().toISOString()
			})
			.eq('id', existingCustomer.id)
			.select()
			.single();

		if (updateError) {
			console.error('Customer update error:', updateError);
			return json({ error: '顧客データの更新に失敗しました' }, { status: 500 });
		}
		customer = updatedCustomer;
	} else {
		// 新規顧客を作成
		const { data: newCustomer, error: insertError } = await locals.supabase
			.from('customers')
			.insert(customerData)
			.select()
			.single();

		if (insertError) {
			console.error('Customer insert error:', insertError);
			return json({ error: '顧客データの保存に失敗しました' }, { status: 500 });
		}
		customer = newCustomer;
	}

		// 自動返信メール送信（オプション）
		const autoReplyEmailSettingId = section?.content?.autoReplyEmailSettingId || section?.content?.contactColumn?.autoReplyEmailSettingId;

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

					const subject = replaceTemplateVariables(emailSetting.subject || 'お問い合わせありがとうございます', variables);
					const bodyText = replaceTemplateVariables(emailSetting.body || '', variables);
					const body = textToHtml(bodyText); // 改行を<br>タグに変換

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
					const fromEmail = `${imapAccount.from_name || ''} <${imapAccount.email}>`;
					await sendEmail(smtpConfig, {
						to: customerData.email,
						subject,
						html: body,
						from: fromEmail
					});

					console.log('Auto-reply email sent to:', customerData.email);

					// メール送信ログを保存
					await locals.supabase.from('email_logs').insert({
						email_type: 'auto_reply',
						user_id: lpData.user_id,
						customer_id: customer.id,
						email_setting_id: autoReplyEmailSettingId,
						subject,
						body,
						to_email: customerData.email,
						from_email: imapAccount.email,
						status: 'sent',
						sent_at: new Date().toISOString()
					});
				}
			} catch (emailError) {
				console.error('Auto-reply email error:', emailError);
				// メール送信エラーは無視して続行（顧客データは保存済み）
			}
		}

		return json({
			success: true,
			customer,
			message: 'お問い合わせありがとうございます。'
		});
	} catch (err: any) {
		console.error('Submit form error:', err);
		return json({ error: err.message || 'フォーム送信に失敗しました' }, { status: 500 });
	}
};
