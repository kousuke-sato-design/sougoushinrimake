<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let name = form?.name || '';
	let slug = form?.slug || '';
	let description = form?.description || '';

	// サイト名からスラッグを自動生成
	function generateSlug() {
		slug = name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.substring(0, 50);
	}
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div>
		<a href="/dashboard/sites" class="text-blue-600 hover:underline text-sm mb-2 inline-block">
			← サイト一覧に戻る
		</a>
		<h1 class="text-3xl font-bold text-gray-800">サイト作成</h1>
		<p class="text-gray-600 mt-1">複数のLPをまとめる新しいサイトを作成</p>
	</div>

	<!-- エラーメッセージ -->
	{#if form?.message}
		<div class="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
			{form.message}
		</div>
	{/if}

	<!-- サイト作成フォーム -->
	<div class="bg-white rounded-lg shadow p-6">
		<form method="POST" use:enhance class="space-y-6">
			<!-- サイト名 -->
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					サイト名 <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					on:blur={generateSlug}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="例: 株式会社Example"
				/>
				<p class="text-sm text-gray-500 mt-1">
					企業名やサービス名など、わかりやすい名前を入力してください
				</p>
			</div>

			<!-- スラッグ -->
			<div>
				<label for="slug" class="block text-sm font-medium text-gray-700 mb-1">
					スラッグ（URL） <span class="text-red-500">*</span>
				</label>
				<div class="flex items-center gap-2">
					<span class="text-gray-500">/WEBTHQ/</span>
					<input
						type="text"
						id="slug"
						name="slug"
						bind:value={slug}
						required
						pattern="[a-z0-9\-]+"
						class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="your-company"
					/>
				</div>
				<p class="text-sm text-gray-500 mt-1">
					英数字とハイフンのみ使用可能。サイト名から自動生成されます。
				</p>
			</div>

			<!-- 説明 -->
			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
					説明
				</label>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="3"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="このサイトの説明を入力してください（任意）"
				></textarea>
			</div>

			<!-- プレビュー -->
			{#if slug}
				<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<p class="text-sm text-blue-800 mb-1">公開URLプレビュー:</p>
					<code class="text-blue-600 font-semibold">/WEBTHQ/{slug}</code>
				</div>
			{/if}

			<!-- 送信ボタン -->
			<div class="pt-4">
				<button
					type="submit"
					class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
				>
					サイトを作成
				</button>
			</div>
		</form>
	</div>

	<!-- 説明パネル -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<h2 class="text-lg font-semibold text-blue-900 mb-3">💡 サイトとは？</h2>
		<ul class="space-y-2 text-blue-800">
			<li>• 複数のLP（ランディングページ）をまとめて管理する親ページです</li>
			<li>• 各LPは作成時に所属するサイトを選択します</li>
			<li>• サイトのURL（/WEBTHQ/your-company）にアクセスすると、そのサイトのLP一覧が表示されます</li>
			<li>
				• 例: /WEBTHQ/your-company/product-intro のように、サイト配下にLPが配置されます
			</li>
		</ul>
	</div>
</div>
