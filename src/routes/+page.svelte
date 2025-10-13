<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let isSignup = false;
	let loading = false;
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
	<div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
		<!-- ロゴ/タイトル -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-800 mb-2">MAツール</h1>
			<p class="text-gray-600">BtoB向けマーケティングオートメーション</p>
		</div>

		<!-- エラーメッセージ -->
		{#if form && !form.success && form.error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
				{form.error}
			</div>
		{/if}

		<!-- 成功メッセージ -->
		{#if form && form.success && form.message}
			<div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
				{form.message}
			</div>
		{/if}

		<!-- ログイン/サインアップフォーム -->
		<form
			method="POST"
			action={isSignup ? '?/signup' : '?/login'}
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					メールアドレス
				</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="example@company.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					パスワード
				</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					minlength="6"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="6文字以上"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
			>
				{#if loading}
					処理中...
				{:else if isSignup}
					新規登録
				{:else}
					ログイン
				{/if}
			</button>
		</form>

		<!-- 切り替えボタン -->
		<div class="mt-6 text-center">
			<button
				type="button"
				on:click={() => (isSignup = !isSignup)}
				class="text-blue-600 hover:text-blue-800 text-sm font-medium"
			>
				{isSignup ? 'すでにアカウントをお持ちの方はこちら' : '新規登録はこちら'}
			</button>
		</div>
	</div>
</div>
