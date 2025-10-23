<script lang="ts">
	import type { TwoColumnTextContactSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY } from '$lib/constants/design';
	import { page } from '$app/stores';

	export let section: TwoColumnTextContactSection;

	$: content = section.content;
	$: textColumn = content.textColumn;
	$: contactColumn = content.contactColumn;
	$: layout = content.layout;
	$: siteSlug = $page.params.site_slug;
	$: lpSlug = $page.params.lp_slug;

	// スタイル設定
	$: titleColorStyle = textColumn.titleColor ? `color: ${textColumn.titleColor};` : '';
	$: subtitleColorStyle = textColumn.subtitleColor ? `color: ${textColumn.subtitleColor};` : '';
	$: descriptionColorStyle = textColumn.descriptionColor ? `color: ${textColumn.descriptionColor};` : '';
	$: fontFamilyStyle = textColumn.fontFamily ? `font-family: ${textColumn.fontFamily};` : '';

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

	function handleSubmit(e: Event) {
		e.preventDefault();
		// フォーム送信処理はここに実装
		alert('フォーム送信機能は後で実装されます');
	}
</script>

<section class="{SPACING.section}" style="{backgroundColorStyle} {fontFamilyStyle}">
	<div class="{SPACING.container}">
		<div class="grid {gridClass} gap-12 items-center">
			<!-- テキストカラム -->
			<div class="space-y-6">
				{#if textColumn.title}
					<h2 class="{TYPOGRAPHY.h2} mb-4" style={titleColorStyle}>
						{textColumn.title}
					</h2>
				{/if}

				{#if textColumn.subtitle}
					<h3 class="{TYPOGRAPHY.h3} mb-4" style={subtitleColorStyle}>
						{textColumn.subtitle}
					</h3>
				{/if}

				{#if textColumn.description}
					<p class="{TYPOGRAPHY.body} text-gray-700" style={descriptionColorStyle}>
						{textColumn.description}
					</p>
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
					<form on:submit={handleSubmit} class="space-y-4 bg-white p-6 rounded-lg shadow-lg">
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
							class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
						>
							{contactColumn.submitButtonText}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</section>
