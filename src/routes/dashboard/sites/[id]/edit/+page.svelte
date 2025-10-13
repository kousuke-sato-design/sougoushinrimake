<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let name = data.site.name;
	let slug = data.site.slug;
	let description = data.site.description || '';
	let showDeleteConfirm = false;
	let showLPList = false; // LP一覧の表示/非表示

	// サイト名からスラッグを自動生成
	function generateSlug() {
		slug = name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.substring(0, 50);
	}

	// ステータスラベル
	function getStatusLabel(status: string): string {
		switch (status) {
			case 'published':
				return '公開中';
			case 'draft':
				return '下書き';
			case 'archived':
				return 'アーカイブ';
			default:
				return status;
		}
	}

	// LPタイプラベル
	function getLPTypeLabel(lpType: string): string {
		switch (lpType) {
			case 'product_lp':
				return '商品LP';
			case 'benefit_page':
				return '特典ページ';
			case 'whitepaper':
				return 'ホワイトペーパー';
			default:
				return lpType;
		}
	}

	// 日時フォーマット
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('ja-JP');
	}
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div>
		<a href="/dashboard/sites" class="text-blue-600 hover:underline text-sm mb-2 inline-block">
			← サイト一覧に戻る
		</a>
		<h1 class="text-3xl font-bold text-gray-800">サイト編集</h1>
		<p class="text-gray-600 mt-1">{data.site.name}の設定を編集</p>
	</div>

	<!-- 成功メッセージ -->
	{#if form?.success}
		<div class="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
			{form.message}
		</div>
	{/if}

	<!-- エラーメッセージ -->
	{#if form?.message && !form?.success}
		<div class="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
			{form.message}
			{#if form.error}
				<p class="text-sm mt-1 opacity-80">{form.error}</p>
			{/if}
		</div>
	{/if}

	<!-- サイト情報カード -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
		<div class="flex items-start justify-between">
			<div>
				<h3 class="text-lg font-semibold text-blue-900 mb-2">📊 サイト統計</h3>
				<div class="space-y-1 text-blue-800">
					<p>• 公開URL: <code class="bg-blue-100 px-2 py-1 rounded">/WEBTHQ/{data.site.slug}</code></p>
					<p>• 登録LP数: <span class="font-semibold">{data.lpCount}個</span></p>
					<p>
						• 作成日: <span class="font-semibold"
							>{new Date(data.site.created_at).toLocaleDateString('ja-JP')}</span
						>
					</p>
				</div>
			</div>
			<div>
				<a
					href="/WEBTHQ/{data.site.slug}"
					target="_blank"
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
				>
					公開ページを開く 🔗
				</a>
			</div>
		</div>
	</div>

	<!-- サイト編集フォーム -->
	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>
		<form method="POST" action="?/update" use:enhance class="space-y-6">
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
				<p class="text-sm text-gray-500 mt-1">英数字とハイフンのみ使用可能</p>
				{#if slug !== data.site.slug}
					<p class="text-sm text-amber-600 mt-1">
						⚠️ スラッグを変更すると、既存のURLが変更されます
					</p>
				{/if}
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

			<!-- 送信ボタン -->
			<div class="pt-4">
				<button
					type="submit"
					class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
				>
					変更を保存
				</button>
			</div>
		</form>
	</div>

	<!-- LP管理セクション -->
	<div class="bg-white rounded-lg shadow p-6">
		<h2 class="text-lg font-semibold text-gray-800 mb-4">LP管理</h2>
		<div class="space-y-4">
			<p class="text-gray-600">このサイトには現在{data.lpCount}個のLPが登録されています。</p>
			<div class="flex gap-3">
				<a
					href="/dashboard/landing-pages/create"
					class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
				>
					+ 新しいLPを作成
				</a>
				<button
					type="button"
					on:click={() => (showLPList = !showLPList)}
					class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
				>
					{showLPList ? 'LP一覧を隠す' : 'LP一覧を表示'} ({data.lpCount})
				</button>
			</div>

			<!-- LP一覧カード（3カラム） -->
			{#if showLPList}
				<div class="mt-6 pt-6 border-t border-gray-200">
					{#if data.landingPages.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each data.landingPages as lp}
								<div
									class="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
								>
									<!-- LPタイプバッジ -->
									<div class="mb-3">
										<span
											class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded"
										>
											{getLPTypeLabel(lp.lp_type)}
										</span>
									</div>

									<!-- タイトル -->
									<h3 class="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
										{lp.title}
									</h3>

									<!-- ステータス -->
									<div class="mb-3">
										<span
											class="px-2 py-1 text-xs rounded-full {lp.status === 'published'
												? 'bg-green-100 text-green-700'
												: lp.status === 'archived'
													? 'bg-amber-100 text-amber-700'
													: 'bg-gray-100 text-gray-700'}"
										>
											{getStatusLabel(lp.status)}
										</span>
									</div>

									<!-- メタ情報 -->
									<div class="text-xs text-gray-500 space-y-1 mb-4">
										<p>作成: {formatDate(lp.created_at)}</p>
										<p>更新: {formatDate(lp.updated_at)}</p>
									</div>

									<!-- アクションボタン -->
									<div class="flex gap-2">
										<a
											href="/dashboard/landing-pages/{lp.id}/edit"
											class="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
										>
											編集
										</a>
										{#if lp.status === 'published'}
											<a
												href="/WEBTHQ/{data.site.slug}/{lp.slug}"
												target="_blank"
												class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
												title="公開ページを開く"
											>
												🔗
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12 text-gray-500">
							<p class="text-lg mb-2">LPがまだありません</p>
							<p class="text-sm">「新しいLPを作成」ボタンから作成してください</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- 危険なアクション -->
	<div class="bg-white rounded-lg shadow p-6 border-2 border-red-200">
		<h2 class="text-lg font-semibold text-red-600 mb-4">⚠️ 危険な操作</h2>
		{#if !showDeleteConfirm}
			<div>
				<p class="text-gray-600 mb-4">
					サイトを削除すると、このサイトに紐づく<strong>全てのLP（{data.lpCount}個）も削除されます</strong
					>。この操作は取り消せません。
				</p>
				<button
					type="button"
					on:click={() => (showDeleteConfirm = true)}
					class="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
				>
					サイトを削除
				</button>
			</div>
		{:else}
			<div class="p-4 bg-red-50 border border-red-300 rounded-lg">
				<p class="text-red-800 font-semibold mb-3">本当に削除しますか？</p>
				<p class="text-red-700 text-sm mb-4">
					「{data.site.name}」とこのサイトに紐づく{data.lpCount}個のLPが完全に削除されます。
				</p>
				<form method="POST" action="?/delete" use:enhance class="flex gap-3">
					<button
						type="submit"
						class="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
					>
						はい、削除します
					</button>
					<button
						type="button"
						on:click={() => (showDeleteConfirm = false)}
						class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
					>
						キャンセル
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>
