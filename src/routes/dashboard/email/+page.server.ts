import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return { campaigns: [], customers: [] };
	}

	// メールキャンペーン一覧を取得
	const { data: campaigns } = await locals.supabase
		.from('email_campaigns')
		.select('*')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	// 顧客リストを取得（送信先選択用）
	const { data: customers } = await locals.supabase
		.from('customers')
		.select('id, name, email, status')
		.eq('user_id', session.user.id)
		.order('name');

	return {
		campaigns: campaigns || [],
		customers: customers || [],
		hasResendKey: !!env.RESEND_API_KEY
	};
};

export const actions = {
	createCampaign: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const subject = formData.get('subject') as string;
		const body = formData.get('body') as string;

		// バリデーション
		if (!name || name.trim().length === 0) {
			return fail(400, { message: 'キャンペーン名は必須です' });
		}

		if (!subject || subject.trim().length === 0) {
			return fail(400, { message: '件名は必須です' });
		}

		if (!body || body.trim().length === 0) {
			return fail(400, { message: '本文は必須です' });
		}

		// キャンペーンを作成
		const { data: campaign, error } = await locals.supabase
			.from('email_campaigns')
			.insert({
				user_id: session.user.id,
				name,
				subject,
				body,
				status: 'draft'
			})
			.select()
			.single();

		if (error) {
			return fail(500, { message: 'キャンペーンの作成に失敗しました', error: error.message });
		}

		return { success: true, message: 'キャンペーンを作成しました', campaignId: campaign.id };
	},

	sendCampaign: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		if (!env.RESEND_API_KEY) {
			return fail(400, { message: 'Resend APIキーが設定されていません' });
		}

		const formData = await request.formData();
		const campaignId = formData.get('campaign_id') as string;
		const recipientIds = formData.getAll('recipient_ids') as string[];

		if (recipientIds.length === 0) {
			return fail(400, { message: '送信先を選択してください' });
		}

		// キャンペーン情報を取得
		const { data: campaign } = await locals.supabase
			.from('email_campaigns')
			.select('*')
			.eq('id', campaignId)
			.eq('user_id', session.user.id)
			.single();

		if (!campaign) {
			return fail(404, { message: 'キャンペーンが見つかりません' });
		}

		// 送信先顧客を取得
		const { data: recipients } = await locals.supabase
			.from('customers')
			.select('id, name, email')
			.in('id', recipientIds)
			.eq('user_id', session.user.id);

		if (!recipients || recipients.length === 0) {
			return fail(400, { message: '有効な送信先がありません' });
		}

		let successCount = 0;
		let failCount = 0;

		// 各受信者にメール送信
		for (const recipient of recipients) {
			try {
				// Resend APIでメール送信
				const response = await fetch('https://api.resend.com/emails', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${env.RESEND_API_KEY}`
					},
					body: JSON.stringify({
						from: 'onboarding@resend.dev', // 実際の送信元アドレスに変更
						to: recipient.email,
						subject: campaign.subject,
						html: campaign.body.replace(/\n/g, '<br>')
					})
				});

				const result = await response.json();

				if (response.ok) {
					// 送信成功ログを記録
					await locals.supabase.from('email_logs').insert({
						campaign_id: campaign.id,
						customer_id: recipient.id,
						status: 'sent',
						sent_at: new Date().toISOString()
					});
					successCount++;
				} else {
					// 送信失敗ログを記録
					await locals.supabase.from('email_logs').insert({
						campaign_id: campaign.id,
						customer_id: recipient.id,
						status: 'failed',
						error_message: result.message || 'Unknown error'
					});
					failCount++;
				}
			} catch (error) {
				// エラーログを記録
				await locals.supabase.from('email_logs').insert({
					campaign_id: campaign.id,
					customer_id: recipient.id,
					status: 'failed',
					error_message: error instanceof Error ? error.message : 'Unknown error'
				});
				failCount++;
			}
		}

		// キャンペーンステータスを更新
		await locals.supabase
			.from('email_campaigns')
			.update({
				status: 'sent',
				sent_at: new Date().toISOString(),
				sent_count: successCount,
				updated_at: new Date().toISOString()
			})
			.eq('id', campaignId);

		return {
			success: true,
			message: `メールを送信しました（成功: ${successCount}件、失敗: ${failCount}件）`,
			successCount,
			failCount
		};
	},

	deleteCampaign: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		const { error } = await locals.supabase
			.from('email_campaigns')
			.delete()
			.eq('id', id)
			.eq('user_id', session.user.id);

		if (error) {
			return fail(500, { message: 'キャンペーンの削除に失敗しました', error: error.message });
		}

		return { success: true, message: 'キャンペーンを削除しました' };
	}
} satisfies Actions;
