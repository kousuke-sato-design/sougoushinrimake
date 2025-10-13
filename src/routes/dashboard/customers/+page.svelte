<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let showAddModal = false;
	let showEditModal = false;
	let showImportModal = false;
	let editingCustomer: any = null;
	let csvData = '';

	// ステータスの日本語表示
	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			lead: 'リード',
			qualified: '見込み客',
			customer: '顧客',
			inactive: '非アクティブ'
		};
		return labels[status] || status;
	}

	// ステータスバッジの色
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			lead: 'bg-blue-100 text-blue-700',
			qualified: 'bg-yellow-100 text-yellow-700',
			customer: 'bg-green-100 text-green-700',
			inactive: 'bg-gray-100 text-gray-700'
		};
		return colors[status] || 'bg-gray-100 text-gray-700';
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

	// CSV エクスポート
	function exportCSV() {
		const headers = ['name', 'email', 'company', 'position', 'phone', 'status', 'created_at'];
		const csv = [
			headers.join(','),
			...data.customers.map((c) =>
				headers.map((h) => (c as any)[h] || '').join(',')
			)
		].join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// 編集モーダルを開く
	function openEditModal(customer: any) {
		editingCustomer = { ...customer };
		showEditModal = true;
	}

	// モーダルを閉じる
	function closeModals() {
		showAddModal = false;
		showEditModal = false;
		showImportModal = false;
		editingCustomer = null;
	}

	// 削除確認
	function confirmDelete(event: Event) {
		if (!confirm('本当に削除しますか？')) {
			event.preventDefault();
		}
	}
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">顧客リスト</h1>
			<p class="text-gray-600 mt-1">総顧客数: {data.total}件</p>
		</div>
		<div class="flex gap-3">
			<button
				on:click={() => (showImportModal = true)}
				class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
			>
				📥 CSVインポート
			</button>
			<button
				on:click={exportCSV}
				class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
			>
				📤 CSVエクスポート
			</button>
			<button
				on:click={() => (showAddModal = true)}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
			>
				＋ 顧客追加
			</button>
		</div>
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

	<!-- 検索・フィルター -->
	<div class="bg-white rounded-lg shadow p-4">
		<form method="GET" class="flex gap-4">
			<div class="flex-1">
				<input
					type="text"
					name="search"
					placeholder="名前、メール、会社名で検索..."
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<select
				name="status"
				class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			>
				<option value="">すべてのステータス</option>
				<option value="lead">リード</option>
				<option value="qualified">見込み客</option>
				<option value="customer">顧客</option>
				<option value="inactive">非アクティブ</option>
			</select>
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
			>
				検索
			</button>
		</form>
	</div>

	<!-- 顧客テーブル -->
	{#if data.customers.length === 0}
		<div class="bg-white rounded-lg shadow p-12 text-center">
			<div class="text-6xl mb-4">👥</div>
			<h3 class="text-xl font-semibold text-gray-800 mb-2">顧客がいません</h3>
			<p class="text-gray-600 mb-6">最初の顧客を追加しましょう</p>
			<button
				on:click={() => (showAddModal = true)}
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
			>
				顧客を追加
			</button>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							メール
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">会社</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							ステータス
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							登録日
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							アクション
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data.customers as customer}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="font-medium text-gray-900">{customer.name}</div>
								{#if customer.position}
									<div class="text-sm text-gray-500">{customer.position}</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.email}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
								{customer.company || '-'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs rounded-full {getStatusColor(customer.status)}">
									{getStatusLabel(customer.status)}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatDate(customer.created_at)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<button
									on:click={() => openEditModal(customer)}
									class="text-blue-600 hover:text-blue-800 mr-3"
								>
									編集
								</button>
								<form method="POST" action="?/delete" use:enhance class="inline">
									<input type="hidden" name="id" value={customer.id} />
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

<!-- 追加モーダル -->
{#if showAddModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">顧客を追加</h3>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ update }) => {
					await update();
					closeModals();
				};
			}} class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						名前 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="name"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						メール <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						name="email"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">会社名</label>
					<input
						type="text"
						name="company"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">役職</label>
					<input
						type="text"
						name="position"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
					<input
						type="tel"
						name="phone"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
					<select
						name="status"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					>
						<option value="lead">リード</option>
						<option value="qualified">見込み客</option>
						<option value="customer">顧客</option>
						<option value="inactive">非アクティブ</option>
					</select>
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
						追加
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- 編集モーダル -->
{#if showEditModal && editingCustomer}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">顧客を編集</h3>
			<form method="POST" action="?/update" use:enhance={() => {
				return async ({ update }) => {
					await update();
					closeModals();
				};
			}} class="space-y-4">
				<input type="hidden" name="id" value={editingCustomer.id} />
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						名前 <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="name"
						value={editingCustomer.name}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						メール <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						name="email"
						value={editingCustomer.email}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">会社名</label>
					<input
						type="text"
						name="company"
						value={editingCustomer.company || ''}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">役職</label>
					<input
						type="text"
						name="position"
						value={editingCustomer.position || ''}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
					<input
						type="tel"
						name="phone"
						value={editingCustomer.phone || ''}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
					<select
						name="status"
						value={editingCustomer.status}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
					>
						<option value="lead">リード</option>
						<option value="qualified">見込み客</option>
						<option value="customer">顧客</option>
						<option value="inactive">非アクティブ</option>
					</select>
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
						更新
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- CSVインポートモーダル -->
{#if showImportModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">CSVインポート</h3>
			<form method="POST" action="?/importCSV" use:enhance={() => {
				return async ({ update }) => {
					await update();
					closeModals();
				};
			}} class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">CSVデータ</label>
					<textarea
						name="csv_data"
						bind:value={csvData}
						rows="10"
						placeholder="name,email,company,position,phone,status&#10;田中太郎,tanaka@example.com,株式会社サンプル,営業部長,090-1234-5678,lead"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
					></textarea>
					<p class="text-sm text-gray-500 mt-1">
						※ヘッダー行は必須です（name, email, company, position, phone, status）
					</p>
				</div>
				<div class="flex gap-3 justify-end">
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
						インポート
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
