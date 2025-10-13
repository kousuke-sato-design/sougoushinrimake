<script lang="ts">
	import type { FeaturesSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import {
		Sparkles,
		Zap,
		Star,
		Check,
		Shield,
		Rocket,
		Target,
		TrendingUp,
		Users,
		Circle
	} from 'lucide-svelte';

	export let section: FeaturesSection;

	$: content = section.content;

	// アイコンマップ
	const iconMap: Record<string, any> = {
		Sparkles,
		Zap,
		Star,
		Check,
		Shield,
		Rocket,
		Target,
		TrendingUp,
		Users,
		Circle
	};

	// アイコンコンポーネントを取得
	function getIcon(iconName: string) {
		return iconMap[iconName] || Circle;
	}
</script>

<section class="{SPACING.section} {SPACING.container} bg-gray-50">
	<div class="text-center mb-16">
		{#if content.title}
			<h2 class="{TYPOGRAPHY.h2} text-{COLORS.text} mb-4">
				{content.title}
			</h2>
		{/if}

		{#if content.subtitle}
			<p class="{TYPOGRAPHY.body} text-{COLORS.textSecondary}">
				{content.subtitle}
			</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
		{#each content.features as feature}
			<div class="bg-white rounded-lg p-8 shadow hover:shadow-lg transition">
				<div class="mb-4 text-blue-600">
					<svelte:component this={getIcon(feature.iconName)} size={48} />
				</div>
				<h3 class="{TYPOGRAPHY.h4} text-{COLORS.text} mb-3">
					{feature.title}
				</h3>
				<p class="text-{COLORS.textSecondary}">
					{feature.description}
				</p>
			</div>
		{/each}
	</div>
</section>
