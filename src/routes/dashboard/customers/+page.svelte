<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let showAddModal = false;
	let showEditModal = false;
	let showImportModal = false;
	let showDetailsModal = false;
	let editingCustomer: any = null;
	let selectedCustomer: any = null;
	let csvData = '';
	let emailLogs: any[] = [];
	let loadingEmailLogs = false;
	let activeTab: 'info' | 'emails' = 'info';

	// 現在選択中のフォームテンプレートID（URLパラメータから取得）
	$: selectedFormTemplateId = $page.url.searchParams.get('form_template') || '';

	// フォームテンプレート毎の表示列定義
	function getColumnsForTemplate(templateId: string, template: any) {
		if (!templateId) {
			// すべて表示（デフォルト）
			return [
				{ key: 'name', label: '名前' },
				{ key: 'email', label: 'メール' },
				{ key: 'company', label: '会社名' },
				{ key: 'phone', label: '電話番号' },
				{ key: 'status', label: 'ステータス' },
				{ key: 'created_at', label: '登録日' }
			];
		}

		// テンプレートのフィールド定義から動的に列を生成
		const columns = [
			{ key: 'name', label: '名前' },
			{ key: 'email', label: 'メール' }
		];

		if (template?.fields) {
			template.fields.forEach((field: any) => {
				// 既に追加されているフィールドはスキップ
				if (field.name === 'name' || field.name === 'email') return;

				// 標準フィールド
				if (field.name === 'company' || field.name === 'company_name') {
					columns.push({ key: 'company', label: '会社名' });
				} else if (field.name === 'phone') {
					columns.push({ key: 'phone', label: '電話番号' });
				} else {
					// カスタムフィールド
					columns.push({ key: `custom_fields.${field.name}`, label: field.label });
				}
			});
		}

		columns.push({ key: 'status', label: 'ステータス' });
		columns.push({ key: 'created_at', label: '登録日' });

		return columns;
	}

	// 現在選択中のテンプレート
	$: currentTemplate = data.formTemplates.find(t => t.id === selectedFormTemplateId);

	// 表示する列
	$: displayColumns = getColumnsForTemplate(selectedFormTemplateId, currentTemplate);

	// 列の値を取得（ネストされたオブジェクトにも対応）
	function getColumnValue(customer: any, key: string) {
		if (key.startsWith('custom_fields.')) {
			const fieldName = key.replace('custom_fields.', '');
			return customer.custom_fields?.[fieldName] || '-';
		}
		return customer[key] || '-';
	}

	// タブ切り替え
	function switchFormTemplate(templateId: string) {
		const url = new URL(window.location.href);
		if (templateId) {
			url.searchParams.set('form_template', templateId);
		} else {
			url.searchParams.delete('form_template');
		}
		goto(url.toString(), { replaceState: true, keepFocus: true });
	}

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
		showDetailsModal = false;
		editingCustomer = null;
		selectedCustomer = null;
	}

	// 詳細モーダルを開く
	async function openDetailsModal(customer: any) {
		selectedCustomer = customer;
		showDetailsModal = true;
		activeTab = 'info';
		emailLogs = [];

		// メール履歴を読み込み
		loadingEmailLogs = true;
		try {
			const response = await fetch(`/api/customers/${customer.id}/email-logs`);
			if (response.ok) {
				const data = await response.json();
				emailLogs = data.emailLogs || [];
			}
		} catch (err) {
			console.error('Error loading email logs:', err);
		} finally {
			loadingEmailLogs = false;
		}
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
				name="form_template"
				value={selectedFormTemplateId}
				on:change={(e) => switchFormTemplate(e.currentTarget.value)}
				class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
			>
				<option value="">すべてのフォーム ({data.customers.length})</option>
				{#each data.formTemplates as template}
					{@const count = data.customers.filter(c => c.custom_fields?._meta?.form_template_id === template.id).length}
					<option value={template.id}>
						{template.name} ({count})
					</option>
				{/each}
			</select>
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
						<!-- 動的ヘッダー -->
						{#each displayColumns as column}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								{column.label}
							</th>
						{/each}
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
							アクション
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data.customers as customer}
						<tr class="hover:bg-gray-50">
							<!-- 動的セル -->
							{#each displayColumns as column}
								<td class="px-6 py-4 whitespace-nowrap">
									{#if column.key === 'status'}
										<span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(customer.status)}">
											{getStatusLabel(customer.status)}
										</span>
									{:else if column.key === 'created_at'}
										<span class="text-sm text-gray-900">{formatDate(customer.created_at)}</span>
									{:else if column.key === 'name'}
										<div class="font-medium text-gray-900">{customer.name || '-'}</div>
										{#if customer.position}
											<div class="text-sm text-gray-500">{customer.position}</div>
										{/if}
									{:else}
										<span class="text-sm text-gray-900">{getColumnValue(customer, column.key)}</span>
									{/if}
								</td>
							{/each}
							<!-- アクション列 -->
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<button
									on:click={() => openDetailsModal(customer)}
									class="text-gray-600 hover:text-gray-800 mr-3"
								>
									詳細
								</button>
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

<!-- 問い合わせ詳細モーダル -->
{#if showDetailsModal && selectedCustomer}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h3 class="text-xl font-semibold text-gray-800 mb-4">顧客詳細</h3>

			<!-- タブナビゲーション -->
			<div class="flex border-b border-gray-200 mb-4">
				<button
					class="px-4 py-2 font-medium text-sm transition {activeTab === 'info'
						? 'border-b-2 border-blue-600 text-blue-600'
						: 'text-gray-600 hover:text-gray-800'}"
					on:click={() => (activeTab = 'info')}
				>
					基本情報
				</button>
				<button
					class="px-4 py-2 font-medium text-sm transition {activeTab === 'emails'
						? 'border-b-2 border-blue-600 text-blue-600'
						: 'text-gray-600 hover:text-gray-800'}"
					on:click={() => (activeTab = 'emails')}
				>
					メール履歴 {#if emailLogs.length > 0}<span class="ml-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{emailLogs.length}</span>{/if}
				</button>
			</div>

			<!-- タブコンテンツ -->
			{#if activeTab === 'info'}
			<!-- 基本情報 -->
			<div class="mb-6 p-4 bg-gray-50 rounded-lg">
				<h4 class="font-semibold text-gray-700 mb-3">顧客情報</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-gray-600">名前:</span>
						<span class="ml-2 font-medium">{selectedCustomer.name}</span>
					</div>
					<div>
						<span class="text-gray-600">メール:</span>
						<span class="ml-2 font-medium">{selectedCustomer.email}</span>
					</div>
					{#if selectedCustomer.company}
						<div>
							<span class="text-gray-600">会社名:</span>
							<span class="ml-2 font-medium">{selectedCustomer.company}</span>
						</div>
					{/if}
					{#if selectedCustomer.position}
						<div>
							<span class="text-gray-600">役職:</span>
							<span class="ml-2 font-medium">{selectedCustomer.position}</span>
						</div>
					{/if}
					{#if selectedCustomer.phone}
						<div>
							<span class="text-gray-600">電話:</span>
							<span class="ml-2 font-medium">{selectedCustomer.phone}</span>
						</div>
					{/if}
					<div>
						<span class="text-gray-600">登録日:</span>
						<span class="ml-2 font-medium">{formatDate(selectedCustomer.created_at)}</span>
					</div>
				</div>
			</div>

			<!-- 問い合わせ内容 -->
			{#if selectedCustomer.custom_fields}
				<div class="mb-4">
					<h4 class="font-semibold text-gray-700 mb-3">問い合わせ内容</h4>
					<div class="space-y-3">
						{#each Object.entries(selectedCustomer.custom_fields) as [key, value]}
							{#if key !== '_meta'}
								<div class="p-3 bg-gray-50 rounded-lg">
									<div class="text-sm font-medium text-gray-700 mb-1">
										{key.replace(/_/g, ' ')}
									</div>
									<div class="text-sm text-gray-900 whitespace-pre-wrap">
										{value || '-'}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- フォームテンプレート情報 -->
				{#if selectedCustomer.custom_fields._meta?.form_template_name}
					<div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
						<div class="text-xs text-blue-600 font-medium">
							使用フォーム: {selectedCustomer.custom_fields._meta.form_template_name}
						</div>
					</div>
				{/if}
			{/if}

			<!-- 送信元LP情報 -->
			{#if selectedCustomer.landing_pages}
				<div class="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
					<div class="text-xs text-green-600 font-medium">
						送信元LP: {selectedCustomer.landing_pages.title}
					</div>
				</div>
			{/if}
			{:else if activeTab === 'emails'}
			<!-- メール履歴 -->
			<div class="space-y-4">
				{#if loadingEmailLogs}
					<div class="text-center py-8 text-gray-500">
						<div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
						<p>メール履歴を読み込み中...</p>
					</div>
				{:else if emailLogs.length === 0}
					<div class="text-center py-8 text-gray-500">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						<p>まだメール履歴がありません</p>
					</div>
				{:else}
					{#each emailLogs as log}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
							<!-- ヘッダー -->
							<div class="flex items-start justify-between mb-3">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<span class="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
											自動返信
										</span>
										{#if log.email_settings}
											<span class="text-xs text-gray-500">
												{log.email_settings.name}
											</span>
										{/if}
									</div>
									<div class="text-sm font-semibold text-gray-800">
										{log.subject}
									</div>
								</div>
								<div class="text-xs text-gray-500">
									{new Date(log.sent_at).toLocaleString('ja-JP', {
										year: 'numeric',
										month: '2-digit',
										day: '2-digit',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</div>
							</div>

							<!-- 送信先 -->
							<div class="text-xs text-gray-600 mb-3">
								<span class="font-medium">To:</span> {log.to_email}
							</div>

							<!-- ステータス -->
							<div class="flex items-center gap-2">
								<span class="inline-flex items-center px-2 py-1 text-xs rounded {log.status === 'sent'
										? 'bg-blue-100 text-blue-700'
										: log.status === 'delivered'
											? 'bg-green-100 text-green-700'
											: log.status === 'failed'
												? 'bg-red-100 text-red-700'
												: 'bg-gray-100 text-gray-700'}">
									{log.status === 'sent'
										? '送信済み'
										: log.status === 'delivered'
											? '配信済み'
											: log.status === 'failed'
												? '失敗'
												: log.status}
								</span>
							</div>

							<!-- 本文プレビュー（折りたたみ可能） -->
							<details class="mt-3">
								<summary class="cursor-pointer text-xs text-blue-600 hover:text-blue-800 font-medium">
									メール本文を表示
								</summary>
								<div class="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-60 overflow-y-auto">
									{@html log.body || '-'}
								</div>
							</details>
						</div>
					{/each}
				{/if}
			</div>
			{/if}

			<!-- 閉じるボタン -->
			<div class="flex justify-end pt-4">
				<button
					type="button"
					on:click={closeModals}
					class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
				>
					閉じる
				</button>
			</div>
		</div>
	</div>
{/if}
