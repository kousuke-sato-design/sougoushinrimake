<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let showCreateModal = false;
	let showSendModal = false;
	let selectedCampaign: any = null;
	let selectedRecipients: string[] = [];
	let selectAll = false;
	let sending = false;

	// ステータスの日本語表示
	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			draft: '下書き',
			sent: '送信済み',
			scheduled: '予約中'
		};
		return labels[status] || status;
	}

	// ステータスバッジの色
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			draft: 'bg-gray-100 text-gray-700',
			sent: 'bg-green-100 text-green-700',
			scheduled: 'bg-blue-100 text-blue-700'
		};
		return colors[status] || 'bg-gray-100 text-gray-700';
	}

	// 日付フォーマット
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// 送信モーダルを開く
	function openSendModal(campaign: any) {
		selectedCampaign = campaign;
		selectedRecipients = [];
		selectAll = false;
		showSendModal = true;
	}

	// 全選択/全解除
	function toggleSelectAll() {
		if (selectAll) {
			selectedRecipients = data.customers.map((c) => c.id);
		} else {
			selectedRecipients = [];
		}
	}

	// モーダルを閉じる
	function closeModals() {
		showCreateModal = false;
		showSendModal = false;
		selectedCampaign = null;
		selectedRecipients = [];
	}

	// 削除確認
	function confirmDelete(event: Event) {
		if (!confirm('本当に削除しますか？')) {
			event.preventDefault();
		}
	}

	// 顧客ステータスのフィルター
	let statusFilter = '';
	$: filteredCustomers = statusFilter
		? data.customers.filter((c) => c.status === statusFilter)
		: data.customers;
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">メール送信</h1>
			<p class="text-gray-600 mt-1">メールキャンペーンの管理</p>
		</div>
		<button
			on:click={() => (showCreateModal = true)}
			disabled={!data.hasResendKey}
			class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
		>
			＋ キャンペーン作成
		</button>
	</div>

	<!-- Resend API警告 -->
	{#if !data.hasResendKey}
		<div class="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
			⚠️ Resend APIキーが設定されていません。.envファイルにRESEND_API_KEYを設定してください。
		</div>
	{/if}

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

	<!-- キャンペーン一覧 -->
	{#if data.campaigns.length === 0}
		<div class="bg-white rounded-lg shadow p-12 text-center">
			<div class="text-6xl mb-4">📧</div>
			<h3 class="text-xl font-semibold text-gray-800 mb-2">キャンペーンがありません</h3>
			<p class="text-gray-600 mb-6">最初のメールキャンペーンを作成しましょう</p>
			<button
				on:click={() => (showCreateModal = true)}
				disabled={!data.hasResendKey}
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
			>
				キャンペーンを作成
			</button>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							キャンペーン名
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">件名</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							ステータス
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							送信数
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							作成日
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							アクション
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data.campaigns as campaign}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4">
								<div class="font-medium text-gray-900">{campaign.name}</div>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">{campaign.subject}</td>
							<td class="px-6 py-4">
								<span class="px-2 py-1 text-xs rounded-full {getStatusColor(campaign.status)}">
									{getStatusLabel(campaign.status)}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">{campaign.sent_count || 0}件</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{formatDate(campaign.created_at)}
							</td>
							<td class="px-6 py-4 text-sm">
								{#if campaign.status === 'draft'}
									<button
										on:click={() => openSendModal(campaign)}
										class="text-blue-600 hover:text-blue-800 mr-3"
									>
										送信
									</button>
								{/if}
								<form method="POST" action="?/deleteCampaign" use:enhance class="inline">
									<input type="hidden" name="id" value={campaign.id} />
									<button
										type="submit"
										on:click={confirmDelete}
										class="text-red-600 hover:text-red-800"
									>
										削除
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- キャンペーン作成モーダル -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">メールキャンペーン作成</h3>
			<form
				method="POST"
				action="?/createCampaign"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeModals();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						キャンペーン名 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="name"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						placeholder="例: 新製品キャンペーン"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						件名 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="subject"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						placeholder="例: 【重要】新製品のご案内"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						本文 <span class="text-red-500">*</span>
					</label>
					<textarea
						name="body"
						rows="10"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						placeholder="メール本文を入力してください"
					></textarea>
				</div>

				<div class="flex gap-3 justify-end pt-4">
					<button
						type="button"
						on:click={closeModals}
						class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						キャンセル
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						作成
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- 送信モーダル -->
{#if showSendModal && selectedCampaign}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">メール送信</h3>

			<div class="mb-6 p-4 bg-blue-50 rounded-lg">
				<p class="text-sm text-blue-900">
					<strong>キャンペーン:</strong>
					{selectedCampaign.name}
				</p>
				<p class="text-sm text-blue-900 mt-1">
					<strong>件名:</strong>
					{selectedCampaign.subject}
				</p>
			</div>

			<form
				method="POST"
				action="?/sendCampaign"
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update();
						sending = false;
						closeModals();
					};
				}}
			>
				<input type="hidden" name="campaign_id" value={selectedCampaign.id} />

				<!-- 送信先選択 -->
				<div class="mb-4">
					<div class="flex items-center justify-between mb-2">
						<label class="block text-sm font-medium text-gray-700">
							送信先を選択 <span class="text-red-500">*</span>
						</label>
						<div class="flex items-center gap-4">
							<select
								bind:value={statusFilter}
								class="text-sm px-3 py-1 border border-gray-300 rounded-lg"
							>
								<option value="">すべて</option>
								<option value="lead">リード</option>
								<option value="qualified">見込み客</option>
								<option value="customer">顧客</option>
							</select>
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									bind:checked={selectAll}
									on:change={toggleSelectAll}
									class="rounded"
								/>
								<span>全選択</span>
							</label>
						</div>
					</div>

					<div class="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
						{#if filteredCustomers.length === 0}
							<p class="p-4 text-gray-500 text-center">顧客が登録されていません</p>
						{:else}
							{#each filteredCustomers as customer}
								<label class="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-0">
									<input
										type="checkbox"
										name="recipient_ids"
										value={customer.id}
										bind:group={selectedRecipients}
										class="rounded"
									/>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{customer.name}</p>
										<p class="text-xs text-gray-500">{customer.email}</p>
									</div>
									<span
										class="px-2 py-1 text-xs rounded-full {getStatusColor(customer.status)}"
									>
										{getStatusLabel(customer.status)}
									</span>
								</label>
							{/each}
						{/if}
					</div>

					<p class="text-sm text-gray-500 mt-2">選択中: {selectedRecipients.length}件</p>
				</div>

				<div class="flex gap-3 justify-end pt-4">
					<button
						type="button"
						on:click={closeModals}
						class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						キャンセル
					</button>
					<button
						type="submit"
						disabled={selectedRecipients.length === 0 || sending}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{sending ? '送信中...' : `${selectedRecipients.length}件に送信`}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
