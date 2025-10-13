<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	// ブランドカラーを取得
	let brandColors: string[] = [];
	if (data.companyProfile?.brand_colors) {
		try {
			brandColors = JSON.parse(data.companyProfile.brand_colors);
		} catch (e) {
			brandColors = [];
		}
	}

	const primaryColor = brandColors[0] || '#3B82F6';

	// セクションデータの正規化（旧構造と新構造の両方に対応）
	function normalizeSection(section: any) {
		// 旧構造の場合: { id, type, order, content: { title, ... } }
		// 新構造の場合: { type, title, ... }
		if (section.content && typeof section.content === 'object') {
			// 旧構造: content内のデータを展開
			return {
				type: section.type,
				...section.content
			};
		}
		// 新構造: そのまま返す
		return section;
	}
</script>

<svelte:head>
	<title>{data.landingPage.title}</title>
	{#if data.landingPage.description}
		<meta name="description" content={data.landingPage.description} />
	{/if}
	<meta property="og:title" content={data.landingPage.title} />
	{#if data.landingPage.description}
		<meta property="og:description" content={data.landingPage.description} />
	{/if}
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- ヘッダー（企業ロゴ） -->
	{#if data.companyProfile}
		<header class="bg-white shadow-sm">
			<div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					{#if data.companyProfile.logo_url}
						<img
							src={data.companyProfile.logo_url}
							alt={data.companyProfile.company_name}
							class="h-10 object-contain"
						/>
					{/if}
					<h2 class="text-xl font-semibold" style="color: {primaryColor}">
						{data.companyProfile.company_name}
					</h2>
				</div>
			</div>
		</header>
	{/if}

	<!-- コンテンツセクション -->
	<main>
		{#if data.landingPage.content?.sections}
			{#each data.landingPage.content.sections as rawSection}
				{@const section = normalizeSection(rawSection)}
				{#if section.type === 'hero'}
					<!-- ヒーローセクション -->
					<section
						class="py-20 px-8 text-center text-white"
						style="background: linear-gradient(135deg, {primaryColor} 0%, {brandColors[1] ||
							'#6366F1'} 100%)"
					>
						<div class="max-w-4xl mx-auto">
							<h1 class="text-5xl font-bold mb-6">{section.title || ''}</h1>
							{#if section.subtitle}
								<p class="text-xl mb-8 opacity-90">{section.subtitle}</p>
							{/if}
							{#if section.description}
								<p class="text-lg mb-8 opacity-80">{section.description}</p>
							{/if}
							{#if section.buttonText || section.cta}
								<button
									class="bg-white text-lg px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition"
									style="color: {primaryColor}"
								>
									{section.buttonText || section.cta || 'お問い合わせ'}
								</button>
							{/if}
						</div>
					</section>
				{:else if section.type === 'features'}
					<!-- 特徴セクション -->
					<section class="py-16 px-8">
						<div class="max-w-6xl mx-auto">
							{#if section.title}
								<h2 class="text-3xl font-bold text-center mb-12 text-gray-800">
									{section.title}
								</h2>
							{/if}
							{#if section.features || section.items}
								<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
									{#each section.features || section.items || [] as feature}
										<div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
											<h3 class="text-xl font-semibold mb-3" style="color: {primaryColor}">
												{feature.title || ''}
											</h3>
											<p class="text-gray-600">{feature.description || ''}</p>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</section>
				{:else if section.type === 'cta'}
					<!-- CTAセクション -->
					<section class="py-16 px-8" style="background-color: {primaryColor}10">
						<div class="max-w-4xl mx-auto text-center">
							{#if section.title}
								<h2 class="text-3xl font-bold mb-4 text-gray-800">{section.title}</h2>
							{/if}
							{#if section.description}
								<p class="text-lg text-gray-600 mb-8">{section.description}</p>
							{/if}
							{#if section.buttonText || section.button_text}
								<button
									class="text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition"
									style="background-color: {primaryColor}"
								>
									{section.buttonText || section.button_text || 'お問い合わせ'}
								</button>
							{/if}
						</div>
					</section>
				{:else if section.type === 'content'}
					<!-- コンテンツセクション -->
					<section class="py-16 px-8">
						<div class="max-w-4xl mx-auto">
							{#if section.title}
								<h2 class="text-3xl font-bold mb-6 text-gray-800">{section.title}</h2>
							{/if}
							{#if section.text}
								<div class="prose prose-lg max-w-none text-gray-600">
									{@html section.text}
								</div>
							{/if}
						</div>
					</section>
				{:else if section.type === 'contact'}
					<!-- お問い合わせフォームセクション -->
					<section class="py-16 px-8 bg-white">
						<div class="max-w-2xl mx-auto">
							{#if section.title}
								<h2 class="text-3xl font-bold mb-4 text-center text-gray-800">{section.title}</h2>
							{/if}
							{#if section.description}
								<p class="text-center text-gray-600 mb-8">{section.description}</p>
							{/if}
							<form class="space-y-4">
								{#if section.formFields}
									{#each section.formFields as field}
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">
												{field.label}
												{#if field.required}<span class="text-red-500">*</span>{/if}
											</label>
											{#if field.type === 'textarea'}
												<textarea
													name={field.name}
													required={field.required}
													rows="4"
													class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
													style="focus:ring-color: {primaryColor}"
												></textarea>
											{:else}
												<input
													type={field.type}
													name={field.name}
													required={field.required}
													class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
													style="focus:ring-color: {primaryColor}"
												/>
											{/if}
										</div>
									{/each}
								{/if}
								<button
									type="submit"
									class="w-full text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition"
									style="background-color: {primaryColor}"
								>
									送信する
								</button>
							</form>
						</div>
					</section>
				{/if}
			{/each}
		{:else}
			<!-- コンテンツが空の場合 -->
			<div class="py-20 text-center text-gray-500">
				<p>コンテンツが設定されていません</p>
			</div>
		{/if}
	</main>

	<!-- フッター -->
	<footer class="bg-gray-800 text-white py-8">
		<div class="max-w-7xl mx-auto px-4 text-center">
			{#if data.companyProfile}
				<p class="text-sm opacity-80">
					© {new Date().getFullYear()}
					{data.companyProfile.company_name}. All rights reserved.
				</p>
				{#if data.companyProfile.website}
					<a
						href={data.companyProfile.website}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm opacity-80 hover:opacity-100 transition mt-2 inline-block"
					>
						{data.companyProfile.website}
					</a>
				{/if}
			{/if}
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
