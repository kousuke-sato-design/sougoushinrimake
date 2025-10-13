<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let uploading = false;
	let logoPreview = data.profile?.logo_url || '';
	let selectedFile: File | null = null;

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				logoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(selectedFile);
		}
	}
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
				class="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
			>
				企業情報
			</a>
			<a
				href="/dashboard/settings/api"
				class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
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
		</div>
	{/if}

	<!-- 企業ロゴアップロード -->
	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-xl font-semibold text-gray-800 mb-4">企業ロゴ</h2>

		<form
			method="POST"
			action="?/uploadLogo"
			enctype="multipart/form-data"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					await update();
					uploading = false;
				};
			}}
		>
			<div class="flex items-start gap-6">
				<!-- ロゴプレビュー -->
				<div class="flex-shrink-0">
					{#if logoPreview}
						<img
							src={logoPreview}
							alt="Company Logo"
							class="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg p-2"
						/>
					{:else}
						<div
							class="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400"
						>
							<span class="text-4xl">🏢</span>
						</div>
					{/if}
				</div>

				<!-- アップロードフォーム -->
				<div class="flex-1">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						ロゴファイルを選択
					</label>
					<input
						type="file"
						name="logo"
						accept="image/jpeg,image/png,image/gif,image/webp"
						on:change={handleFileSelect}
						class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
					/>
					<p class="text-sm text-gray-500 mt-2">JPEG, PNG, GIF, WebP（最大5MB）</p>

					<button
						type="submit"
						disabled={uploading}
						class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{uploading ? 'アップロード中...' : 'ロゴをアップロード'}
					</button>
				</div>
			</div>
		</form>
	</div>

	<!-- 企業情報フォーム -->
	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-xl font-semibold text-gray-800 mb-4">企業情報</h2>

		<form
			method="POST"
			action="?/updateProfile"
			use:enhance
			class="space-y-4"
		>
			<!-- 会社名 -->
			<div>
				<label for="company_name" class="block text-sm font-medium text-gray-700 mb-1">
					会社名 <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="company_name"
					name="company_name"
					value={form?.companyName ?? data.profile?.company_name ?? ''}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="株式会社サンプル"
				/>
			</div>

			<!-- 業種 -->
			<div>
				<label for="industry" class="block text-sm font-medium text-gray-700 mb-1">
					業種
				</label>
				<input
					type="text"
					id="industry"
					name="industry"
					value={form?.industry ?? data.profile?.industry ?? ''}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="例: IT・ソフトウェア"
				/>
			</div>

			<!-- Webサイト -->
			<div>
				<label for="website" class="block text-sm font-medium text-gray-700 mb-1">
					Webサイト
				</label>
				<input
					type="url"
					id="website"
					name="website"
					value={form?.website ?? data.profile?.website ?? ''}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="https://example.com"
				/>
			</div>

			<!-- 説明 -->
			<div>
				<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
					会社説明
				</label>
				<textarea
					id="description"
					name="description"
					rows="4"
					value={form?.description ?? data.profile?.description ?? ''}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="会社の説明を入力してください"
				></textarea>
			</div>

			<!-- ブランドカラー（自動抽出） -->
			{#if data.profile?.brand_colors}
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						ブランドカラー（ロゴから自動抽出）
					</label>
					<div class="flex gap-2">
						{#each JSON.parse(data.profile.brand_colors) as color}
							<div
								class="w-16 h-16 rounded-lg border-2 border-gray-200"
								style="background-color: {color}"
								title={color}
							></div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 送信ボタン -->
			<div class="pt-4">
				<button
					type="submit"
					class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
				>
					保存する
				</button>
			</div>
		</form>
	</div>
</div>
