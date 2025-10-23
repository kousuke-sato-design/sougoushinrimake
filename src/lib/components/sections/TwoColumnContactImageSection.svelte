<script lang="ts">
	import type { TwoColumnContactImageSection } from '$lib/types/sections';
	import { SPACING } from '$lib/constants/design';
	import { page } from '$app/stores';

	export let section: TwoColumnContactImageSection;

	$: content = section.content;
	$: contactColumn = content.contactColumn;
	$: imageColumn = content.imageColumn;
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

	function handleSubmit(e: Event) {
		e.preventDefault();
		// フォーム送信処理はここに実装
		alert('フォーム送信機能は後で実装されます');
	}
</script>

<section class="{SPACING.section}" style={backgroundColorStyle}>
	<div class="{SPACING.container}">
		<div class="grid {gridClass} gap-12 items-center">
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

			<!-- 画像カラム -->
			<div class="relative">
				{#if imageColumn.imageUrl && typeof imageColumn.imageUrl === 'string'}
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
				{/if}
			</div>
		</div>
	</div>
</section>
