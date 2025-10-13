const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 578行目の</div>の後に背景画像と2カラム画像の設定を追加
const searchString = `											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/each}`;

const newControls = `											</div>

											<!-- 背景画像 -->
											<div>
												<label class="block text-xs font-medium text-gray-700 mb-1">背景画像</label>
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
										<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200 mt-4">
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
								</div>
							{/if}
						</div>
					{/each}`;

content = content.replace(searchString, newControls);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 背景画像と2カラム画像の設定を追加しました');
