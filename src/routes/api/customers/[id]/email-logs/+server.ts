import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return json({ error: '認証が必要です' }, { status: 401 });
	}

	const customerId = params.id;

	// 顧客が自分のものか確認
	const { data: customer, error: customerError } = await locals.supabase
		.from('customers')
		.select('id')
		.eq('id', customerId)
		.eq('user_id', session.user.id)
		.single();

	if (customerError || !customer) {
		return json({ error: '顧客が見つかりません' }, { status: 404 });
	}

	// メール履歴を取得（自動返信のみ）
	const { data: emailLogs, error } = await locals.supabase
		.from('email_logs')
		.select('*, email_settings(name)')
		.eq('customer_id', customerId)
		.eq('email_type', 'auto_reply')
		.order('sent_at', { ascending: false });

	if (error) {
		console.error('Error fetching email logs:', error);
		return json({ error: 'メール履歴の取得に失敗しました' }, { status: 500 });
	}

	return json({ emailLogs: emailLogs || [] });
};
