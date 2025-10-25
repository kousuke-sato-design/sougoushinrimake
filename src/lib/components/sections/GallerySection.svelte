<script lang="ts">
	import type { GallerySection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';

	export let section: GallerySection;

	$: content = section.content;
</script>

<section class="{SPACING.section} {SPACING.container}">
	<div class="max-w-7xl mx-auto">
		{#if content.title}
			<h2 class="{TYPOGRAPHY.h2} text-{COLORS.text} text-center mb-4">
				{content.title}
			</h2>
		{/if}

		{#if content.subtitle}
			<p class="{TYPOGRAPHY.body} text-{COLORS.textSecondary} text-center mb-12 max-w-2xl mx-auto">
				{content.subtitle}
			</p>
		{/if}

		<!-- レスポンシブグリッド: モバイル1列、タブレット2列、デスクトップ3列 -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
			{#each content.images as image}
				{#if image.url && typeof image.url === 'string'}
					<div class="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-transparent">
						<img
							src={image.url}
							alt={image.alt || ''}
							class="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300"
							style="background: transparent;"
							loading="lazy"
						/>
						{#if image.caption}
							<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
								<p class="text-white text-sm font-medium">{image.caption}</p>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>

		{#if !content.images || content.images.length === 0}
			<div class="text-center py-12 text-gray-400">
				<p class="text-sm">画像がまだ追加されていません</p>
			</div>
		{/if}
	</div>
</section>
