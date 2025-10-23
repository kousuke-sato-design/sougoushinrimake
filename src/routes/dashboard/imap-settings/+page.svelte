<script lang="ts">
	import { onMount } from 'svelte';
	import { Mail, Plus, Edit, Trash2, Check, X, Server } from 'lucide-svelte';
	import type { ImapAccount, ImapAccountInput, GMAIL_PRESET } from '$lib/types/imap';
	import { GMAIL_PRESET as gmailPreset } from '$lib/types/imap';
	import { supabase } from '$lib/supabaseClient';

	let imapAccounts: ImapAccount[] = [];
	let loading = true;
	let showModal = false;
	let editingId: string | null = null;
	let error = '';
	let success = '';

	let formData: ImapAccountInput = {
		name: '',
		email: '',
		imap_host: '',
		imap_port: 993,
		smtp_host: '',
		smtp_port: 587,
		username: '',
		password: '',
		use_ssl: true,
		is_active: true
	};

	onMount(async () => {
		await loadImapAccounts();
	});

	async function loadImapAccounts() {
		loading = true;
		try {
			const { data, error: err } = await supabase
				.from('imap_accounts')
				.select('*')
				.order('created_at', { ascending: false });

			if (err) throw err;
			imapAccounts = data || [];
		} catch (err: any) {
			console.error('Error loading IMAP accounts:', err);
			error = 'IMAP設定の読み込みに失敗しました';
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		editingId = null;
		formData = {
			name: '',
			email: '',
			imap_host: gmailPreset.imap_host!,
			imap_port: gmailPreset.imap_port!,
			smtp_host: gmailPreset.smtp_host!,
			smtp_port: gmailPreset.smtp_port!,
			username: '',
			password: '',
			use_ssl: gmailPreset.use_ssl!,
			is_active: true
		};
		showModal = true;
	}

	function openEditModal(account: ImapAccount) {
		editingId = account.id;
		formData = {
			name: account.name,
			email: account.email,
			imap_host: account.imap_host,
			imap_port: account.imap_port,
			smtp_host: account.smtp_host,
			smtp_port: account.smtp_port,
			username: account.username,
			password: account.password,
			use_ssl: account.use_ssl,
			is_active: account.is_active
		};
		showModal = true;
	}

	function applyGmailPreset() {
		formData = {
			...formData,
			imap_host: gmailPreset.imap_host!,
			imap_port: gmailPreset.imap_port!,
			smtp_host: gmailPreset.smtp_host!,
			smtp_port: gmailPreset.smtp_port!,
			use_ssl: gmailPreset.use_ssl!,
			username: formData.email || formData.username
		};
	}

	async function handleSubmit() {
		error = '';
		success = '';

		if (!formData.name || !formData.email || !formData.username || !formData.password) {
			error = '必須項目を入力してください';
			return;
		}

		try {
			// 現在のセッションを取得
			const { data: { session } } = await supabase.auth.getSession();
			console.log('Session:', session);

			if (!session?.user) {
				error = 'ログインが必要です。ページをリロードしてください。';
				return;
			}

			const user = session.user;

			if (editingId) {
				// 更新
				const { error: err } = await supabase
					.from('imap_accounts')
					.update(formData)
					.eq('id', editingId);

				if (err) throw err;
				success = 'IMAP設定を更新しました';
			} else {
				// 新規作成（user_idを追加）
				const { error: err } = await supabase.from('imap_accounts').insert([
					{
						...formData,
						user_id: user.id
					}
				]);

				if (err) throw err;
				success = 'IMAP設定を作成しました';
			}

			showModal = false;
			await loadImapAccounts();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			console.error('Error saving IMAP account:', err);
			error = 'IMAP設定の保存に失敗しました';
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('このIMAP設定を削除しますか？関連するメール設定も影響を受ける可能性があります。')) return;

		try {
			const { error: err } = await supabase.from('imap_accounts').delete().eq('id', id);

			if (err) throw err;
			success = 'IMAP設定を削除しました';
			await loadImapAccounts();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			console.error('Error deleting IMAP account:', err);
			error = 'IMAP設定の削除に失敗しました';
		}
	}

	function closeModal() {
		showModal = false;
		error = '';
	}
</script>

<div class="p-8">
	<div class="max-w-6xl mx-auto">
		<!-- ヘッダー -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
						<Server size={32} class="text-purple-600" />
						IMAP / SMTP 設定
					</h1>
					<p class="text-gray-600 mt-2">メール送信に使用するIMAPアカウントを管理します</p>
				</div>
				<button
					on:click={openCreateModal}
					class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
				>
					<Plus size={20} />
					新規追加
				</button>
			</div>
		</div>

		<!-- 成功・エラーメッセージ -->
		{#if success}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2">
				<Check size={20} />
				{success}
			</div>
		{/if}

		{#if error}
			<div class="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
				<X size={20} />
				{error}
			</div>
		{/if}

		<!-- IMAP設定一覧 -->
		{#if loading}
			<div class="text-center py-12">
				<p class="text-gray-500">読み込み中...</p>
			</div>
		{:else if imapAccounts.length === 0}
			<div class="text-center py-12 bg-gray-50 rounded-lg">
				<Server size={48} class="mx-auto text-gray-300 mb-4" />
				<p class="text-gray-500 mb-4">IMAP設定がまだありません</p>
				<button
					on:click={openCreateModal}
					class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
				>
					最初の設定を作成
				</button>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each imapAccounts as account}
					<div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold text-gray-900">{account.name}</h3>
									{#if account.is_active}
										<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">有効</span>
									{:else}
										<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">無効</span>
									{/if}
								</div>
								<div class="space-y-1 text-sm">
									<p class="text-gray-700">
										<span class="font-medium">メールアドレス:</span>
										{account.email}
									</p>
									<p class="text-gray-700">
										<span class="font-medium">IMAPサーバー:</span>
										{account.imap_host}:{account.imap_port}
									</p>
									<p class="text-gray-700">
										<span class="font-medium">SMTPサーバー:</span>
										{account.smtp_host}:{account.smtp_port}
									</p>
									<p class="text-gray-500 text-xs mt-2">
										作成日: {new Date(account.created_at).toLocaleString('ja-JP')}
									</p>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									on:click={() => openEditModal(account)}
									class="p-2 text-purple-600 hover:bg-purple-50 rounded transition"
									title="編集"
								>
									<Edit size={18} />
								</button>
								<button
									on:click={() => handleDelete(account.id)}
									class="p-2 text-red-600 hover:bg-red-50 rounded transition"
									title="削除"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- モーダル -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">
					{editingId ? 'IMAP設定を編集' : 'IMAP設定を作成'}
				</h2>

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<!-- Gmail プリセットボタン -->
					<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-blue-900">Gmail を使用する場合</p>
								<p class="text-xs text-blue-700 mt-1">Gmailの設定を自動入力します</p>
							</div>
							<button
								type="button"
								on:click={applyGmailPreset}
								class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
							>
								Gmail設定を適用
							</button>
						</div>
					</div>

					<!-- 設定名 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							設定名 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.name}
							placeholder="例: 営業用Gmail"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
							required
						/>
					</div>

					<!-- メールアドレス -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							メールアドレス <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							bind:value={formData.email}
							on:input={() => {
								if (formData.username === '') formData.username = formData.email;
							}}
							placeholder="例: info@example.com"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
							required
						/>
					</div>

					<!-- IMAP設定 -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">IMAPホスト</label>
							<input
								type="text"
								bind:value={formData.imap_host}
								placeholder="imap.gmail.com"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
								required
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">IMAPポート</label>
							<input
								type="number"
								bind:value={formData.imap_port}
								placeholder="993"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
								required
							/>
						</div>
					</div>

					<!-- SMTP設定 -->
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">SMTPホスト</label>
							<input
								type="text"
								bind:value={formData.smtp_host}
								placeholder="smtp.gmail.com"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
								required
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">SMTPポート</label>
							<input
								type="number"
								bind:value={formData.smtp_port}
								placeholder="587"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
								required
							/>
						</div>
					</div>

					<!-- ユーザー名 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							ユーザー名 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.username}
							placeholder="通常はメールアドレスと同じ"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
							required
						/>
					</div>

					<!-- パスワード -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							アプリパスワード <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							bind:value={formData.password}
							placeholder="Gmailの場合はアプリパスワード"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">
							Gmailの場合: <a
								href="https://support.google.com/accounts/answer/185833"
								target="_blank"
								class="text-blue-600 hover:underline"
							>
								アプリパスワードの取得方法
							</a>
						</p>
					</div>

					<!-- SSL使用 -->
					<div>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" bind:checked={formData.use_ssl} class="w-4 h-4 text-purple-600 rounded" />
							<span class="text-sm font-medium text-gray-700">SSL/TLSを使用する（推奨）</span>
						</label>
					</div>

					<!-- 有効/無効 -->
					<div>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" bind:checked={formData.is_active} class="w-4 h-4 text-purple-600 rounded" />
							<span class="text-sm font-medium text-gray-700">この設定を有効にする</span>
						</label>
					</div>

					<!-- エラーメッセージ -->
					{#if error}
						<div class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
							{error}
						</div>
					{/if}

					<!-- ボタン -->
					<div class="flex gap-3 pt-4">
						<button
							type="button"
							on:click={closeModal}
							class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
						>
							キャンセル
						</button>
						<button
							type="submit"
							class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
						>
							{editingId ? '更新' : '作成'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
