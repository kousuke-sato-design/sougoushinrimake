<script lang="ts">
	import type { CTASection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY } from '$lib/constants/design';

	export let section: CTASection;

	$: content = section.content;
	$: backgroundClass = content.backgroundColor
		? ''
		: 'bg-gradient-to-r from-blue-600 to-indigo-600';
</script>

<section class="{SPACING.section} {backgroundClass}" style={content.backgroundColor ? `background-color: ${content.backgroundColor};` : ''}>
	<div class="{SPACING.container}">
		<div class="max-w-3xl mx-auto text-center text-white">
			{#if content.title}
				<h2 class="{TYPOGRAPHY.h2} mb-6">
					{content.title}
				</h2>
			{/if}

			{#if content.description}
				<p class="{TYPOGRAPHY.body} mb-8 opacity-90">
					{content.description}
				</p>
			{/if}

			{#if content.buttonText && content.buttonLink}
				<a
					href={content.buttonLink}
					class="inline-block px-10 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl"
				>
					{content.buttonText}
				</a>
			{/if}
		</div>
	</div>
</section>
