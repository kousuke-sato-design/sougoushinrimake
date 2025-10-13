<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let testing = false;
	let showApiKey = false;
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div>
		<h1 class="text-3xl font-bold text-gray-800">設定</h1>
		<p class="text-gray-600 mt-1">企業情報とAPI設定を管理</p>
	</div>

	<!-- タブナビゲーション -->
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex space-x-8">
			<a
				href="/dashboard/settings"
				class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				企業情報
			</a>
			<a
				href="/dashboard/settings/api"
				class="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				API設定
			</a>
		</nav>
	</div>

	<!-- メッセージ表示 -->
	{#if form?.message}
		<div
			class="p-4 rounded-lg {form.success
				? 'bg-green-50 text-green-800 border border-green-200'
				: 'bg-red-50 text-red-800 border border-red-200'}"
		>
			{form.message}
			{#if form.error}
				<p class="text-sm mt-1 opacity-80">{form.error}</p>
			{/if}
		</div>
	{/if}

	<!-- Gemini API設定 -->
	<div class="bg-white rounded-lg shadow p-6">
		<div class="flex items-start justify-between mb-4">
			<div>
				<h2 class="text-xl font-semibold text-gray-800">Gemini API設定</h2>
				<p class="text-sm text-gray-600 mt-1">
					AI機能を使用するためにGemini APIキーを設定してください
				</p>
			</div>
			<div class="flex items-center gap-2">
				{#if data.apiSettings?.gemini_api_key}
					<span class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
						設定済み
					</span>
				{:else}
					<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
						未設定
					</span>
				{/if}
			</div>
		</div>

		<form method="POST" action="?/updateApiKey" use:enhance class="space-y-4">
			<!-- APIキー入力 -->
			<div>
				<label for="gemini_api_key" class="block text-sm font-medium text-gray-700 mb-1">
					Gemini APIキー <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<input
						type={showApiKey ? 'text' : 'password'}
						id="gemini_api_key"
						name="gemini_api_key"
						placeholder="AIzaSy..."
						value={data.apiSettings?.gemini_api_key?.includes('*') ? '' : ''}
						required
						class="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
					/>
					<button
						type="button"
						on:click={() => (showApiKey = !showApiKey)}
						class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
					>
						{showApiKey ? '隠す' : '表示'}
					</button>
				</div>
				<p class="text-sm text-gray-500 mt-1">
					<a
						href="https://aistudio.google.com/app/apikey"
						target="_blank"
						rel="noopener noreferrer"
						class="text-blue-600 hover:underline"
					>
						Google AI StudioでAPIキーを取得 →
					</a>
				</p>
			</div>

			<!-- ボタン -->
			<div class="flex gap-3">
				<button
					type="submit"
					class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
				>
					APIキーを保存
				</button>
			</div>
		</form>

		<!-- APIテスト -->
		{#if data.apiSettings?.gemini_api_key}
			<div class="mt-6 pt-6 border-t border-gray-200">
				<h3 class="text-lg font-semibold text-gray-800 mb-2">API接続テスト</h3>
				<p class="text-sm text-gray-600 mb-4">
					設定したAPIキーが正しく動作するかテストします
				</p>
				<form
					method="POST"
					action="?/testApiKey"
					use:enhance={() => {
						testing = true;
						return async ({ update }) => {
							await update();
							testing = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={testing}
						class="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{testing ? 'テスト中...' : '接続テスト'}
					</button>
				</form>
			</div>
		{/if}
	</div>

	<!-- 使用可能な機能 -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<h3 class="text-lg font-semibold text-blue-900 mb-3">Gemini APIで利用可能な機能</h3>
		<ul class="space-y-2 text-sm text-blue-800">
			<li class="flex items-start gap-2">
				<span class="text-blue-600 mt-0.5">✓</span>
				<span>LP（ランディングページ）の自動生成</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-blue-600 mt-0.5">✓</span>
				<span>コード編集アシスタント機能</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-blue-600 mt-0.5">✓</span>
				<span>コンテンツ最適化の提案</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-blue-600 mt-0.5">✓</span>
				<span>メールテンプレートの生成</span>
			</li>
		</ul>
	</div>

	<!-- セキュリティ情報 -->
	<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
		<div class="flex gap-3">
			<span class="text-2xl">🔒</span>
			<div class="flex-1">
				<h4 class="font-semibold text-amber-900 mb-1">セキュリティについて</h4>
				<p class="text-sm text-amber-800">
					APIキーは暗号化されてデータベースに保存されます。APIキーを第三者と共有しないでください。
				</p>
			</div>
		</div>
	</div>
</div>
