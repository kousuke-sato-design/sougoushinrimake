<script lang="ts">
	import type { TwoColumnFeaturesImageSection } from '$lib/types/sections';
	import * as Icons from 'lucide-svelte';

	export let section: TwoColumnFeaturesImageSection;

	$: ratio = section.content.layout.ratio;
	$: gridClass = ratio === '60-40' ? 'md:grid-cols-[60%_40%]' : ratio === '40-60' ? 'md:grid-cols-[40%_60%]' : 'md:grid-cols-2';

	// アイコンを動的に取得
	function getIcon(iconName: string) {
		return (Icons as any)[iconName] || Icons.Circle;
	}
</script>

<div class="py-16">
	<div class="max-w-4xl mx-auto px-4">
		<div class="grid grid-cols-1 {gridClass} gap-8 items-center">
			<!-- 特徴カラム -->
			<div class="space-y-6">
				{#if section.content.featuresColumn.subtitle}
					<p class="text-pink-600 font-semibold text-sm uppercase tracking-wide">
						{section.content.featuresColumn.subtitle}
					</p>
				{/if}
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">
					{section.content.featuresColumn.title}
				</h2>

				<!-- 特徴リスト -->
				<div class="space-y-4">
					{#each section.content.featuresColumn.features as feature}
						<div class="flex gap-4">
							<div class="flex-shrink-0 w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
								<svelte:component this={getIcon(feature.iconName)} size={24} class="text-pink-600" />
							</div>
							<div>
								<h3 class="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
								<p class="text-gray-600">{feature.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

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
		</div>
	</div>
</div>
