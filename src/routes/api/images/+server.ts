import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const { data: { user } } = await locals.supabase.auth.getUser();

		if (!user) {
			return json({ error: 'ログインが必要です' }, { status: 401 });
		}

		const landingPageId = url.searchParams.get('landingPageId');

		// ユーザーのフォルダ配下の画像を取得
		const prefix = landingPageId
			? `${user.id}/${landingPageId}/`
			: `${user.id}/`;

		const { data: files, error } = await locals.supabase.storage
			.from('lp-images')
			.list(prefix.replace(/\/$/, ''), {
				limit: 100,
				sortBy: { column: 'created_at', order: 'desc' }
			});

		if (error) {
			console.error('List files error:', error);
			return json({ error: '画像の取得に失敗しました' }, { status: 500 });
		}

		// ファイルのパブリックURLを生成
		const images = (files || [])
			.filter(file => !file.name.includes('/')) // フォルダを除外
			.map(file => {
				const filePath = `${prefix}${file.name}`;
				const { data: urlData } = locals.supabase.storage
					.from('lp-images')
					.getPublicUrl(filePath);

				return {
					url: urlData.publicUrl,
					path: filePath,
					name: file.name,
					uploadedAt: file.created_at
				};
			});

		return json({
			success: true,
			images
		});
	} catch (err: any) {
		console.error('Get images error:', err);
		return json({ error: err.message || '画像の取得に失敗しました' }, { status: 500 });
	}
};
