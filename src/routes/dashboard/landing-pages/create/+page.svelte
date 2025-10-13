<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { getTemplatesByType, type LPTemplate } from '$lib/templates/lp-templates';
	import SectionRenderer from '$lib/components/sections/SectionRenderer.svelte';
	import { Eye } from 'lucide-svelte';
	import type { Section } from '$lib/types/sections';

	export let data: PageData;
	export let form: ActionData;

	let creationMode: 'manual' | 'ai' = 'manual';
	let selectedType = 'product_lp';
	let generating = false;
	let selectedSiteId = '';
	let selectedSiteIdAI = '';
	let selectedTemplateId = '';

	$: selectedSite = data.sites?.find((s) => s.id === selectedSiteId);
	$: selectedSiteAI = data.sites?.find((s) => s.id === selectedSiteIdAI);

	// システムテンプレートとユーザーテンプレートを結合
	$: {
		const systemTemplates = getTemplatesByType(selectedType as 'product_lp' | 'benefit_page' | 'whitepaper');
		const userTemplates = (data.userTemplates || [])
			.filter((t: any) => t.lp_type === selectedType)
			.map((t: any) => ({
				id: `user-${t.id}`,
				name: `${t.name} 💾`,
				description: t.description || 'マイテンプレート',
				lpType: t.lp_type,
				sections: t.content?.sections || []
			}));
		availableTemplates = [...systemTemplates, ...userTemplates];

		// テンプレートが利用可能で、かつ選択されていない場合は最初のテンプレートを自動選択
		if (availableTemplates.length > 0 && !selectedTemplateId) {
			selectedTemplateId = availableTemplates[0].id;
		}
	}
	let availableTemplates: any[] = [];

	// 選択されたテンプレートのセクションを取得
	$: previewSections = selectedTemplateId
		? (availableTemplates.find(t => t.id === selectedTemplateId)?.sections || [])
		: [] as Section[];

	const lpTypes = [
		{
			value: 'product_lp',
			label: '商品LP',
			icon: '📦',
			description: '商品・サービスの詳細ページ'
		},
		{
			value: 'benefit_page',
			label: '特典ページ',
			icon: '🎁',
			description: '限定特典・プレゼントページ'
		},
		{
			value: 'whitepaper',
			label: 'ホワイトペーパー',
			icon: '📄',
			description: '資料・ホワイトペーパーダウンロードページ'
		}
	];
</script>

<div class="min-h-screen bg-gray-50">
	<!-- ページヘッダー -->
	<div class="bg-white border-b border-gray-200 px-6 py-4">
		<a href="/dashboard/landing-pages" class="text-blue-600 hover:underline text-sm mb-2 inline-block">
			← LP一覧に戻る
		</a>
		<h1 class="text-3xl font-bold text-gray-800">LP作成</h1>
		<p class="text-gray-600 mt-1">新しいランディングページを作成</p>
	</div>

	<div class="p-6 space-y-6">
		<!-- 作成モード選択 -->
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">作成方法を選択</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- 手動作成 -->
				<button
					on:click={() => (creationMode = 'manual')}
					class="p-6 border-2 rounded-lg transition {creationMode === 'manual'
						? 'border-blue-600 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300'}"
				>
					<div class="text-4xl mb-3">✏️</div>
					<h3 class="text-lg font-semibold text-gray-800 mb-2">手動で作成</h3>
					<p class="text-sm text-gray-600">基本情報を入力して自分で編集</p>
				</button>

				<!-- AI生成 -->
				<button
					on:click={() => (creationMode = 'ai')}
					disabled={!data.hasApiKey}
					class="p-6 border-2 rounded-lg transition {creationMode === 'ai'
						? 'border-blue-600 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<div class="text-4xl mb-3">🤖</div>
					<h3 class="text-lg font-semibold text-gray-800 mb-2">AIで自動生成</h3>
					<p class="text-sm text-gray-600">Gemini AIがLPを自動生成</p>
					{#if !data.hasApiKey}
						<p class="text-xs text-red-600 mt-2">※ APIキーを設定してください</p>
					{/if}
				</button>
			</div>
		</div>

		<!-- エラーメッセージ -->
		{#if form?.message && !form?.success}
			<div class="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
				{form.message}
				{#if form.error}
					<p class="text-sm mt-1 opacity-80">{form.error}</p>
				{/if}
			</div>
		{/if}

		<!-- LPタイプ選択 -->
		<div class="bg-white rounded-lg shadow p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4">LPタイプを選択</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each lpTypes as type}
					<button
						on:click={() => {
							console.log('LPタイプ選択:', type.label, '値:', type.value);
							selectedType = type.value;
							selectedTemplateId = ''; // タイプ変更時にテンプレート選択をリセット（自動的に最初のテンプレートが選ばれる）
						}}
						class="p-6 border-2 rounded-lg transition text-left {selectedType === type.value
							? 'border-blue-600 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<div class="text-4xl mb-3">{type.icon}</div>
						<h3 class="text-lg font-semibold text-gray-800 mb-1">{type.label}</h3>
						<p class="text-sm text-gray-600">{type.description}</p>
						<p class="text-xs text-gray-400 mt-2">値: {type.value}</p>
					</button>
				{/each}
			</div>
		</div>

		<!-- デバッグパネル（開発中のみ） -->
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<h3 class="font-semibold text-yellow-800 mb-2">🔍 デバッグ情報</h3>
			<div class="text-sm space-y-1 text-yellow-900">
				<p><strong>選択中のLPタイプ:</strong> {selectedType}</p>
				<p><strong>選択中のテンプレートID:</strong> {selectedTemplateId || '(未選択)'}</p>
				<p><strong>利用可能なテンプレート数:</strong> {availableTemplates.length}</p>
				<p><strong>作成モード:</strong> {creationMode}</p>
			</div>
		</div>

		<!-- 手動作成フォーム（2カラムレイアウト） -->
		{#if creationMode === 'manual'}
			<div class="flex gap-6" style="height: calc(100vh - 400px);">
				<!-- 左側: フォーム -->
				<div class="w-1/2 overflow-y-auto bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>
					<form
						method="POST"
						action="?/createLP"
						use:enhance={() => {
							console.log('=== フォーム送信デバッグ ===');
							console.log('送信するlp_type:', selectedType);
							console.log('送信するtemplate_id:', selectedTemplateId);
							return async ({ update }) => {
								await update();
							};
						}}
						class="space-y-4"
					>
						<input type="hidden" name="lp_type" value={selectedType} />
						<input type="hidden" name="template_id" value={selectedTemplateId} />

						<!-- テンプレート選択 -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								テンプレート選択 <span class="text-red-500">*</span>
							</label>
							<div class="grid grid-cols-1 gap-3">
								{#each availableTemplates as template}
									<button
										type="button"
										on:click={() => (selectedTemplateId = template.id)}
										class="p-4 border-2 rounded-lg transition text-left {selectedTemplateId === template.id
											? 'border-blue-600 bg-blue-50'
											: 'border-gray-200 hover:border-gray-300'}"
									>
										<h4 class="font-semibold text-gray-800">{template.name}</h4>
										<p class="text-sm text-gray-600 mt-1">{template.description}</p>
										<p class="text-xs text-blue-600 mt-2">
											✓ {template.sections.length}個のセクション
										</p>
									</button>
								{/each}
							</div>
						</div>

						<!-- サイト選択 -->
						{#if data.sites && data.sites.length > 0}
							<div>
								<label for="site_id" class="block text-sm font-medium text-gray-700 mb-1">
									所属サイト <span class="text-red-500">*</span>
								</label>
								<select
									id="site_id"
									name="site_id"
									bind:value={selectedSiteId}
									required
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">サイトを選択してください</option>
									{#each data.sites as site}
										<option value={site.id}>{site.name} (/WEBTHQ/{site.slug})</option>
									{/each}
								</select>
								<p class="text-sm text-gray-500 mt-1">
									このLPが所属するサイトを選択してください
								</p>
							</div>
						{:else}
							<div class="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg">
								<p class="font-semibold mb-1">サイトが作成されていません</p>
								<p class="text-sm">
									LPを作成する前に、まず
									<a href="/dashboard/sites/create" class="underline font-semibold">サイトを作成</a>
									してください。
								</p>
							</div>
						{/if}

						<!-- タイトル -->
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
								タイトル <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={form?.title || ''}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="例: 革新的なマーケティングツール"
							/>
						</div>

						<!-- 説明 -->
						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
								説明
							</label>
							<textarea
								id="description"
								name="description"
								rows="3"
								value={form?.description || ''}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="LPの簡単な説明を入力"
							></textarea>
						</div>

						<!-- スラッグ -->
						<div>
							<label for="slug" class="block text-sm font-medium text-gray-700 mb-1">
								スラッグ（URL） <span class="text-red-500">*</span>
							</label>
							<div class="flex items-center gap-2">
								<span class="text-gray-500">
									{selectedSite ? `/WEBTHQ/${selectedSite.slug}/` : '/WEBTHQ/.../'}
								</span>
								<input
									type="text"
									id="slug"
									name="slug"
									value={form?.slug || ''}
									required
									pattern="[a-z0-9\-]+"
									class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="my-awesome-product"
								/>
							</div>
							<p class="text-sm text-gray-500 mt-1">
								英数字とハイフンのみ使用可能。サイトを先に選択してください。
							</p>
						</div>

						<!-- 送信ボタン -->
						<div class="pt-4">
							<button
								type="submit"
								class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
							>
								LP作成を開始
							</button>
						</div>
					</form>
				</div>

				<!-- 右側: プレビュー -->
				<div class="w-1/2 overflow-y-auto bg-gray-100 rounded-lg">
					<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 z-10">
						<h2 class="font-semibold text-gray-700">テンプレートプレビュー</h2>
					</div>

					<div class="bg-white min-h-full">
						{#if previewSections.length === 0}
							<div class="flex items-center justify-center h-96 text-gray-400">
								<div class="text-center">
									<div class="mb-4 flex justify-center"><Eye size={96} /></div>
									<p class="text-lg font-semibold mb-2">プレビュー</p>
									<p class="text-sm">テンプレートを選択すると<br />プレビューが表示されます</p>
								</div>
							</div>
						{:else}
							{#each previewSections as section}
								<SectionRenderer {section} />
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- AI生成フォーム -->
		{#if creationMode === 'ai' && data.hasApiKey}
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-lg font-semibold text-gray-800 mb-4">AI生成情報</h2>
				<form
					method="POST"
					action="?/generateWithAI"
					use:enhance={() => {
						generating = true;
						return async ({ update }) => {
							await update();
							generating = false;
						};
					}}
					class="space-y-4"
				>
					<input type="hidden" name="lp_type" value={selectedType} />

					<!-- サイト選択 -->
					{#if data.sites && data.sites.length > 0}
						<div>
							<label for="ai_site_id" class="block text-sm font-medium text-gray-700 mb-1">
								所属サイト <span class="text-red-500">*</span>
							</label>
							<select
								id="ai_site_id"
								name="site_id"
								bind:value={selectedSiteIdAI}
								required
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">サイトを選択してください</option>
								{#each data.sites as site}
									<option value={site.id}>{site.name} (/WEBTHQ/{site.slug})</option>
								{/each}
							</select>
							<p class="text-sm text-gray-500 mt-1">
								このLPが所属するサイトを選択してください
							</p>
							{#if selectedSiteAI}
								<p class="text-sm text-blue-600 mt-2">
									📍 LPのURL: /WEBTHQ/{selectedSiteAI.slug}/[生成されたスラッグ]
								</p>
							{/if}
						</div>
					{:else}
						<div class="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg">
							<p class="font-semibold mb-1">サイトが作成されていません</p>
							<p class="text-sm">
								LPを作成する前に、まず
								<a href="/dashboard/sites/create" class="underline font-semibold">サイトを作成</a>
								してください。
							</p>
						</div>
					{/if}

					<!-- タイトル -->
					<div>
						<label for="ai_title" class="block text-sm font-medium text-gray-700 mb-1">
							タイトル <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="ai_title"
							name="title"
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="例: 革新的なマーケティングツール"
						/>
					</div>

					<!-- 説明 -->
					<div>
						<label for="ai_description" class="block text-sm font-medium text-gray-700 mb-1">
							説明 <span class="text-red-500">*</span>
						</label>
						<textarea
							id="ai_description"
							name="description"
							rows="3"
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="商品・サービスの詳細な説明を入力"
						></textarea>
					</div>

					<!-- 企業情報 -->
					<div>
						<label for="company_info" class="block text-sm font-medium text-gray-700 mb-1">
							企業/商品情報
						</label>
						<textarea
							id="company_info"
							name="company_info"
							rows="4"
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="AIがLPを生成する際に参考にする情報を入力してください（業種、ターゲット、特徴など）"
						></textarea>
					</div>

					<!-- 送信ボタン -->
					<div class="pt-4">
						<button
							type="submit"
							disabled={generating}
							class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{#if generating}
								<span class="animate-spin">⚙️</span>
								<span>AI生成中...</span>
							{:else}
								<span>🤖</span>
								<span>AIでLP生成</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>
