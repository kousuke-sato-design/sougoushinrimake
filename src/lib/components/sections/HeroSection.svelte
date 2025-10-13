<script lang="ts">
	import type { HeroSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';

	export let section: HeroSection;

	$: content = section.content;
	$: backgroundStyle = content.backgroundImage
		? `background-image: url(${content.backgroundImage}); background-size: cover; background-position: center;`
		: content.backgroundColor
			? `background-color: ${content.backgroundColor};`
			: '';
</script>

<section
	class="{SPACING.section} {SPACING.container} relative"
	style={backgroundStyle}
>
	<div class="max-w-4xl mx-auto text-center">
		{#if content.title}
			<h1 class="{TYPOGRAPHY.h1} text-{COLORS.text} mb-6">
				{content.title}
			</h1>
		{/if}

		{#if content.subtitle}
			<h2 class="{TYPOGRAPHY.h3} text-{COLORS.textSecondary} mb-4">
				{content.subtitle}
			</h2>
		{/if}

		{#if content.description}
			<p class="{TYPOGRAPHY.body} text-{COLORS.textSecondary} mb-8 max-w-2xl mx-auto">
				{content.description}
			</p>
		{/if}

		{#if content.buttonText && content.buttonLink}
			<a
				href={content.buttonLink}
				class="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
			>
				{content.buttonText}
			</a>
		{/if}
	</div>
</section>
