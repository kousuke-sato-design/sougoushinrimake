<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let showApiKey = false;
	let apiKeyInput = '';
	let keyNameInput = '';
	let selectedModel = 'models/gemini-1.5-flash-latest';
	let setAsActive = true;
	let isAdding = false;
	let selectedLog: any = null;
	let showLogModal = false;
	let loadingModels = false;
	let fetchedModels: any[] = [];

	// 利用可能なGeminiモデル（デフォルト）
	$: availableModels = fetchedModels.length > 0 ? fetchedModels : data.availableModels;

	// 最終更新日時のフォーマット
	function formatDate(dateString: string | null) {
		if (!dateString) return '未設定';
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// 短い日時フォーマット
	function formatShortDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			const minutes = Math.floor(diffInHours * 60);
			return `${minutes}分前`;
		} else if (diffInHours < 24) {
			return `${Math.floor(diffInHours)}時間前`;
		} else if (diffInHours < 48) {
			return '昨日';
		} else {
			return date.toLocaleDateString('ja-JP', {
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit'
			});
		}
	}

	// LPタイプのラベル
	function getLpTypeLabel(type: string) {
		const labels: Record<string, string> = {
			top_page: 'トップページ',
			product_lp: '商品LP',
			whitepaper: 'ホワイトペーパー'
		};
		return labels[type] || type;
	}

	// ログの詳細を表示
	function viewLogDetail(log: any) {
		selectedLog = log;
		showLogModal = true;
	}

	// モーダルを閉じる
	function closeModal() {
		showLogModal = false;
		selectedLog = null;
	}

	// 追加フォームを開く
	function openAddForm() {
		isAdding = true;
		apiKeyInput = '';
		keyNameInput = '';
		selectedModel = 'models/gemini-1.5-flash-latest';
		setAsActive = data.apiKeys.length === 0; // 最初のキーは自動的にアクティブ
		showApiKey = false;
	}

	// 追加フォームを閉じる
	function closeAddForm() {
		isAdding = false;
		apiKeyInput = '';
		keyNameInput = '';
		selectedModel = 'models/gemini-1.5-flash-latest';
		showApiKey = false;
	}

	// モデル名を取得
	function getModelLabel(modelValue: string) {
		const model = availableModels.find((m) => m.value === modelValue);
		return model ? model.label : modelValue;
	}

	// APIからモデルを取得
	async function fetchModelsFromApi() {
		if (!apiKeyInput || !apiKeyInput.startsWith('AIza')) {
			alert('先にAPIキーを入力してください');
			return;
		}

		loadingModels = true;
		try {
			// Google APIに直接リクエスト
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKeyInput}`
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('API Error:', errorData);
				alert(
					`モデル取得失敗: ${errorData.error?.message || 'APIエラーが発生しました'}`
				);
				return;
			}

			const result = await response.json();
			console.log('API Response:', result);

			if (result.models) {
				// generateContentをサポートするモデルのみをフィルター
				const generationModels = result.models
					.filter(
						(model: any) =>
							model.supportedGenerationMethods?.includes('generateContent') ||
							model.supportedGenerationMethods?.includes('streamGenerateContent')
					)
					.map((model: any) => ({
						value: model.name, // 完全な名前を保存（models/プレフィックス付き）
						label: model.displayName || model.name,
						description: model.description?.substring(0, 50) || 'Geminiモデル',
						fullData: model // 完全なデータも保存
					}));

				if (generationModels.length > 0) {
					fetchedModels = generationModels;
					alert(`✓ ${generationModels.length}個のモデルを取得しました`);
				} else {
					alert('テキスト生成に対応したモデルが見つかりませんでした');
				}
			} else {
				alert('モデルリストが空です');
			}
		} catch (error) {
			console.error('Fetch Error:', error);
			alert('モデル取得エラー: ' + (error instanceof Error ? error.message : '不明なエラー'));
		} finally {
			loadingModels = false;
		}
	}

	// プロンプトを短縮表示
	function truncateText(text: string, maxLength: number = 100) {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<div class="space-y-6">
	<!-- ページヘッダー -->
	<div>
		<h1 class="text-3xl font-bold text-gray-800">AI API設定</h1>
		<p class="text-gray-600 mt-1">Gemini APIを設定してAI機能を有効化</p>
	</div>

	<!-- メッセージ表示 -->
	{#if form?.message}
		<div
			class="p-4 rounded-lg {form.success
				? 'bg-green-50 text-green-800 border border-green-200'
				: 'bg-red-50 text-red-800 border border-red-200'}"
		>
			<p class="font-semibold">{form.message}</p>
			{#if form.details}
				<p class="text-xs mt-2 font-mono">{form.details}</p>
			{/if}
			{#if form.hint}
				<p class="text-xs mt-1 italic">{form.hint}</p>
			{/if}
		</div>
	{/if}

	<!-- 統計ウィジェット -->
	<div class="grid md:grid-cols-3 gap-6">
		<!-- APIステータス -->
		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
			<div class="flex items-center justify-between mb-4">
				<div>
					<p class="text-blue-100 text-sm">API状態</p>
					<p class="text-3xl font-bold mt-1">
						{#if data.hasActiveKey}
							✓ 有効
						{:else}
							未設定
						{/if}
					</p>
				</div>
				<div class="text-5xl opacity-80">🤖</div>
			</div>
			<p class="text-blue-100 text-xs mt-4">
				保存済みキー: {data.apiKeys.length}個
			</p>
		</div>

		<!-- 総生成数 -->
		<div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
			<div class="flex items-center justify-between mb-4">
				<div>
					<p class="text-green-100 text-sm">総生成数</p>
					<p class="text-3xl font-bold mt-1">{data.stats.totalGenerations}</p>
				</div>
				<div class="text-5xl opacity-80">📊</div>
			</div>
			<p class="text-green-100 text-xs mt-4">累計のAI生成回数</p>
		</div>

		<!-- 今月の生成数 -->
		<div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
			<div class="flex items-center justify-between mb-4">
				<div>
					<p class="text-purple-100 text-sm">今月の生成数</p>
					<p class="text-3xl font-bold mt-1">{data.stats.monthlyGenerations}</p>
				</div>
				<div class="text-5xl opacity-80">⚡</div>
			</div>
			<p class="text-purple-100 text-xs mt-4">
				{new Date().toLocaleDateString('ja-JP', { month: 'long' })}の生成回数
			</p>
		</div>
	</div>

	<!-- APIキー管理セクション -->
	<div class="bg-white rounded-lg shadow">
		<div class="p-6 border-b flex items-center justify-between">
			<div>
				<h3 class="text-xl font-semibold text-gray-800">APIキー管理</h3>
				<p class="text-sm text-gray-600 mt-1">複数のAPIキーを保存して切り替えられます</p>
			</div>
			<button
				on:click={openAddForm}
				class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
			>
				＋ APIキーを追加
			</button>
		</div>

		<!-- 追加フォーム -->
		{#if isAdding}
			<div class="p-6 bg-blue-50 border-b">
				<form
					method="POST"
					action="?/saveApiKey"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							closeAddForm();
						};
					}}
					class="space-y-4"
				>
					<div class="space-y-4">
						<div class="grid md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									キー名 <span class="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="key_name"
									bind:value={keyNameInput}
									placeholder="例: 本番用、開発用"
									required
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Gemini APIキー <span class="text-red-500">*</span>
								</label>
								<div class="relative">
									<input
										type={showApiKey ? 'text' : 'password'}
										name="api_key"
										bind:value={apiKeyInput}
										placeholder="AIza..."
										required
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
									/>
									<button
										type="button"
										on:click={() => (showApiKey = !showApiKey)}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showApiKey ? '👁️' : '👁️‍🗨️'}
									</button>
								</div>
							</div>
						</div>

						<div>
							<div class="flex items-center justify-between mb-2">
								<label class="block text-sm font-medium text-gray-700">
									使用モデル <span class="text-red-500">*</span>
								</label>
								<button
									type="button"
									on:click={fetchModelsFromApi}
									disabled={loadingModels || !apiKeyInput}
									class="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
								>
									{#if loadingModels}
										取得中...
									{:else}
										🔄 APIから取得
									{/if}
								</button>
							</div>
							<select
								name="model"
								bind:value={selectedModel}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							>
								{#each availableModels as model}
									<option value={model.value}>
										{model.label}{#if model.description} - {model.description}{/if}
									</option>
								{/each}
							</select>
							<p class="text-xs text-gray-500 mt-1">
								{#if fetchedModels.length > 0}
									✓ APIから{fetchedModels.length}個のモデルを取得しました
								{:else}
									LP生成時に使用するGeminiモデルを選択してください
								{/if}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							name="set_as_active"
							id="set_as_active"
							bind:checked={setAsActive}
							value="true"
							class="rounded"
						/>
						<label for="set_as_active" class="text-sm text-gray-700">
							このキーをアクティブにする（LP生成で使用）
						</label>
					</div>

					<div class="flex gap-3 justify-end">
						<button
							type="button"
							on:click={closeAddForm}
							class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
						>
							キャンセル
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							保存して接続テスト
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- APIキーリスト -->
		{#if data.apiKeys.length > 0}
			<div class="divide-y">
				{#each data.apiKeys as apiKey}
					<div class="p-6 hover:bg-gray-50 transition">
						<div class="flex items-center gap-4">
							<!-- アクティブ状態 -->
							<div class="flex-shrink-0">
								{#if apiKey.is_active}
									<span
										class="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full font-bold"
									>
										✓
									</span>
								{:else}
									<span
										class="inline-flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-400 rounded-full"
									>
										○
									</span>
								{/if}
							</div>

							<!-- キー情報 -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3 mb-1">
									<h4 class="text-lg font-semibold text-gray-800">{apiKey.key_name}</h4>
									{#if apiKey.is_active}
										<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
											使用中
										</span>
									{/if}
									<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
										{getModelLabel(apiKey.model)}
									</span>
								</div>
								<p class="text-sm text-gray-600 font-mono mb-2">{apiKey.api_key}</p>
								<p class="text-xs text-gray-500">
									作成: {formatDate(apiKey.created_at)}
								</p>
							</div>

							<!-- アクションボタン -->
							<div class="flex gap-2 flex-shrink-0">
								<!-- 接続テスト -->
								<form method="POST" action="?/testConnection" use:enhance class="inline">
									<input type="hidden" name="key_id" value={apiKey.id} />
									<button
										type="submit"
										class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
									>
										接続テスト
									</button>
								</form>

								<!-- アクティブ化 -->
								{#if !apiKey.is_active}
									<form method="POST" action="?/setActive" use:enhance class="inline">
										<input type="hidden" name="key_id" value={apiKey.id} />
										<button
											type="submit"
											class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
										>
											使用する
										</button>
									</form>
								{/if}

								<!-- 削除 -->
								<form method="POST" action="?/deleteApiKey" use:enhance class="inline">
									<input type="hidden" name="key_id" value={apiKey.id} />
									<button
										type="submit"
										class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
										on:click={(e) => {
											if (!confirm(`「${apiKey.key_name}」を削除しますか？`)) {
												e.preventDefault();
											}
										}}
									>
										削除
									</button>
								</form>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-12 text-center">
				<div class="text-6xl mb-4">🔑</div>
				<h3 class="text-xl font-semibold text-gray-800 mb-2">APIキーが登録されていません</h3>
				<p class="text-gray-600 mb-6">最初のAPIキーを追加してAI機能を有効化しましょう</p>
				<button
					on:click={openAddForm}
					class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
				>
					APIキーを追加
				</button>
			</div>
		{/if}
	</div>

	<!-- API取得ガイド -->
	<div class="bg-amber-50 rounded-lg p-6 border border-amber-200">
		<h3 class="text-lg font-semibold text-amber-900 mb-3">📖 Gemini APIキーの取得方法</h3>
		<ol class="space-y-2 text-sm text-amber-800 ml-4 list-decimal">
			<li>
				<a
					href="https://aistudio.google.com/app/apikey"
					target="_blank"
					class="text-blue-600 hover:underline font-medium"
				>
					Google AI Studio
				</a>
				にアクセス
			</li>
			<li>「Get API key」または「Create API key」をクリック</li>
			<li>「Create API key in new project」を選択</li>
			<li>生成されたキー（AIzaで始まる）をコピーして上記フォームに貼り付け</li>
		</ol>
	</div>

	<!-- AI生成履歴 -->
	{#if data.generationLogs.length > 0}
		<div class="bg-white rounded-lg shadow">
			<div class="p-6 border-b">
				<h3 class="text-xl font-semibold text-gray-800">AI生成履歴</h3>
				<p class="text-sm text-gray-600 mt-1">最近のAI生成ログ（最新10件）</p>
			</div>

			<div class="divide-y">
				{#each data.generationLogs as log}
					<div class="p-6 hover:bg-gray-50 transition">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-3 mb-2">
									<span
										class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
									>
										{log.model}
									</span>
									<span class="text-sm text-gray-500">{formatShortDate(log.created_at)}</span>
								</div>

								{#if log.landing_pages}
									<a
										href="/dashboard/landing-pages/{log.landing_pages.id}/edit"
										class="text-lg font-medium text-blue-600 hover:underline mb-1 block"
									>
										{log.landing_pages.title}
									</a>
									<p class="text-sm text-gray-600 mb-3">
										{getLpTypeLabel(log.landing_pages.lp_type)} •
										<span
											class="px-2 py-0.5 rounded text-xs {log.landing_pages.status === 'published'
												? 'bg-green-100 text-green-700'
												: log.landing_pages.status === 'draft'
													? 'bg-gray-100 text-gray-700'
													: 'bg-yellow-100 text-yellow-700'}"
										>
											{log.landing_pages.status === 'published'
												? '公開中'
												: log.landing_pages.status === 'draft'
													? '下書き'
													: 'アーカイブ'}
										</span>
									</p>
								{/if}

								<p class="text-sm text-gray-700 mb-3">
									{truncateText(log.prompt, 150)}
								</p>

								<button
									on:click={() => viewLogDetail(log)}
									class="text-sm text-blue-600 hover:text-blue-800 font-medium"
								>
									詳細を表示 →
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if data.hasActiveKey}
		<div class="bg-white rounded-lg shadow p-12 text-center">
			<div class="text-6xl mb-4">🤖</div>
			<h3 class="text-xl font-semibold text-gray-800 mb-2">まだ生成履歴がありません</h3>
			<p class="text-gray-600 mb-6">LP作成ページでAI自動生成を試してみましょう</p>
			<a
				href="/dashboard/landing-pages/create"
				class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
			>
				LP作成ページへ
			</a>
		</div>
	{/if}

	<!-- 機能説明ウィジェット -->
	<div class="grid md:grid-cols-2 gap-6">
		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-3xl">✨</span>
				<h3 class="text-lg font-semibold text-gray-800">AI自動生成</h3>
			</div>
			<p class="text-sm text-gray-600">
				Gemini
				1.5を使用して、企業情報とキーワードから高品質なランディングページを自動生成します。
			</p>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-3xl">🔄</span>
				<h3 class="text-lg font-semibold text-gray-800">複数キー管理</h3>
			</div>
			<p class="text-sm text-gray-600">
				開発用・本番用など、複数のAPIキーを保存して用途に応じて切り替えられます。
			</p>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-3xl">📝</span>
				<h3 class="text-lg font-semibold text-gray-800">コンテンツ生成</h3>
			</div>
			<p class="text-sm text-gray-600">
				3種類のLP（トップページ、商品LP、ホワイトペーパー）に最適化されたコンテンツを生成します。
			</p>
		</div>

		<div class="bg-white rounded-lg shadow p-6">
			<div class="flex items-center gap-3 mb-4">
				<span class="text-3xl">💾</span>
				<h3 class="text-lg font-semibold text-gray-800">履歴管理</h3>
			</div>
			<p class="text-sm text-gray-600">
				すべてのAI生成履歴をSupabaseに保存。プロンプトと応答を後から確認できます。
			</p>
		</div>
	</div>

	<!-- セキュリティ情報 -->
	<div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-800 mb-3">🔒 セキュリティとプライバシー</h3>
		<ul class="space-y-2 text-sm text-gray-600">
			<li class="flex items-start gap-2">
				<span class="text-green-600 mt-0.5">✓</span>
				<span>APIキーはデータベースに暗号化して保存されます</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-green-600 mt-0.5">✓</span>
				<span>あなたのAPIキーは他のユーザーと共有されません</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-green-600 mt-0.5">✓</span>
				<span>Google AI Studioで使用量と請求を管理できます</span>
			</li>
			<li class="flex items-start gap-2">
				<span class="text-green-600 mt-0.5">✓</span>
				<span>生成されたコンテンツはSupabaseに安全に保存されます</span>
			</li>
		</ul>
	</div>
</div>

<!-- ログ詳細モーダル -->
{#if showLogModal && selectedLog}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="0"
	>
		<div
			class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
			on:click={(e) => e.stopPropagation()}
			on:keydown={(e) => e.stopPropagation()}
			role="button"
			tabindex="0"
		>
			<!-- ヘッダー -->
			<div class="p-6 border-b flex items-center justify-between">
				<div>
					<h3 class="text-xl font-semibold text-gray-800">AI生成ログ詳細</h3>
					<p class="text-sm text-gray-600 mt-1">
						{formatDate(selectedLog.created_at)} • {selectedLog.model}
					</p>
				</div>
				<button
					on:click={closeModal}
					class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
				>
					×
				</button>
			</div>

			<!-- コンテンツ -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- LP情報 -->
				{#if selectedLog.landing_pages}
					<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
						<p class="text-sm font-medium text-blue-900 mb-2">関連LP</p>
						<a
							href="/dashboard/landing-pages/{selectedLog.landing_pages.id}/edit"
							class="text-lg font-semibold text-blue-600 hover:underline"
						>
							{selectedLog.landing_pages.title}
						</a>
						<p class="text-sm text-blue-700 mt-1">
							{getLpTypeLabel(selectedLog.landing_pages.lp_type)}
						</p>
					</div>
				{/if}

				<!-- プロンプト -->
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-2">送信したプロンプト</h4>
					<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
						<pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{selectedLog.prompt}</pre>
					</div>
				</div>

				<!-- 応答 -->
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-2">AI応答</h4>
					<div class="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
						<pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{selectedLog.response}</pre>
					</div>
				</div>
			</div>

			<!-- フッター -->
			<div class="p-6 border-t flex justify-end">
				<button
					on:click={closeModal}
					class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
				>
					閉じる
				</button>
			</div>
		</div>
	</div>
{/if}
