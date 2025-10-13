<script lang="ts">
	import type { GallerySection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';

	export let section: GallerySection;

	$: content = section.content;
	$: columns = content.columns || 3;
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

		<div class="grid md:grid-cols-{columns} gap-6 mt-8">
			{#each content.images as image}
				<div class="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition">
					<img
						src={image.url}
						alt={image.alt}
						class="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
					/>
					{#if image.caption}
						<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
							<p class="text-white text-sm font-medium">{image.caption}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
