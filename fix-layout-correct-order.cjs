const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 重要なルール: 左側 = セクション一覧（編集UI）、右側 = プレビュー

// 420行目から開始される2カラムレイアウト部分を置き換える
const lines = content.split('\n');
const before = lines.slice(0, 420); // 420行目まで保持（ヘッダーまで）

// 正しい順序で2カラムレイアウトを構築
const correctLayout = `
	<!-- メインコンテンツ: 2カラムレイアウト -->
	<div class="flex h-[calc(100vh-120px)]">
		<!-- 左側: 編集UI（セクション一覧） -->
		<div class="w-1/2 overflow-y-auto bg-white border-r border-gray-200">
			<div class="p-6 space-y-6">
				<!-- セクション一覧 -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-800">セクション一覧</h2>
					</div>

					{#if sections.length === 0}
						<div class="text-center py-12 text-gray-500">
							<div class="mb-2 flex justify-center text-gray-400"><FileText size={64} /></div>
							<p>セクションがありません</p>
							<p class="text-sm">AIアシスタントに「ヒーローセクションを追加して」のように指示してください</p>
						</div>
					{/if}

					{#each sections as section, i}
						<div class="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
							<!-- セクションヘッダー -->
							<button
								on:click={() => toggleSection(i)}
								class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
							>
								<span class="font-semibold text-gray-800">{section.type}セクション</span>
								<ChevronDown
									size={20}
									class="text-gray-400 transition-transform {expandedSections.has(i) ? 'rotate-180' : ''}"
								/>
							</button>

							<!-- セクション編集エリア（展開時のみ） -->
							{#if expandedSections.has(i)}
								<div class="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
									<!-- アクションボタン -->
									<div class="flex items-center justify-between">
										<div class="flex gap-2">
											<button
												on:click={() => moveSection(i, 'up')}
												disabled={i === 0}
												class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-30"
											>
												↑ 上へ
											</button>
											<button
												on:click={() => moveSection(i, 'down')}
												disabled={i === sections.length - 1}
												class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-30"
											>
												↓ 下へ
											</button>
										</div>
										<button
											on:click={() => removeSection(i)}
											class="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
										>
											削除
										</button>
									</div>

									<!-- スタイル設定 -->
									<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
										<div class="flex items-center gap-2 mb-2">
											<Palette size={18} class="text-pink-600" />
											<h4 class="font-semibold text-sm">スタイル設定</h4>
										</div>

										<!-- 背景色 -->
										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">背景色</label>
											<input
												type="color"
												value={section.style?.backgroundColor || '#ffffff'}
												on:input={(e) => {
													if (!section.style) section.style = {};
													section.style.backgroundColor = e.target.value;
												}}
												class="h-10 w-full rounded border border-gray-300"
											/>
										</div>

										<!-- テキスト色 -->
										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">テキスト色</label>
											<input
												type="color"
												value={section.style?.textColor || '#000000'}
												on:input={(e) => {
													if (!section.style) section.style = {};
													section.style.textColor = e.target.value;
												}}
												class="h-10 w-full rounded border border-gray-300"
											/>
										</div>

										<!-- 背景画像 -->
										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">背景画像（透かし）</label>
											<ImageUploader
												bind:value={section.style.backgroundImage}
												landingPageId={lp?.id || ''}
												label="背景画像をアップロード"
												onUpload={(url) => {
													if (!section.style) section.style = {};
													section.style.backgroundImage = url;
												}}
											/>
											{#if section.style?.backgroundImage}
												<div class="mt-2">
													<label class="block text-xs font-medium text-gray-700 mb-1">
														背景画像の透明度: {section.style?.backgroundImageOpacity ?? 1}
													</label>
													<input
														type="range"
														min="0"
														max="1"
														step="0.1"
														value={section.style?.backgroundImageOpacity ?? 1}
														on:input={(e) => {
															if (!section.style) section.style = {};
															section.style.backgroundImageOpacity = parseFloat(e.target.value);
														}}
														class="w-full"
													/>
												</div>
											{/if}
										</div>
									</div>

									<!-- 2カラム画像レイアウト -->
									<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
										<div class="flex items-center gap-2 mb-2">
											<ImageIcon size={18} class="text-blue-600" />
											<h4 class="font-semibold text-sm">2カラム画像レイアウト</h4>
										</div>

										<!-- レイアウトタイプ選択 -->
										<div>
											<label class="block text-xs font-medium text-gray-700 mb-1">レイアウトタイプ</label>
											<select
												bind:value={section.images.layout}
												on:change={() => {
													if (!section.images) section.images = {};
												}}
												class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
											>
												<option value="">なし</option>
												<option value="image-left">画像左 / コンテンツ右</option>
												<option value="image-right">コンテンツ左 / 画像右</option>
												<option value="two-column">2つの画像を並べる</option>
											</select>
										</div>

										{#if section.images?.layout}
											<!-- 左側画像 -->
											{#if section.images.layout === 'image-left' || section.images.layout === 'two-column'}
												<div>
													<ImageUploader
														bind:value={section.images.leftImage}
														landingPageId={lp?.id || ''}
														label="左側の画像"
														onUpload={(url) => {
															if (!section.images) section.images = {};
															section.images.leftImage = url;
														}}
													/>
												</div>
											{/if}

											<!-- 右側画像 -->
											{#if section.images.layout === 'image-right' || section.images.layout === 'two-column'}
												<div>
													<ImageUploader
														bind:value={section.images.rightImage}
														landingPageId={lp?.id || ''}
														label="右側の画像"
														onUpload={(url) => {
															if (!section.images) section.images = {};
															section.images.rightImage = url;
														}}
													/>
												</div>
											{/if}
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}

				</div>

				<!-- セクション追加ボタン -->
				<div class="space-y-4">
					<h3 class="text-md font-semibold text-gray-800">セクションを追加</h3>
					<div class="grid grid-cols-3 gap-3">
						<button
							on:click={() => addSection('hero')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-pink-200 text-pink-700 rounded-lg hover:bg-pink-50 transition"
						>
							<Sparkles size={24} class="mb-1" />
							<span class="text-sm font-semibold">ヒーロー</span>
						</button>
						<button
							on:click={() => addSection('features')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition"
						>
							<Grid3x3 size={24} class="mb-1" />
							<span class="text-sm font-semibold">機能・特徴</span>
						</button>
						<button
							on:click={() => addSection('cta')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition"
						>
							<Megaphone size={24} class="mb-1" />
							<span class="text-sm font-semibold">CTA</span>
						</button>
						<button
							on:click={() => addSection('contact')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition"
						>
							<Mail size={24} class="mb-1" />
							<span class="text-sm font-semibold">お問い合わせ</span>
						</button>
						<button
							on:click={() => addSection('pricing')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-50 transition"
						>
							<DollarSign size={24} class="mb-1" />
							<span class="text-sm font-semibold">料金</span>
						</button>
						<button
							on:click={() => addSection('testimonials')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition"
						>
							<MessageSquare size={24} class="mb-1" />
							<span class="text-sm font-semibold">お客様の声</span>
						</button>
						<button
							on:click={() => addSection('faq')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50 transition"
						>
							<HelpCircle size={24} class="mb-1" />
							<span class="text-sm font-semibold">FAQ</span>
						</button>
						<button
							on:click={() => addSection('team')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition"
						>
							<Users size={24} class="mb-1" />
							<span class="text-sm font-semibold">チーム</span>
						</button>
						<button
							on:click={() => addSection('stats')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-cyan-200 text-cyan-700 rounded-lg hover:bg-cyan-50 transition"
						>
							<BarChart3 size={24} class="mb-1" />
							<span class="text-sm font-semibold">実績</span>
						</button>
						<button
							on:click={() => addSection('gallery')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 transition"
						>
							<ImageIcon size={24} class="mb-1" />
							<span class="text-sm font-semibold">ギャラリー</span>
						</button>
						<button
							on:click={() => addSection('video')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 transition"
						>
							<VideoIcon size={24} class="mb-1" />
							<span class="text-sm font-semibold">動画</span>
						</button>
						<button
							on:click={() => addSection('newsletter')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-lime-200 text-lime-700 rounded-lg hover:bg-lime-50 transition"
						>
							<Newspaper size={24} class="mb-1" />
							<span class="text-sm font-semibold">ニュースレター</span>
						</button>
					</div>
				</div>

				<!-- AI Chat Interface -->
				<div class="space-y-4">
					<div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg overflow-hidden">
						<!-- AIチャットヘッダー -->
						<button
							on:click={() => (aiChatExpanded = !aiChatExpanded)}
							class="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100 transition"
						>
							<div class="flex items-center gap-2">
								<Bot size={24} class="text-purple-600" />
								<span class="font-semibold text-gray-800">AIアシスタント</span>
							</div>
							<ChevronDown
								size={20}
								class="text-gray-400 transition-transform {aiChatExpanded ? 'rotate-180' : ''}"
							/>
						</button>

						<!-- AIチャット本体 -->
						{#if aiChatExpanded}
							<div class="border-t border-purple-200 bg-white p-4">
								<p class="text-sm text-gray-600 mb-4">
									AIに指示を出してページを編集できます。例: 「ヒーローセクションを追加して」
								</p>
								<AIChat landingPageId={lp?.id} bind:sections apiKeyId={selectedApiKeyId} />
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- 右側: プレビュー -->
		<div class="w-1/2 overflow-hidden bg-gray-100 flex flex-col">
			<!-- タブヘッダー -->
			<div class="sticky top-0 bg-white border-b border-gray-200 z-10">
				<div class="flex">
					<button
						on:click={() => (leftPanelTab = 'preview')}
						class="flex-1 px-6 py-3 font-semibold transition {leftPanelTab === 'preview'
							? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex items-center justify-center gap-2">
							<Eye size={20} />
							<span>プレビュー</span>
						</div>
					</button>
					<button
						on:click={() => (leftPanelTab = 'history')}
						class="flex-1 px-6 py-3 font-semibold transition {leftPanelTab === 'history'
							? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex items-center justify-center gap-2">
							<History size={20} />
							<span>履歴</span>
						</div>
					</button>
				</div>
			</div>

			<!-- タブコンテンツ -->
			<div class="flex-1 overflow-y-auto">
				{#if leftPanelTab === 'preview'}
					<!-- プレビュー -->
					<div class="bg-white min-h-full">
						{#if sections.length === 0}
							<div class="flex items-center justify-center h-96 text-gray-400">
								<div class="text-center">
									<div class="mb-4 flex justify-center"><Eye size={96} /></div>
									<p>セクションを追加するとプレビューが表示されます</p>
								</div>
							</div>
						{:else}
							{#each sections as section}
								<SectionRenderer {section} />
							{/each}
						{/if}
					</div>
				{:else}
					<!-- 履歴 -->
					<div class="p-4 h-full">
						<HistoryPanel
							editHistory={data.editHistory}
							conversationHistory={data.conversationHistory}
						/>
					</div>
				{/if}
			</div>

		</div>
	</div>
</div>

{#if form?.message}
	<div
		class="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg {form.success
			? 'bg-green-100 text-green-800 border border-green-200'
			: 'bg-red-100 text-red-800 border border-red-200'}"
	>
		{form.message}
	</div>
{/if}

<!-- テンプレート保存モーダル -->
{#if showTemplateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold text-gray-800 mb-4">テンプレートとして保存</h2>

			<div class="space-y-4">
				<div>
					<label for="templateName" class="block text-sm font-medium text-gray-700 mb-1">
						テンプレート名 <span class="text-red-500">*</span>
					</label>
					<input
						id="templateName"
						type="text"
						bind:value={templateName}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						placeholder="例: 商品LP基本テンプレート"
					/>
				</div>

				<div>
					<label for="templateDescription" class="block text-sm font-medium text-gray-700 mb-1">
						説明
					</label>
					<textarea
						id="templateDescription"
						bind:value={templateDescription}
						rows="3"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						placeholder="このテンプレートの用途や特徴を入力"
					></textarea>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						on:click={() => (showTemplateModal = false)}
						class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
					>
						キャンセル
					</button>
					<button
						on:click={saveAsTemplate}
						disabled={savingTemplate}
						class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
					>
						{savingTemplate ? '保存中...' : '保存'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}`;

const newContent = before.join('\n') + correctLayout;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ レイアウトを修正しました: 左側=セクション一覧、右側=プレビュー');
