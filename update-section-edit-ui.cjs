const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 454行目から614行目までのセクション編集エリアを置き換える
const lines = content.split('\n');
const before = lines.slice(0, 454); // 454行目まで保持
const after = lines.slice(614); // 615行目から保持

const newSectionEditUI = `							<!-- セクション編集エリア（展開時のみ） -->
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

									<!-- 基本スタイル設定（色のみ） -->
									<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
										<div class="flex items-center gap-2 mb-2">
											<Palette size={18} class="text-pink-600" />
											<h4 class="font-semibold text-sm">色設定</h4>
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
													sections = sections;
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
													sections = sections;
												}}
												class="h-10 w-full rounded border border-gray-300"
											/>
										</div>
									</div>

									<!-- コンテンツ編集（セクションタイプ別） -->
									<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
										<div class="flex items-center gap-2 mb-2">
											<FileText size={18} class="text-blue-600" />
											<h4 class="font-semibold text-sm">コンテンツ編集</h4>
										</div>

										<!-- Hero Section -->
										{#if section.type === 'hero'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">サブタイトル</label>
													<input
														type="text"
														bind:value={section.content.subtitle}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">説明文</label>
													<textarea
														bind:value={section.content.description}
														rows="3"
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													></textarea>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">ボタンテキスト</label>
													<input
														type="text"
														bind:value={section.content.buttonText}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">ボタンリンク</label>
													<input
														type="text"
														bind:value={section.content.buttonLink}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
											</div>
										{/if}

										<!-- Features Section -->
										{#if section.type === 'features'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">サブタイトル</label>
													<input
														type="text"
														bind:value={section.content.subtitle}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">特徴リスト</label>
													{#each section.content.features as feature, idx}
														<div class="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
															<div class="mb-2">
																<label class="block text-xs font-medium text-gray-600 mb-1">特徴 {idx + 1} - タイトル</label>
																<input
																	type="text"
																	bind:value={feature.title}
																	class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																/>
															</div>
															<div>
																<label class="block text-xs font-medium text-gray-600 mb-1">説明</label>
																<textarea
																	bind:value={feature.description}
																	rows="2"
																	class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																></textarea>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- CTA Section -->
										{#if section.type === 'cta'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">説明文</label>
													<textarea
														bind:value={section.content.description}
														rows="3"
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													></textarea>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">ボタンテキスト</label>
													<input
														type="text"
														bind:value={section.content.buttonText}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">ボタンリンク</label>
													<input
														type="text"
														bind:value={section.content.buttonLink}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
											</div>
										{/if}

										<!-- Contact Section -->
										{#if section.type === 'contact'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">説明文</label>
													<textarea
														bind:value={section.content.description}
														rows="3"
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													></textarea>
												</div>
											</div>
										{/if}

										<!-- その他のセクションタイプ用のプレースホルダー -->
										{#if !['hero', 'features', 'cta', 'contact'].includes(section.type)}
											<p class="text-sm text-gray-500">このセクションタイプのコンテンツ編集は開発中です</p>
										{/if}
									</div>
								</div>
							{/if}`;

const newContent = [...before, newSectionEditUI, ...after].join('\n');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ セクション編集UIを更新しました（色とコンテンツのみ編集可能）');
