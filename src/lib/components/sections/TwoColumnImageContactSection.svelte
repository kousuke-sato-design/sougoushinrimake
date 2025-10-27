<script lang="ts">
	import type { TwoColumnImageContactSection } from '$lib/types/sections';
	import { SPACING } from '$lib/constants/design';
	import { page } from '$app/stores';

	export let section: TwoColumnImageContactSection;
	export let landingPageId: string = '';

	$: content = section.content;
	$: imageColumn = content.imageColumn;
	$: contactColumn = content.contactColumn;
	$: layout = content.layout;
	$: siteSlug = $page.params.site_slug;
	$: lpSlug = $page.params.lp_slug;

	// 背景色のスタイル
	$: backgroundColorStyle = section.style?.backgroundColor
		? `background-color: ${section.style.backgroundColor};`
		: '';

	// レイアウト比率に応じたグリッドクラス
	$: gridClass = (() => {
		switch (layout.ratio) {
			case '60-40':
				return 'grid-cols-1 lg:grid-cols-[3fr_2fr]';
			case '40-60':
				return 'grid-cols-1 lg:grid-cols-[2fr_3fr]';
			default:
				return 'grid-cols-1 lg:grid-cols-2';
		}
	})();

	let submitting = false;
	let submitSuccess = false;
	let submitError = '';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		submitSuccess = false;
		submitError = '';

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const data: Record<string, any> = {};

		formData.forEach((value, key) => {
			data[key] = value;
		});

		try {
			const response = await fetch('/api/submit-form', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					formData: data,
					sectionId: section.id,
					landingPageId
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				submitSuccess = true;
				form.reset();
				setTimeout(() => {
					submitSuccess = false;
				}, 5000);
			} else {
				submitError = result.error || 'フォーム送信に失敗しました';
			}
		} catch (err: any) {
			console.error('Submit error:', err);
			submitError = 'フォーム送信中にエラーが発生しました';
		} finally {
			submitting = false;
		}
	}
</script>

<section class="{SPACING.section}" style={backgroundColorStyle}>
	<div class="{SPACING.container}">
		<div class="grid {gridClass} gap-12 items-center">
			<!-- 画像カラム（テキスト + 画像） -->
			<div class="space-y-6">
				<!-- テキストコンテンツ -->
				{#if imageColumn.textContent}
					<div class="mb-6">
						{#if imageColumn.textContent.title}
							<h2 class="text-3xl font-bold text-gray-900 mb-4">
								{imageColumn.textContent.title}
							</h2>
						{/if}
						{#if imageColumn.textContent.description}
							<p class="text-lg text-gray-700 leading-relaxed">
								{imageColumn.textContent.description}
							</p>
						{/if}
					</div>
				{/if}

				<!-- 画像 -->
				{#if imageColumn.imageUrl && typeof imageColumn.imageUrl === 'string'}
					<div class="relative">
						<img
							src={imageColumn.imageUrl}
							alt={imageColumn.imageAlt || ''}
							class="w-full h-auto rounded-lg shadow-lg"
							loading="lazy"
						/>
						{#if imageColumn.caption}
							<p class="mt-4 text-center text-sm text-gray-600 italic">
								{imageColumn.caption}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- 問い合わせカラム -->
			<div>
				{#if contactColumn.useDedicatedPage}
					<!-- 専用ページへのリンクボタン表示モード -->
					<div class="text-center bg-white p-8 rounded-lg shadow-lg">
						<a
							href="/WEBTHQ/{siteSlug}/{lpSlug}/contact"
							class="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg w-full"
						>
							{contactColumn.dedicatedPageButtonText || 'お問い合わせはこちら'}
						</a>
					</div>
				{:else}
					<!-- インラインフォーム表示モード -->
					{#if submitSuccess}
						<div class="p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
							<div class="text-green-600 text-4xl mb-3">✓</div>
							<h3 class="text-xl font-bold text-green-800 mb-2">送信完了</h3>
							<p class="text-green-700 text-sm">お問い合わせありがとうございます。<br>担当者より折り返しご連絡いたします。</p>
						</div>
					{:else}
						<form on:submit={handleSubmit} class="space-y-4 bg-white p-6 rounded-lg shadow-lg">
							{#if submitError}
								<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
									<p class="text-xs text-red-600">{submitError}</p>
								</div>
							{/if}

							{#if contactColumn.formFields && contactColumn.formFields.length > 0}
								{#each contactColumn.formFields as field}
									<div>
										<label for={field.name} class="block text-sm font-medium text-gray-700 mb-2">
											{field.label}
											{#if field.required}
												<span class="text-red-500">*</span>
											{/if}
										</label>

										{#if field.type === 'textarea'}
											<textarea
												id={field.name}
												name={field.name}
												rows="4"
												required={field.required}
												placeholder={field.placeholder}
												class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
											></textarea>
										{:else}
											<input
												type={field.type}
												id={field.name}
												name={field.name}
												required={field.required}
												placeholder={field.placeholder}
												class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
											/>
										{/if}
									</div>
								{/each}

								<button
									type="submit"
									disabled={submitting}
									class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{submitting ? '送信中...' : contactColumn.submitButtonText}
								</button>
							{:else}
								<div class="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
									<p class="text-sm text-gray-600">フォーム項目が設定されていません</p>
									<p class="text-xs text-gray-500 mt-1">編集画面でテンプレートを選択してください</p>
								</div>
							{/if}
						</form>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</section>
