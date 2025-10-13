<script lang="ts">
	import type { TwoColumnImageTextSection } from '$lib/types/sections';

	export let section: TwoColumnImageTextSection;

	$: ratio = section.content.layout.ratio;
	$: gridClass = ratio === '60-40' ? 'md:grid-cols-[60%_40%]' : ratio === '40-60' ? 'md:grid-cols-[40%_60%]' : 'md:grid-cols-2';
</script>

<div class="py-16">
	<div class="container mx-auto px-4">
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
			<div class="space-y-4">
				{#if section.content.textColumn.subtitle}
					<p class="text-pink-600 font-semibold text-sm uppercase tracking-wide">
						{section.content.textColumn.subtitle}
					</p>
				{/if}
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">
					{section.content.textColumn.title}
				</h2>
				<p class="text-lg text-gray-600 leading-relaxed">
					{section.content.textColumn.description}
				</p>
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
