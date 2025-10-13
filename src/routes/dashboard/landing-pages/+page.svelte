<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	// ステータスの日本語表示
	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			draft: '下書き',
			published: '公開中',
			archived: 'アーカイブ'
		};
		return labels[status] || status;
	}

	// ステータスバッジの色
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			draft: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			published: 'bg-green-100 text-green-700 hover:bg-green-200',
			archived: 'bg-amber-100 text-amber-700 hover:bg-amber-200'
		};
		return colors[status] || 'bg-gray-100 text-gray-700';
	}

	// 次のステータスを取得（表示用）
	function getNextStatusLabel(status: string) {
		switch (status) {
			case 'draft':
				return '公開する';
			case 'published':
				return '非公開にする';
			case 'archived':
				return '公開する';
			default:
				return '公開する';
		}
	}

	// LPタイプの日本語表示
	function getTypeLabel(type: string) {
		const labels: Record<string, string> = {
			product_lp: '商品LP',
			whitepaper: 'ホワイトペーパー',
			benefit_page: '特典ページ'
		};
		return labels[type] || type;
	}

	// 日付フォーマット
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	// 成功メッセージを自動で消す
	let showSuccessMessage = false;
	$: if (form?.success) {
		showSuccessMessage = true;
		setTimeout(() => {
			showSuccessMessage = false;
		}, 3000);
	}
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">LP一覧</h1>
			<p class="text-gray-600 mt-1">ランディングページの管理</p>
		</div>
		<a
			href="/dashboard/landing-pages/create"
			class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
		>
			<span>＋</span>
			<span>新規LP作成</span>
		</a>
	</div>

	<!-- フィルター・検索エリア -->
	<div class="bg-white rounded-lg shadow p-4">
		<div class="flex gap-4">
			<div class="flex-1">
				<input
					type="text"
					placeholder="LP名で検索..."
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<select
				class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">すべてのステータス</option>
				<option value="draft">下書き</option>
				<option value="published">公開中</option>
				<option value="archived">アーカイブ</option>
			</select>
			<select
				class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">すべてのタイプ</option>
				<option value="product_lp">商品LP</option>
				<option value="whitepaper">特典ページ</option>
			</select>
		</div>
	</div>

	<!-- LP一覧 -->
	{#if data.landingPages.length === 0}
		<!-- 空の状態 -->
		<div class="bg-white rounded-lg shadow p-12 text-center">
			<div class="text-6xl mb-4">📄</div>
			<h3 class="text-xl font-semibold text-gray-800 mb-2">まだLPがありません</h3>
			<p class="text-gray-600 mb-6">最初のランディングページを作成しましょう</p>
			<a
				href="/dashboard/landing-pages/create"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
			>
				LP作成を始める
			</a>
		</div>
	{:else}
		<!-- LPカード表示 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.landingPages as lp}
				<div class="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
					<!-- サムネイル/プレビュー -->
					<div class="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
						<!-- トグルスイッチ（右上に配置） -->
						<div class="absolute top-4 right-4">
							<form method="POST" action="?/toggleStatus" use:enhance>
								<input type="hidden" name="lp_id" value={lp.id} />
								<input type="hidden" name="current_status" value={lp.status} />
								<label class="relative inline-flex items-center cursor-pointer" title={lp.status === 'published' ? '公開中（クリックで下書きに戻す）' : '下書き（クリックで公開する）'}>
									<input
										type="checkbox"
										class="sr-only peer"
										checked={lp.status === 'published'}
										on:change={(e) => e.target.form.requestSubmit()}
									/>
									<div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-md"></div>
									<span class="ml-2 text-xs font-medium text-gray-700">
										{lp.status === 'published' ? '公開' : '下書き'}
									</span>
								</label>
							</form>
						</div>
						<div class="text-center">
							<div class="text-5xl mb-2">
								{#if lp.lp_type === 'product_lp'}
									📦
								{:else if lp.lp_type === 'whitepaper' || lp.lp_type === 'benefit_page'}
									🎁
								{/if}
							</div>
						</div>
					</div>

					<!-- カードコンテンツ -->
					<div class="p-6">
						<div class="mb-3">
							<span class="text-sm text-gray-500">{getTypeLabel(lp.lp_type)}</span>
							<h3 class="text-lg font-semibold text-gray-800 mt-1 line-clamp-2">
								{lp.title || '無題のLP'}
							</h3>
						</div>

						{#if lp.description}
							<p class="text-sm text-gray-600 mb-4 line-clamp-2">{lp.description}</p>
						{/if}

						<div class="text-xs text-gray-500 mb-4">
							作成日: {formatDate(lp.created_at)}
						</div>

						<!-- アクションボタン -->
						<div class="flex gap-2">
							{#if lp.status === 'published'}
								<a
									href="/lp/{lp.slug}"
									target="_blank"
									rel="noopener noreferrer"
									class="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-lg text-sm font-medium hover:bg-green-700 transition"
								>
									表示
								</a>
							{/if}
							<a
								href="/dashboard/landing-pages/{lp.id}/edit"
								class="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg text-sm font-medium hover:bg-blue-700 transition"
							>
								編集
							</a>
							<button
								class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
							>
								⋯
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- 成功メッセージ表示 -->
	{#if showSuccessMessage && form?.success}
		<div class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
			<span>✓</span>
			<span>{form.message}</span>
		</div>
	{/if}
</div>
