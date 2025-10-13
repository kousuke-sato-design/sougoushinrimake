<script lang="ts">
	import type { StatsSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';

	export let section: StatsSection;

	$: content = section.content;
	$: backgroundStyle = content.backgroundColor
		? `background-color: ${content.backgroundColor};`
		: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
</script>

<section class="{SPACING.section} {SPACING.container}" style={backgroundStyle}>
	<div class="max-w-7xl mx-auto">
		{#if content.title}
			<h2 class="{TYPOGRAPHY.h2} text-white text-center mb-4">
				{content.title}
			</h2>
		{/if}

		{#if content.subtitle}
			<p class="{TYPOGRAPHY.body} text-white/90 text-center mb-12 max-w-2xl mx-auto">
				{content.subtitle}
			</p>
		{/if}

		<div class="grid md:grid-cols-{Math.min(content.stats.length, 4)} gap-8 mt-8">
			{#each content.stats as stat}
				<div class="text-center">
					<div class="text-5xl font-bold text-white mb-2">
						{stat.value}
					</div>
					<div class="text-xl font-semibold text-white/90 mb-2">
						{stat.label}
					</div>
					{#if stat.description}
						<p class="text-white/80 text-sm">
							{stat.description}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
