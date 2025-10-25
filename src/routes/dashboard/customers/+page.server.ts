import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();
	if (!session) {
		return { customers: [], total: 0 };
	}

	// 検索・フィルターパラメータ
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || '';

	// クエリの構築（LP情報も取得）
	let query = locals.supabase
		.from('customers')
		.select('*, landing_pages(id, title, slug)', { count: 'exact' })
		.eq('user_id', session.user.id);

	// 検索条件（データベースの列名に合わせる）
	if (search) {
		query = query.or(`contact_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
	}

	// ステータスフィルター
	if (status) {
		query = query.eq('status', status);
	}

	// 並び替え（最新順）
	query = query.order('created_at', { ascending: false });

	const { data: customers, count } = await query;

	// データベースの列名をフロントエンドで使いやすい形式にマッピング
	const mappedCustomers = (customers || []).map(c => ({
		...c,
		name: c.contact_name || c.name, // contact_name を name にマッピング
		company: c.company_name || c.company // company_name を company にマッピング
	}));

	return {
		customers: mappedCustomers,
		total: count || 0
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const company = formData.get('company') as string;
		const position = formData.get('position') as string;
		const phone = formData.get('phone') as string;
		const status = formData.get('status') as string;

		// バリデーション
		if (!name || name.trim().length === 0) {
			return fail(400, { message: '名前は必須です' });
		}

		if (!email || email.trim().length === 0) {
			return fail(400, { message: 'メールアドレスは必須です' });
		}

		// メール形式チェック
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { message: '有効なメールアドレスを入力してください' });
		}

		// 重複チェック
		const { data: existingCustomer } = await locals.supabase
			.from('customers')
			.select('id')
			.eq('user_id', session.user.id)
			.eq('email', email)
			.maybeSingle();

		if (existingCustomer) {
			return fail(400, { message: 'このメールアドレスは既に登録されています' });
		}

		// 顧客を作成
		const { error } = await locals.supabase.from('customers').insert({
			user_id: session.user.id,
			name,
			email,
			company: company || null,
			position: position || null,
			phone: phone || null,
			status: status || 'lead'
		});

		if (error) {
			return fail(500, { message: '顧客の作成に失敗しました', error: error.message });
		}

		return { success: true, message: '顧客を追加しました' };
	},

	update: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const company = formData.get('company') as string;
		const position = formData.get('position') as string;
		const phone = formData.get('phone') as string;
		const status = formData.get('status') as string;

		// バリデーション
		if (!name || name.trim().length === 0) {
			return fail(400, { message: '名前は必須です' });
		}

		if (!email || email.trim().length === 0) {
			return fail(400, { message: 'メールアドレスは必須です' });
		}

		// 顧客を更新
		const { error } = await locals.supabase
			.from('customers')
			.update({
				name,
				email,
				company: company || null,
				position: position || null,
				phone: phone || null,
				status: status || 'lead',
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.eq('user_id', session.user.id);

		if (error) {
			return fail(500, { message: '顧客の更新に失敗しました', error: error.message });
		}

		return { success: true, message: '顧客を更新しました' };
	},

	delete: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const id = formData.get('id') as string;

		const { error } = await locals.supabase
			.from('customers')
			.delete()
			.eq('id', id)
			.eq('user_id', session.user.id);

		if (error) {
			return fail(500, { message: '顧客の削除に失敗しました', error: error.message });
		}

		return { success: true, message: '顧客を削除しました' };
	},

	importCSV: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const csvData = formData.get('csv_data') as string;

		if (!csvData || csvData.trim().length === 0) {
			return fail(400, { message: 'CSVデータが空です' });
		}

		// CSVパース（簡易版）
		const lines = csvData.trim().split('\n');
		const headers = lines[0].split(',').map((h) => h.trim());

		// ヘッダーチェック
		const requiredHeaders = ['name', 'email'];
		const hasRequiredHeaders = requiredHeaders.every((h) => headers.includes(h));

		if (!hasRequiredHeaders) {
			return fail(400, { message: 'CSVには "name" と "email" 列が必要です' });
		}

		const customers = [];
		let errorCount = 0;

		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',').map((v) => v.trim());
			if (values.length !== headers.length) continue;

			const customer: any = { user_id: session.user.id };
			headers.forEach((header, index) => {
				customer[header] = values[index] || null;
			});

			// メールバリデーション
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(customer.email)) {
				errorCount++;
				continue;
			}

			// ステータスのデフォルト値
			if (!customer.status) {
				customer.status = 'lead';
			}

			customers.push(customer);
		}

		if (customers.length === 0) {
			return fail(400, { message: 'インポート可能な顧客がありませんでした' });
		}

		// 一括挿入（重複は無視）
		const { error } = await locals.supabase.from('customers').insert(customers);

		if (error) {
			return fail(500, {
				message: 'インポートに失敗しました',
				error: error.message
			});
		}

		return {
			success: true,
			message: `${customers.length}件の顧客をインポートしました${errorCount > 0 ? `（${errorCount}件エラー）` : ''}`
		};
	}
} satisfies Actions;
