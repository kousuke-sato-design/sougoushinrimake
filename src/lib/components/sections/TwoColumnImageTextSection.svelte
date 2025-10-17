<script lang="ts">
	import type { TwoColumnImageTextSection } from '$lib/types/sections';

	export let section: TwoColumnImageTextSection;

	$: ratio = section.content.layout.ratio;
	$: gridClass = ratio === '60-40' ? 'md:grid-cols-[60%_40%]' : ratio === '40-60' ? 'md:grid-cols-[40%_60%]' : 'md:grid-cols-2';
</script>

<div class="py-16">
	<div class="max-w-4xl mx-auto px-4">
		<div class="grid grid-cols-1 {gridClass} gap-8 items-center">
			<!-- 画像カラム -->
			<div class="rounded-lg overflow-hidden shadow-xl">
				<img
					src={section.content.imageColumn.imageUrl}
					alt={section.content.imageColumn.imageAlt}
					class="w-full h-auto object-cover"
				/>
				{#if section.content.imageColumn.caption}
					<p class="text-sm text-gray-500 text-center mt-2 px-4">
						{section.content.imageColumn.caption}
					</p>
				{/if}
			</div>

			<!-- テキストカラム -->
			<div class="space-y-4" style="{section.content.textColumn.fontFamily ? `font-family: ${section.content.textColumn.fontFamily};` : ''}">
				{#if section.content.textColumn.title !== undefined}
					<h2
						class="text-3xl md:text-4xl text-gray-900"
						style="
							{section.content.textColumn.titleColor ? `color: ${section.content.textColumn.titleColor};` : ''}
							{section.content.textColumn.titleBold ? 'font-weight: bold;' : ''}
							{section.content.textColumn.titleItalic ? 'font-style: italic;' : ''}
						"
					>
						{section.content.textColumn.title}
					</h2>
				{/if}
				{#if section.content.textColumn.subtitle !== undefined}
					<p
						class="text-pink-600 text-sm uppercase tracking-wide"
						style="
							{section.content.textColumn.subtitleColor ? `color: ${section.content.textColumn.subtitleColor};` : ''}
							{section.content.textColumn.subtitleBold ? 'font-weight: bold;' : ''}
							{section.content.textColumn.subtitleItalic ? 'font-style: italic;' : ''}
						"
					>
						{section.content.textColumn.subtitle}
					</p>
				{/if}
				{#if section.content.textColumn.description !== undefined}
					<p
						class="text-lg text-gray-600 leading-relaxed"
						style="{section.content.textColumn.descriptionColor ? `color: ${section.content.textColumn.descriptionColor};` : ''}"
					>
						{section.content.textColumn.description}
					</p>
				{/if}
				{#if section.content.textColumn.buttonText}
					<div class="pt-4">
						<a
							href={section.content.textColumn.buttonLink || '#'}
							class="inline-block px-8 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition"
						>
							{section.content.textColumn.buttonText}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
