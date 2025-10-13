<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const lpTypeLabels: Record<string, string> = {
		product_lp: '商品LP',
		whitepaper: '特典ページ'
	};

	const lpTypeIcons: Record<string, string> = {
		product_lp: '📦',
		whitepaper: '🎁'
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('ja-JP');
	}
</script>

<svelte:head>
	<title>{data.site.name} - LP一覧</title>
	<meta name="description" content={data.site.description || `${data.site.name}のランディングページ一覧`} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- ヘッダー -->
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">{data.site.name}</h1>
					{#if data.site.description}
						<p class="text-gray-600 mt-1">{data.site.description}</p>
					{/if}
				</div>
				<div class="text-sm text-gray-500">
					<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
						{data.landingPages.length}個のLP
					</span>
				</div>
			</div>
		</div>
	</header>

	<!-- メインコンテンツ -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		{#if data.landingPages.length === 0}
			<!-- LPがない場合 -->
			<div class="bg-white rounded-lg shadow p-12 text-center">
				<div class="text-6xl mb-4">📄</div>
				<h2 class="text-2xl font-semibold text-gray-800 mb-2">
					まだランディングページがありません
				</h2>
				<p class="text-gray-600">
					このサイトには公開されたランディングページがまだありません。
				</p>
			</div>
		{:else}
			<!-- LP一覧グリッド -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each data.landingPages as lp}
					<a
						href="/WEBTHQ/{data.site.slug}/{lp.slug}"
						class="bg-white rounded-lg shadow hover:shadow-xl transition p-6 block"
					>
						<!-- LPタイプアイコン -->
						<div class="text-4xl mb-3">{lpTypeIcons[lp.lp_type] || '📄'}</div>

						<!-- LPタイトル -->
						<h3 class="text-xl font-semibold text-gray-800 mb-2">{lp.title}</h3>

						<!-- LP説明 -->
						{#if lp.description}
							<p class="text-gray-600 text-sm mb-3 line-clamp-2">{lp.description}</p>
						{/if}

						<!-- LPタイプバッジ -->
						<div class="flex items-center gap-2 mb-3">
							<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
								{lpTypeLabels[lp.lp_type] || lp.lp_type}
							</span>
						</div>

						<!-- 作成日 -->
						<p class="text-xs text-gray-500">作成日: {formatDate(lp.created_at)}</p>

						<!-- リンクボタン -->
						<div class="mt-4 pt-4 border-t border-gray-200">
							<span class="text-blue-600 hover:text-blue-800 font-semibold text-sm">
								詳細を見る →
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>

	<!-- フッター -->
	<footer class="bg-white border-t mt-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<p class="text-center text-gray-500 text-sm">
				© {new Date().getFullYear()}
				{data.site.name}. All rights reserved.
			</p>
		</div>
	</footer>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
