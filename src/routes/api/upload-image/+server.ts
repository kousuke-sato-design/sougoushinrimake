import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { data: { user } } = await locals.supabase.auth.getUser();

		if (!user) {
			return json({ error: 'ログインが必要です' }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const landingPageId = formData.get('landingPageId') as string;

		if (!file) {
			return json({ error: 'ファイルが選択されていません' }, { status: 400 });
		}

		// ファイルタイプチェック
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
		if (!allowedTypes.includes(file.type)) {
			return json(
				{ error: '許可されていないファイル形式です。JPG, PNG, WEBP, SVGのみアップロード可能です。' },
				{ status: 400 }
			);
		}

		// ファイルサイズチェック (5MB)
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			return json({ error: 'ファイルサイズが大きすぎます。最大5MBまでです。' }, { status: 400 });
		}

		// ファイル名を生成
		const timestamp = Date.now();
		const extension = file.name.split('.').pop();
		const fileName = `${user.id}/${landingPageId || 'general'}/${timestamp}.${extension}`;

		// Supabase Storageにアップロード
		const { data, error } = await locals.supabase.storage
			.from('lp-images')
			.upload(fileName, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (error) {
			console.error('Upload error:', error);
			return json({ error: '画像のアップロードに失敗しました' }, { status: 500 });
		}

		// 公開URLを取得
		const { data: urlData } = locals.supabase.storage.from('lp-images').getPublicUrl(fileName);

		return json({
			success: true,
			url: urlData.publicUrl,
			path: data.path
		});
	} catch (err: any) {
		console.error('Image upload error:', err);
		return json({ error: err.message || '画像のアップロードに失敗しました' }, { status: 500 });
	}
};
