<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	let status: 'loading' | 'success' | 'error' = 'loading';
	let message = 'メールアドレスを確認しています...';

	onMount(async () => {
		const tokenHash = $page.url.searchParams.get('token_hash');
		const type = $page.url.searchParams.get('type');

		if (!tokenHash || type !== 'email') {
			status = 'error';
			message = '無効な確認リンクです';
			return;
		}

		try {
			const { error } = await data.supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: 'email'
			});

			if (error) {
				status = 'error';
				message = `確認に失敗しました: ${error.message}`;
			} else {
				status = 'success';
				message = 'メールアドレスが確認されました！ログインページに移動します...';
				setTimeout(() => {
					goto('/');
				}, 2000);
			}
		} catch (err) {
			status = 'error';
			message = '予期しないエラーが発生しました';
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
	<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
		{#if status === 'loading'}
			<div class="text-6xl mb-4 animate-spin">⏳</div>
			<h1 class="text-2xl font-bold text-gray-800 mb-2">確認中...</h1>
			<p class="text-gray-600">{message}</p>
		{:else if status === 'success'}
			<div class="text-6xl mb-4">✅</div>
			<h1 class="text-2xl font-bold text-green-600 mb-2">確認完了！</h1>
			<p class="text-gray-600">{message}</p>
		{:else}
			<div class="text-6xl mb-4">❌</div>
			<h1 class="text-2xl font-bold text-red-600 mb-2">エラー</h1>
			<p class="text-gray-600 mb-6">{message}</p>
			<a
				href="/"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
			>
				ログインページに戻る
			</a>
		{/if}
	</div>
</div>
