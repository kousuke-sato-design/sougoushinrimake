<script lang="ts">
	import type { ContactSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { page } from '$app/stores';

	export let section: ContactSection;

	$: content = section.content;
	$: siteSlug = $page.params.site_slug;
	$: lpSlug = $page.params.lp_slug;

	// スタイル設定
	$: titleColorStyle = content.titleColor ? `color: ${content.titleColor};` : '';
	$: descriptionColorStyle = content.descriptionColor ? `color: ${content.descriptionColor};` : '';
	$: fontFamilyStyle = content.fontFamily ? `font-family: ${content.fontFamily};` : '';

	function handleSubmit(e: Event) {
		e.preventDefault();
		// フォーム送信処理はここに実装
		alert('フォーム送信機能は後で実装されます');
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
			<form on:submit={handleSubmit} class="space-y-6 bg-white p-8 rounded-lg shadow-lg">
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
					class="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
				>
					{content.submitButtonText}
				</button>
			</form>
		{/if}
	</div>
</section>
