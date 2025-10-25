<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { Mail, Phone, Building, User, MessageSquare } from 'lucide-svelte';

	export let data: PageData;
	export let form: ActionData;

	let submitting = false;
</script>

<svelte:head>
	<title>お問い合わせ - {data.landingPage.title} - {data.site.name}</title>
	<meta name="description" content="{data.landingPage.title}に関するお問い合わせフォーム" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- ヘッダー/ナビゲーション -->
	<header class="bg-gray-800 text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex items-center justify-between">
				<a href="/WEBTHQ/{data.site.slug}" class="text-xl font-bold hover:text-gray-300">
					{data.site.name}
				</a>
				<a
					href="/WEBTHQ/{data.site.slug}/{data.landingPage.slug}"
					class="text-sm text-gray-300 hover:text-white"
				>
					← LPに戻る
				</a>
			</div>
		</div>
	</header>

	<!-- メインコンテンツ -->
	<main class="py-12">
		<div class="{data.layoutType === 'single' ? 'max-w-4xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8">
			<!-- ページタイトル（1カラムのみ） -->
			{#if data.layoutType === 'single'}
				<div class="text-center mb-12">
					<h1 class="text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
					<p class="text-lg text-gray-600">
						{data.landingPage.title}に関するご質問・ご相談はこちらからお気軽にお問い合わせください
					</p>
				</div>
			{/if}

			<!-- 2カラムレイアウト -->
			{#if data.layoutType === 'text_contact' || data.layoutType === 'contact_image'}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
					<!-- 左カラム（テキストまたはフォーム） -->
					{#if data.layoutType === 'text_contact'}
						<!-- テキストカラム -->
						<div class="space-y-6" class:lg:order-1={data.columnRatio === '60-40'} class:lg:order-2={data.columnRatio === '40-60'}>
							{#if data.textColumn}
								<div>
									{#if data.textColumn.title}
										<h1 class="text-4xl font-bold mb-4" style="color: {data.textColumn.titleColor || '#111827'}; font-family: {data.textColumn.fontFamily || 'inherit'}">
											{data.textColumn.title}
										</h1>
									{/if}
									{#if data.textColumn.subtitle}
										<p class="text-xl mb-6" style="color: {data.textColumn.subtitleColor || '#6B7280'}; font-family: {data.textColumn.fontFamily || 'inherit'}">
											{data.textColumn.subtitle}
										</p>
									{/if}
									{#if data.textColumn.description}
										<p class="text-lg leading-relaxed" style="color: {data.textColumn.descriptionColor || '#4B5563'}; font-family: {data.textColumn.fontFamily || 'inherit'}">
											{data.textColumn.description}
										</p>
									{/if}
								</div>
							{/if}
						</div>
					{:else if data.layoutType === 'contact_image'}
						<!-- 画像カラム -->
						<div class="space-y-6" class:lg:order-2={true}>
							{#if data.imageColumn?.imageUrl}
								<img
									src={data.imageColumn.imageUrl}
									alt={data.imageColumn.imageAlt || 'お問い合わせ'}
									class="w-full h-auto rounded-lg shadow-lg object-cover"
								/>
							{:else}
								<div class="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
									<p class="text-gray-500">画像未設定</p>
								</div>
							{/if}
						</div>
					{/if}

					<!-- 右カラム（フォーム） -->
					<div class="space-y-6" class:lg:order-2={data.layoutType === 'text_contact' && data.columnRatio === '60-40'} class:lg:order-1={data.layoutType === 'text_contact' && data.columnRatio === '40-60' || data.layoutType === 'contact_image'}>
						<!-- 成功メッセージ -->
						{#if form?.success}
							<div class="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
								<div class="flex items-start">
									<div class="flex-shrink-0">
										<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div class="ml-3">
										<h3 class="text-lg font-semibold text-green-800">送信完了</h3>
										<p class="text-green-700 mt-1">{form.message}</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- エラーメッセージ -->
						{#if form?.message && !form?.success}
							<div class="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
								{form.message}
							</div>
						{/if}

						<!-- お問い合わせフォーム -->
						<div class="bg-white rounded-lg shadow-lg p-8">
							<form
								method="POST"
								action="?/submit"
								use:enhance={() => {
									submitting = true;
									return async ({ update }) => {
										await update();
										submitting = false;
									};
								}}
								class="space-y-6"
							>
								<!-- 動的フォームフィールド -->
								{#each data.formFields as field}
									<div>
										<label for={field.name} class="block text-sm font-semibold text-gray-700 mb-2">
											{field.label}
											{#if field.required}
												<span class="text-red-500">*</span>
											{/if}
										</label>

										{#if field.type === 'textarea'}
											<!-- テキストエリア -->
											<div class="relative">
												<div class="absolute top-3 left-3 pointer-events-none">
													<MessageSquare class="h-5 w-5 text-gray-400" />
												</div>
												<textarea
													id={field.name}
													name={field.name}
													rows="6"
													required={field.required}
													class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													placeholder={field.placeholder || ''}
												></textarea>
											</div>
										{:else if field.type === 'select'}
											<!-- プルダウン選択 -->
											<select
												id={field.name}
												name={field.name}
												required={field.required}
												class="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
											>
												<option value="">{field.placeholder || '選択してください'}</option>
												{#each field.options || [] as option}
													<option value={option}>{option}</option>
												{/each}
											</select>
										{:else if field.type === 'radio'}
											<!-- ラジオボタン -->
											<div class="space-y-2">
												{#each field.options || [] as option, idx}
													<label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
														<input
															type="radio"
															name={field.name}
															value={option}
															required={field.required && idx === 0}
															class="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
														/>
														<span class="text-gray-700">{option}</span>
													</label>
												{/each}
											</div>
										{:else}
											<!-- テキスト、メール、電話 -->
											<div class="relative">
												<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
													{#if field.type === 'email'}
														<Mail class="h-5 w-5 text-gray-400" />
													{:else if field.type === 'tel'}
														<Phone class="h-5 w-5 text-gray-400" />
													{:else if field.name === 'company'}
														<Building class="h-5 w-5 text-gray-400" />
													{:else}
														<User class="h-5 w-5 text-gray-400" />
													{/if}
												</div>
												<input
													type={field.type}
													id={field.name}
													name={field.name}
													required={field.required}
													class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													placeholder={field.placeholder || ''}
												/>
											</div>
										{/if}
									</div>
								{/each}

								<!-- プライバシーポリシー同意 -->
								<div class="bg-gray-50 p-4 rounded-lg">
									<p class="text-sm text-gray-600">
										送信いただいた情報は、お問い合わせへの対応にのみ使用いたします。
									</p>
								</div>

								<!-- 送信ボタン -->
								<div class="pt-4">
									<button
										type="submit"
										disabled={submitting}
										class="w-full px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										{#if submitting}
											<span class="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
											<span>送信中...</span>
										{:else}
											<Mail class="h-5 w-5" />
											<span>送信する</span>
										{/if}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			{:else}
				<!-- 1カラムレイアウト -->
				<!-- 成功メッセージ -->
				{#if form?.success}
					<div class="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
						<div class="flex items-start">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-lg font-semibold text-green-800">送信完了</h3>
								<p class="text-green-700 mt-1">{form.message}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- エラーメッセージ -->
				{#if form?.message && !form?.success}
					<div class="mb-8 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
						{form.message}
					</div>
				{/if}

				<!-- お問い合わせフォーム -->
				<div class="bg-white rounded-lg shadow-lg p-8">
					<form
						method="POST"
						action="?/submit"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
							};
						}}
						class="space-y-6"
					>
						<!-- 動的フォームフィールド -->
						{#each data.formFields as field}
							<div>
								<label for={field.name} class="block text-sm font-semibold text-gray-700 mb-2">
									{field.label}
									{#if field.required}
										<span class="text-red-500">*</span>
									{/if}
								</label>

								{#if field.type === 'textarea'}
									<!-- テキストエリア -->
									<div class="relative">
										<div class="absolute top-3 left-3 pointer-events-none">
											<MessageSquare class="h-5 w-5 text-gray-400" />
										</div>
										<textarea
											id={field.name}
											name={field.name}
											rows="6"
											required={field.required}
											class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											placeholder={field.placeholder || ''}
										></textarea>
									</div>
								{:else if field.type === 'select'}
									<!-- プルダウン選択 -->
									<select
										id={field.name}
										name={field.name}
										required={field.required}
										class="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
									>
										<option value="">{field.placeholder || '選択してください'}</option>
										{#each field.options || [] as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								{:else if field.type === 'radio'}
									<!-- ラジオボタン -->
									<div class="space-y-2">
										{#each field.options || [] as option, idx}
											<label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
												<input
													type="radio"
													name={field.name}
													value={option}
													required={field.required && idx === 0}
													class="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
												/>
												<span class="text-gray-700">{option}</span>
											</label>
										{/each}
									</div>
								{:else}
									<!-- テキスト、メール、電話 -->
									<div class="relative">
										<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											{#if field.type === 'email'}
												<Mail class="h-5 w-5 text-gray-400" />
											{:else if field.type === 'tel'}
												<Phone class="h-5 w-5 text-gray-400" />
											{:else if field.name === 'company'}
												<Building class="h-5 w-5 text-gray-400" />
											{:else}
												<User class="h-5 w-5 text-gray-400" />
											{/if}
										</div>
										<input
											type={field.type}
											id={field.name}
											name={field.name}
											required={field.required}
											class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											placeholder={field.placeholder || ''}
										/>
									</div>
								{/if}
							</div>
						{/each}

						<!-- プライバシーポリシー同意 -->
						<div class="bg-gray-50 p-4 rounded-lg">
							<p class="text-sm text-gray-600">
								送信いただいた情報は、お問い合わせへの対応にのみ使用いたします。
							</p>
						</div>

						<!-- 送信ボタン -->
						<div class="pt-4">
							<button
								type="submit"
								disabled={submitting}
								class="w-full px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{#if submitting}
									<span class="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
									<span>送信中...</span>
								{:else}
									<Mail class="h-5 w-5" />
									<span>送信する</span>
								{/if}
							</button>
						</div>
					</form>
				</div>
			{/if}

			<!-- 戻るリンク -->
			<div class="mt-8 text-center">
				<a
					href="/WEBTHQ/{data.site.slug}/{data.landingPage.slug}"
					class="text-blue-600 hover:text-blue-700 font-semibold"
				>
					← {data.landingPage.title}に戻る
				</a>
			</div>
		</div>
	</main>

	<!-- フッター -->
	<footer class="bg-gray-800 text-white py-8 mt-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<p class="text-gray-400 text-sm">
					© {new Date().getFullYear()}
					{data.site.name}. All rights reserved.
				</p>
				<p class="text-gray-500 text-xs mt-2">
					<a href="/WEBTHQ/{data.site.slug}" class="hover:text-gray-300">
						LP一覧に戻る
					</a>
				</p>
			</div>
		</div>
	</footer>
</div>
