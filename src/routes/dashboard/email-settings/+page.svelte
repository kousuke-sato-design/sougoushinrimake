<script lang="ts">
	import { onMount } from 'svelte';
	import { Mail, Plus, Edit, Trash2, Check, X } from 'lucide-svelte';
	import type { EmailSetting, EmailSettingInput } from '$lib/types/email';
	import type { ImapAccount } from '$lib/types/imap';
	import { supabase } from '$lib/supabaseClient';

	let emailSettings: EmailSetting[] = [];
	let imapAccounts: ImapAccount[] = [];
	let loading = true;
	let loadingImap = false;
	let showModal = false;
	let editingId: string | null = null;
	let error = '';
	let success = '';

	let formData: EmailSettingInput = {
		name: '',
		subject: '',
		body: '',
		from_name: '',
		imap_account_id: '',
		is_active: true
	};

	onMount(async () => {
		await loadEmailSettings();
		await loadImapAccounts();
	});

	async function loadEmailSettings() {
		loading = true;
		try {
			const { data, error: err } = await supabase
				.from('email_settings')
				.select('*')
				.order('created_at', { ascending: false });

			if (err) throw err;
			emailSettings = data || [];
		} catch (err: any) {
			console.error('Error loading email settings:', err);
			error = 'メール設定の読み込みに失敗しました';
		} finally {
			loading = false;
		}
	}

	async function loadImapAccounts() {
		loadingImap = true;
		try {
			const { data, error: err } = await supabase
				.from('imap_accounts')
				.select('*')
				.eq('is_active', true)
				.order('created_at', { ascending: false });

			if (err) throw err;
			imapAccounts = data || [];
		} catch (err: any) {
			console.error('Error loading IMAP accounts:', err);
		} finally {
			loadingImap = false;
		}
	}

	function openCreateModal() {
		editingId = null;
		formData = {
			name: '',
			subject: 'お問い合わせありがとうございます',
			body: '{{name}}様\n\nこの度はお問い合わせいただき、誠にありがとうございます。\n以下の内容で受け付けいたしました。\n\nお名前: {{name}}\nメールアドレス: {{email}}\n\n担当者より3営業日以内にご連絡させていただきます。\n\nよろしくお願いいたします。',
			from_name: '',
			imap_account_id: '',
			is_active: true
		};
		showModal = true;
	}

	function openEditModal(setting: EmailSetting) {
		editingId = setting.id;
		formData = {
			name: setting.name,
			subject: setting.subject,
			body: setting.body,
			from_name: setting.from_name || '',
			imap_account_id: setting.imap_account_id || '',
			is_active: setting.is_active
		};
		showModal = true;
	}

	async function handleSubmit() {
		error = '';
		success = '';

		if (!formData.name || !formData.subject || !formData.body || !formData.imap_account_id) {
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
					.from('email_settings')
					.update(formData)
					.eq('id', editingId);

				if (err) throw err;
				success = 'メール設定を更新しました';
			} else {
				// 新規作成（user_idを追加）
				const { error: err } = await supabase.from('email_settings').insert([
					{
						...formData,
						user_id: user.id
					}
				]);

				if (err) throw err;
				success = 'メール設定を作成しました';
			}

			showModal = false;
			await loadEmailSettings();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			console.error('Error saving email setting:', err);
			error = 'メール設定の保存に失敗しました';
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('このメール設定を削除しますか？')) return;

		try {
			const { error: err } = await supabase.from('email_settings').delete().eq('id', id);

			if (err) throw err;
			success = 'メール設定を削除しました';
			await loadEmailSettings();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			console.error('Error deleting email setting:', err);
			error = 'メール設定の削除に失敗しました';
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
						<Mail size={32} class="text-blue-600" />
						メール設定
					</h1>
					<p class="text-gray-600 mt-2">フォーム送信時の自動返信メールテンプレートを管理します</p>
				</div>
				<button
					on:click={openCreateModal}
					class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
				>
					<Plus size={20} />
					新規作成
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

		<!-- メール設定一覧 -->
		{#if loading}
			<div class="text-center py-12">
				<p class="text-gray-500">読み込み中...</p>
			</div>
		{:else if emailSettings.length === 0}
			<div class="text-center py-12 bg-gray-50 rounded-lg">
				<Mail size={48} class="mx-auto text-gray-300 mb-4" />
				<p class="text-gray-500 mb-4">メール設定がまだありません</p>
				<button
					on:click={openCreateModal}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
				>
					最初の設定を作成
				</button>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each emailSettings as setting}
					<div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold text-gray-900">{setting.name}</h3>
									{#if setting.is_active}
										<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">有効</span>
									{:else}
										<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">無効</span>
									{/if}
								</div>
								<div class="space-y-1 text-sm">
									<p class="text-gray-700">
										<span class="font-medium">件名:</span>
										{setting.subject}
									</p>
									{#if setting.from_name}
										<p class="text-gray-700">
											<span class="font-medium">送信者名:</span>
											{setting.from_name}
										</p>
									{/if}
									{#if setting.imap_account_id}
										{@const imapAccount = imapAccounts.find(a => a.id === setting.imap_account_id)}
										{#if imapAccount}
											<p class="text-gray-700">
												<span class="font-medium">IMAPアカウント:</span>
												{imapAccount.name} ({imapAccount.email})
											</p>
										{/if}
									{/if}
									<p class="text-gray-500 text-xs mt-2">
										作成日: {new Date(setting.created_at).toLocaleString('ja-JP')}
									</p>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									on:click={() => openEditModal(setting)}
									class="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
									title="編集"
								>
									<Edit size={18} />
								</button>
								<button
									on:click={() => handleDelete(setting.id)}
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
					{editingId ? 'メール設定を編集' : 'メール設定を作成'}
				</h2>

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<!-- 設定名 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							設定名 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.name}
							placeholder="例: お問い合わせ自動返信"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<!-- 件名 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							件名 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.subject}
							placeholder="例: お問い合わせありがとうございます"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<!-- 本文 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							本文 <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={formData.body}
							rows="12"
							placeholder="メール本文を入力してください"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
							required
						></textarea>
						<p class="text-xs text-gray-500 mt-1">
							利用可能な変数: {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{company_name}}'}
						</p>
					</div>

					<!-- 送信者名 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">送信者名</label>
						<input
							type="text"
							bind:value={formData.from_name}
							placeholder="例: 株式会社○○"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<!-- IMAPアカウント選択 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							IMAPアカウント <span class="text-red-500">*</span>
						</label>
						<select
							bind:value={formData.imap_account_id}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="">選択してください</option>
							{#each imapAccounts as account}
								<option value={account.id}>{account.name} ({account.email})</option>
							{/each}
						</select>
						{#if imapAccounts.length === 0}
							<p class="text-xs text-gray-500 mt-1">
								IMAP設定がありません。
								<a href="/dashboard/imap-settings" target="_blank" class="text-blue-600 hover:underline">
									IMAP設定を作成
								</a>
							</p>
						{/if}
					</div>

					<!-- 有効/無効 -->
					<div>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" bind:checked={formData.is_active} class="w-4 h-4 text-blue-600 rounded" />
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
							class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
						>
							{editingId ? '更新' : '作成'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
