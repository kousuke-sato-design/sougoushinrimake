<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, Plus, Edit, Trash2, Check, X, Copy } from 'lucide-svelte';
	import type { FormTemplate, FormTemplateInput, FormField } from '$lib/types/form';
	import { DEFAULT_FORM_TEMPLATES } from '$lib/types/form';
	import { supabase } from '$lib/supabaseClient';

	let templates: FormTemplate[] = [];
	let loading = true;
	let showModal = false;
	let editingId: string | null = null;
	let error = '';
	let success = '';

	let formData: FormTemplateInput = {
		name: '',
		description: '',
		fields: [],
		is_default: false
	};

	onMount(async () => {
		await loadTemplates();
	});

	async function loadTemplates() {
		loading = true;
		try {
			const { data, error: err } = await supabase
				.from('form_templates')
				.select('*')
				.order('created_at', { ascending: false });

			if (err) throw err;
			templates = data || [];
		} catch (err: any) {
			console.error('Error loading form templates:', err);
			error = 'フォームテンプレートの読み込みに失敗しました';
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		editingId = null;
		formData = {
			name: '',
			description: '',
			fields: [
				{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
				{ name: 'email', label: 'メールアドレス', type: 'email', required: true, placeholder: 'yamada@example.com' },
				{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true, placeholder: 'お問い合わせ内容をご記入ください' }
			],
			is_default: false
		};
		showModal = true;
	}

	function openEditModal(template: FormTemplate) {
		editingId = template.id;
		formData = {
			name: template.name,
			description: template.description || '',
			fields: JSON.parse(JSON.stringify(template.fields)), // ディープコピー
			is_default: template.is_default
		};
		showModal = true;
	}

	function applyPreset(presetKey: 'basic' | 'business' | 'download') {
		const preset = DEFAULT_FORM_TEMPLATES[presetKey];
		formData.name = preset.name;
		formData.description = preset.description;
		formData.fields = JSON.parse(JSON.stringify(preset.fields)); // ディープコピー
	}

	function addField() {
		formData.fields = [
			...formData.fields,
			{ name: 'field_' + Date.now(), label: '新しい項目', type: 'text', required: false, placeholder: '' }
		];
	}

	function removeField(index: number) {
		formData.fields = formData.fields.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		error = '';
		success = '';

		if (!formData.name || formData.fields.length === 0) {
			error = 'テンプレート名とフォーム項目は必須です';
			return;
		}

		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session?.user) {
				error = 'ログインが必要です';
				return;
			}

			if (editingId) {
				// 更新
				const { error: err } = await supabase
					.from('form_templates')
					.update(formData)
					.eq('id', editingId);

				if (err) throw err;
				success = 'テンプレートを更新しました';
			} else {
				// 新規作成
				const { error: err } = await supabase.from('form_templates').insert([
					{
						...formData,
						user_id: session.user.id
					}
				]);

				if (err) throw err;
				success = 'テンプレートを作成しました';
			}

			showModal = false;
			await loadTemplates();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			console.error('Error saving template:', err);
			error = 'テンプレートの保存に失敗しました';
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('このテンプレートを削除しますか？')) return;

		try {
			const { error: err } = await supabase.from('form_templates').delete().eq('id', id);

			if (err) throw err;
			success = 'テンプレートを削除しました';
			await loadTemplates();
			setTimeout(() => (success = ''), 3000);
		} catch (err: any) {
			console.error('Error deleting template:', err);
			error = 'テンプレートの削除に失敗しました';
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
						<FileText size={32} class="text-green-600" />
						フォームテンプレート
					</h1>
					<p class="text-gray-600 mt-2">お問い合わせフォームの項目をテンプレートとして管理します</p>
				</div>
				<button
					on:click={openCreateModal}
					class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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

		<!-- テンプレート一覧 -->
		{#if loading}
			<div class="text-center py-12">
				<p class="text-gray-500">読み込み中...</p>
			</div>
		{:else if templates.length === 0}
			<div class="text-center py-12 bg-gray-50 rounded-lg">
				<FileText size={48} class="mx-auto text-gray-300 mb-4" />
				<p class="text-gray-500 mb-4">フォームテンプレートがまだありません</p>
				<button
					on:click={openCreateModal}
					class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					最初のテンプレートを作成
				</button>
			</div>
		{:else}
			<div class="grid gap-4">
				{#each templates as template}
					<div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold text-gray-900">{template.name}</h3>
									{#if template.is_default}
										<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">デフォルト</span>
									{/if}
								</div>
								{#if template.description}
									<p class="text-sm text-gray-600 mb-3">{template.description}</p>
								{/if}
								<div class="space-y-1 text-sm">
									<p class="text-gray-700 font-medium">フォーム項目: {template.fields.length}個</p>
									<div class="flex flex-wrap gap-2 mt-2">
										{#each template.fields as field}
											<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center gap-1">
												<span class="font-medium">{field.label}</span>
												{#if field.type === 'select'}
													<span class="text-blue-600">(選択)</span>
												{:else if field.type === 'radio'}
													<span class="text-purple-600">(ラジオ)</span>
												{:else if field.type === 'textarea'}
													<span class="text-gray-500">(複数行)</span>
												{/if}
												{#if field.required}
													<span class="text-red-500">*</span>
												{/if}
											</span>
										{/each}
									</div>
									<p class="text-gray-500 text-xs mt-2">
										作成日: {new Date(template.created_at).toLocaleString('ja-JP')}
									</p>
								</div>
							</div>
							<div class="flex gap-2">
								<button
									on:click={() => openEditModal(template)}
									class="p-2 text-green-600 hover:bg-green-50 rounded transition"
									title="編集"
								>
									<Edit size={18} />
								</button>
								<button
									on:click={() => handleDelete(template.id)}
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
		<div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<h2 class="text-2xl font-bold text-gray-900 mb-6">
					{editingId ? 'テンプレートを編集' : 'テンプレートを作成'}
				</h2>

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<!-- プリセットボタン -->
					{#if !editingId}
						<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<p class="text-sm font-medium text-blue-900 mb-2">プリセットから選択</p>
							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									on:click={() => applyPreset('basic')}
									class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
								>
									基本お問い合わせ
								</button>
								<button
									type="button"
									on:click={() => applyPreset('business')}
									class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
								>
									ビジネス向け
								</button>
								<button
									type="button"
									on:click={() => applyPreset('download')}
									class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
								>
									資料ダウンロード
								</button>
							</div>
						</div>
					{/if}

					<!-- テンプレート名 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							テンプレート名 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.name}
							placeholder="例: 基本お問い合わせ"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
							required
						/>
					</div>

					<!-- 説明 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">説明</label>
						<textarea
							bind:value={formData.description}
							rows="2"
							placeholder="このテンプレートの説明を入力"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
						></textarea>
					</div>

					<!-- フォーム項目 -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<label class="block text-sm font-medium text-gray-700">
								フォーム項目 <span class="text-red-500">*</span>
							</label>
							<button
								type="button"
								on:click={addField}
								class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
							>
								+ 項目を追加
							</button>
						</div>

						<div class="space-y-3">
							{#each formData.fields as field, index}
								<div class="p-3 border border-gray-200 rounded-lg bg-gray-50">
									<div class="grid grid-cols-2 gap-3 mb-2">
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">ラベル</label>
											<input
												type="text"
												bind:value={field.label}
												placeholder="お名前"
												class="w-full px-2 py-1.5 border rounded text-sm"
											/>
										</div>
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">タイプ</label>
											<select
												bind:value={field.type}
												on:change={() => {
													// select/radioタイプに変更した場合、optionsを初期化
													if ((field.type === 'select' || field.type === 'radio') && !field.options) {
														field.options = ['選択肢1', '選択肢2'];
													}
												}}
												class="w-full px-2 py-1.5 border rounded text-sm"
											>
												<option value="text">テキスト</option>
												<option value="email">メール</option>
												<option value="tel">電話</option>
												<option value="textarea">複数行</option>
												<option value="select">プルダウン選択</option>
												<option value="radio">ラジオボタン</option>
											</select>
										</div>
									</div>
									<div class="grid grid-cols-2 gap-3 mb-2">
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">name属性</label>
											<input
												type="text"
												bind:value={field.name}
												placeholder="name"
												class="w-full px-2 py-1.5 border rounded text-sm"
											/>
										</div>
										<div>
											<label class="block text-xs font-medium text-gray-600 mb-1">プレースホルダー</label>
											<input
												type="text"
												bind:value={field.placeholder}
												placeholder="例: 山田 太郎"
												class="w-full px-2 py-1.5 border rounded text-sm"
											/>
										</div>
									</div>

									<!-- 選択肢編集（select/radioの場合のみ表示） -->
									{#if field.type === 'select' || field.type === 'radio'}
										<div class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
											<div class="flex items-center justify-between mb-2">
												<label class="block text-xs font-semibold text-blue-900">選択肢</label>
												<button
													type="button"
													on:click={() => {
														if (!field.options) field.options = [];
														field.options = [...field.options, '新しい選択肢'];
														formData.fields = formData.fields; // リアクティブ更新
													}}
													class="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
												>
													+ 追加
												</button>
											</div>
											<div class="space-y-1.5">
												{#each field.options || [] as option, optionIndex}
													<div class="flex gap-2">
														<input
															type="text"
															bind:value={field.options[optionIndex]}
															placeholder="選択肢{optionIndex + 1}"
															class="flex-1 px-2 py-1 border border-blue-300 rounded text-xs"
														/>
														<button
															type="button"
															on:click={() => {
																field.options = field.options?.filter((_, i) => i !== optionIndex);
																formData.fields = formData.fields; // リアクティブ更新
															}}
															class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
														>
															削除
														</button>
													</div>
												{/each}
											</div>
										</div>
									{/if}
									<div class="flex items-center justify-between">
										<label class="flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												bind:checked={field.required}
												class="w-4 h-4 text-green-600 rounded"
											/>
											<span class="text-sm text-gray-700">必須項目</span>
										</label>
										<button
											type="button"
											on:click={() => removeField(index)}
											class="text-red-600 hover:text-red-800 text-sm font-medium"
										>
											削除
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- デフォルト設定 -->
					<div>
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" bind:checked={formData.is_default} class="w-4 h-4 text-green-600 rounded" />
							<span class="text-sm font-medium text-gray-700">デフォルトテンプレートにする</span>
						</label>
						<p class="text-xs text-gray-500 mt-1">新規フォーム作成時に自動的にこのテンプレートが選択されます</p>
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
							class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
						>
							{editingId ? '更新' : '作成'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
