const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 699行目以降を完全に置き換える（セクション追加ボタンからAIチャットまで）
const lines = content.split('\n');
const before = lines.slice(0, 699); // 699行目まで保持

const completeUI = `				</div>

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

const newContent = before.join('\n') + '\n' + completeUI;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ 完全なUIを復元しました（AIチャット、全セクション追加ボタンを含む）');
