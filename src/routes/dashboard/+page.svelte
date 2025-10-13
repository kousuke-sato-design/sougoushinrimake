<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	// サーバーから取得した統計データ
	$: stats = data.stats;
	$: recentLPs = data.recentLPs;

	// 日時フォーマット関数
	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return '数秒前';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
		if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;

		return date.toLocaleDateString('ja-JP');
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
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div>
		<h1 class="text-3xl font-bold text-gray-800">ダッシュボード</h1>
		<p class="text-gray-600 mt-1">マーケティングオートメーションの管理画面</p>
	</div>

	<!-- ウィジェットカード -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- LP総数カード -->
		<div class="bg-white p-6 rounded-lg shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">LP総数</p>
					<p class="text-3xl font-bold text-gray-800 mt-2">{stats.totalLPs}</p>
				</div>
				<div class="text-4xl">📄</div>
			</div>
			<p class="text-sm text-gray-500 mt-4">公開中のランディングページ</p>
		</div>

		<!-- 総顧客数カード -->
		<div class="bg-white p-6 rounded-lg shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">総顧客数</p>
					<p class="text-3xl font-bold text-gray-800 mt-2">{stats.totalCustomers}</p>
				</div>
				<div class="text-4xl">👥</div>
			</div>
			<p class="text-sm text-gray-500 mt-4">登録されている顧客</p>
		</div>

		<!-- 今月の問い合わせ数カード -->
		<div class="bg-white p-6 rounded-lg shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600">今月の問い合わせ</p>
					<p class="text-3xl font-bold text-gray-800 mt-2">{stats.monthlyInquiries}</p>
				</div>
				<div class="text-4xl">📧</div>
			</div>
			<p class="text-sm text-gray-500 mt-4">今月獲得したリード</p>
		</div>
	</div>

	<!-- 追加統計カード -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- 公開中のLP -->
		<div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow border border-green-200">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-green-700">公開中のLP</p>
					<p class="text-2xl font-bold text-green-800 mt-2">{stats.publishedLPs}</p>
				</div>
				<div class="text-3xl">✅</div>
			</div>
		</div>

		<!-- 下書きのLP -->
		<div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg shadow border border-amber-200">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-amber-700">下書きのLP</p>
					<p class="text-2xl font-bold text-amber-800 mt-2">{stats.draftLPs}</p>
				</div>
				<div class="text-3xl">📝</div>
			</div>
		</div>
	</div>

	<!-- 最近のLP -->
	<div class="bg-white rounded-lg shadow">
		<div class="p-6 border-b">
			<h2 class="text-xl font-semibold text-gray-800">最近更新されたLP</h2>
		</div>
		<div class="p-6">
			{#if recentLPs.length > 0}
				<ul class="space-y-3">
					{#each recentLPs as lp}
						<li class="flex items-start gap-3 hover:bg-gray-50 p-3 rounded-lg transition">
							<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<a
										href="/dashboard/landing-pages/{lp.id}/edit"
										class="text-gray-800 font-medium hover:text-blue-600 transition"
									>
										{lp.title}
									</a>
									<span
										class="px-2 py-0.5 text-xs rounded-full {lp.status === 'published'
											? 'bg-green-100 text-green-700'
											: lp.status === 'archived'
												? 'bg-amber-100 text-amber-700'
												: 'bg-gray-100 text-gray-700'}"
									>
										{getStatusLabel(lp.status)}
									</span>
								</div>
								<p class="text-sm text-gray-500">
									{formatRelativeTime(lp.updated_at)}に更新
								</p>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-gray-500 text-center py-8">LPがまだありません</p>
			{/if}
		</div>
	</div>

	<!-- クイックアクション -->
	<div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
		<h2 class="text-2xl font-bold mb-4">今すぐ始めましょう</h2>
		<p class="mb-6 opacity-90">AIを活用してランディングページを作成し、リードを獲得しましょう。</p>
		<div class="flex gap-4">
			<a
				href="/dashboard/landing-pages/create"
				class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
			>
				LPを作成
			</a>
			<a
				href="/dashboard/customers"
				class="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
			>
				顧客を管理
			</a>
		</div>
	</div>
</div>
