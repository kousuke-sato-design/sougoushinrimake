<script lang="ts">
	import type { ContactSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { page } from '$app/stores';

	export let section: ContactSection;
	export let landingPageId: string = '';

	$: content = section.content;
	$: siteSlug = $page.params.site_slug;
	$: lpSlug = $page.params.lp_slug;

	// スタイル設定
	$: titleColorStyle = content.titleColor ? `color: ${content.titleColor};` : '';
	$: descriptionColorStyle = content.descriptionColor ? `color: ${content.descriptionColor};` : '';
	$: fontFamilyStyle = content.fontFamily ? `font-family: ${content.fontFamily};` : '';

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

<section class="{SPACING.section} {SPACING.container}" style={fontFamilyStyle}>
	<div class="max-w-2xl mx-auto">
		<div class="text-center mb-12">
			{#if content.title}
				<h2 class="{TYPOGRAPHY.h2} text-{COLORS.text} mb-4" style={titleColorStyle}>
					{content.title}
				</h2>
			{/if}

			{#if content.description}
				<p class="{TYPOGRAPHY.body} text-{COLORS.textSecondary}" style={descriptionColorStyle}>
					{content.description}
				</p>
			{/if}
		</div>

		{#if content.useDedicatedPage}
			<!-- 専用ページへのリンクボタン表示モード -->
			<div class="text-center">
				<a
					href="/WEBTHQ/{siteSlug}/{lpSlug}/contact"
					class="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
				>
					{content.dedicatedPageButtonText || 'お問い合わせはこちら'}
				</a>
			</div>
		{:else}
			<!-- インラインフォーム表示モード -->
			{#if submitSuccess}
				<div class="p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
					<div class="text-green-600 text-5xl mb-4">✓</div>
					<h3 class="text-2xl font-bold text-green-800 mb-2">送信完了</h3>
					<p class="text-green-700">お問い合わせありがとうございます。<br>担当者より折り返しご連絡いたします。</p>
				</div>
			{:else}
				<form on:submit={handleSubmit} class="space-y-6 bg-white p-8 rounded-lg shadow-lg">
					{#if submitError}
						<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-sm text-red-600">{submitError}</p>
						</div>
					{/if}

					{#each content.formFields as field}
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
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							></textarea>
						{:else}
							<input
								type={field.type}
								id={field.name}
								name={field.name}
								required={field.required}
								placeholder={field.placeholder}
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						{/if}
					</div>
				{/each}

					<button
						type="submit"
						disabled={submitting}
						class="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{submitting ? '送信中...' : content.submitButtonText}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</section>
