<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('ja-JP');
	}
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">サイト一覧</h1>
			<p class="text-gray-600 mt-1">複数のLPをまとめるサイトを管理</p>
		</div>
		<a
			href="/dashboard/sites/create"
			class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
		>
			+ 新規サイト作成
		</a>
	</div>

	<!-- サイトがない場合 -->
	{#if !data.sites || data.sites.length === 0}
		<div class="bg-white rounded-lg shadow p-12 text-center">
			<div class="text-6xl mb-4">🏠</div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-2">サイトがまだありません</h2>
			<p class="text-gray-600 mb-6">
				最初のサイトを作成して、LPをまとめて管理しましょう
			</p>
			<a
				href="/dashboard/sites/create"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
			>
				サイトを作成
			</a>
		</div>
	{:else}
		<!-- サイト一覧グリッド -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.sites as site}
				<div class="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
					<!-- サイト情報 -->
					<div class="mb-4">
						<h3 class="text-xl font-semibold text-gray-800 mb-2">{site.name}</h3>
						{#if site.description}
							<p class="text-gray-600 text-sm mb-3">{site.description}</p>
						{/if}
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">
								{site.lp_count}個のLP
							</span>
						</div>
					</div>

					<!-- URL表示 -->
					<div class="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
						<p class="text-xs text-gray-500 mb-1">公開URL</p>
						<code class="text-sm text-blue-600 break-all">/WEBTHQ/{site.slug}</code>
					</div>

					<!-- 作成日 -->
					<p class="text-xs text-gray-500 mb-4">作成日: {formatDate(site.created_at)}</p>

					<!-- アクションボタン -->
					<div class="flex gap-2">
						<a
							href="/dashboard/sites/{site.id}/edit"
							class="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition text-sm font-semibold"
						>
							詳細・編集
						</a>
						<a
							href="/WEBTHQ/{site.slug}"
							target="_blank"
							class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm font-semibold"
							title="サイトを開く"
						>
							🔗
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
