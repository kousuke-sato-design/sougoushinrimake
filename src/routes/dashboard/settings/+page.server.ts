import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) {
		return { profile: null };
	}

	// 既存の企業プロフィールを取得
	const { data: profile } = await locals.supabase
		.from('company_profiles')
		.select('*')
		.eq('user_id', session.user.id)
		.maybeSingle();

	return {
		profile
	};
};

export const actions = {
	updateProfile: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const companyName = formData.get('company_name') as string;
		const industry = formData.get('industry') as string;
		const website = formData.get('website') as string;
		const description = formData.get('description') as string;

		// バリデーション
		if (!companyName || companyName.trim().length === 0) {
			return fail(400, { message: '会社名は必須です', companyName, industry, website, description });
		}

		// 既存のプロフィールをチェック
		const { data: existingProfile } = await locals.supabase
			.from('company_profiles')
			.select('id')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (existingProfile) {
			// 更新
			const { error } = await locals.supabase
				.from('company_profiles')
				.update({
					company_name: companyName,
					industry: industry || null,
					website: website || null,
					description: description || null,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', session.user.id);

			if (error) {
				return fail(500, { message: 'プロフィールの更新に失敗しました', error: error.message });
			}
		} else {
			// 新規作成
			const { error } = await locals.supabase.from('company_profiles').insert({
				user_id: session.user.id,
				company_name: companyName,
				industry: industry || null,
				website: website || null,
				description: description || null
			});

			if (error) {
				return fail(500, { message: 'プロフィールの作成に失敗しました', error: error.message });
			}
		}

		return { success: true, message: 'プロフィールを更新しました' };
	},

	uploadLogo: async ({ request, locals }) => {
		const session = await locals.getSession();
		if (!session) {
			return fail(401, { message: '認証が必要です' });
		}

		const formData = await request.formData();
		const logo = formData.get('logo') as File;

		if (!logo || logo.size === 0) {
			return fail(400, { message: 'ロゴファイルを選択してください' });
		}

		// ファイルサイズチェック (5MB)
		if (logo.size > 5 * 1024 * 1024) {
			return fail(400, { message: 'ファイルサイズは5MB以下にしてください' });
		}

		// ファイルタイプチェック
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		if (!allowedTypes.includes(logo.type)) {
			return fail(400, { message: '画像ファイル（JPEG, PNG, GIF, WebP）のみアップロード可能です' });
		}

		// ファイル名を生成（ユーザーIDとタイムスタンプ）
		const fileExt = logo.name.split('.').pop();
		const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

		// 既存のロゴを削除
		const { data: existingProfile } = await locals.supabase
			.from('company_profiles')
			.select('logo_url')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (existingProfile?.logo_url) {
			// 既存のロゴファイルを削除
			const oldPath = existingProfile.logo_url.split('/').slice(-2).join('/');
			await locals.supabase.storage.from('logos').remove([oldPath]);
		}

		// ファイルをアップロード
		const { error: uploadError } = await locals.supabase.storage
			.from('logos')
			.upload(fileName, logo, {
				contentType: logo.type,
				upsert: false
			});

		if (uploadError) {
			return fail(500, { message: 'ロゴのアップロードに失敗しました', error: uploadError.message });
		}

		// 公開URLを取得
		const {
			data: { publicUrl }
		} = locals.supabase.storage.from('logos').getPublicUrl(fileName);

		// プロフィールのlogo_urlを更新
		const { data: profile } = await locals.supabase
			.from('company_profiles')
			.select('id')
			.eq('user_id', session.user.id)
			.maybeSingle();

		if (profile) {
			// 既存のプロフィールを更新
			const { error: updateError } = await locals.supabase
				.from('company_profiles')
				.update({
					logo_url: publicUrl,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', session.user.id);

			if (updateError) {
				return fail(500, {
					message: 'ロゴURLの更新に失敗しました',
					error: updateError.message
				});
			}
		} else {
			// 新規プロフィールを作成
			const { error: insertError } = await locals.supabase.from('company_profiles').insert({
				user_id: session.user.id,
				logo_url: publicUrl,
				company_name: '未設定'
			});

			if (insertError) {
				return fail(500, {
					message: 'プロフィールの作成に失敗しました',
					error: insertError.message
				});
			}
		}

		return { success: true, message: 'ロゴをアップロードしました', logoUrl: publicUrl };
	}
} satisfies Actions;
