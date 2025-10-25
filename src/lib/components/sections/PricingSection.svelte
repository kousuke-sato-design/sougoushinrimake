<script lang="ts">
	import type { PricingSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { Check } from 'lucide-svelte';

	export let section: PricingSection;

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

		<div class="grid md:grid-cols-{Math.min(content.plans.length, 3)} gap-8 mt-8">
			{#each content.plans as plan}
				<div
					class="bg-white rounded-lg shadow-lg p-8 border-2 {plan.highlighted
						? 'border-pink-500 ring-4 ring-pink-100 transform scale-105'
						: 'border-gray-200'}"
				>
					{#if plan.highlighted}
						<div class="bg-pink-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
							人気プラン
						</div>
					{/if}

					<h3 class="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>

					<div class="mb-4">
						<span class="text-4xl font-bold text-gray-900">{plan.price}</span>
						{#if plan.period}
							<span class="text-gray-600">/{plan.period}</span>
						{/if}
					</div>

					{#if plan.description}
						<p class="text-gray-600 mb-6">{plan.description}</p>
					{/if}

					<ul class="space-y-3 mb-8">
						{#each plan.features as feature}
							<li class="flex items-start gap-2">
								<Check class="text-green-600 flex-shrink-0 mt-1" size={20} />
								<span class="text-gray-700">{feature}</span>
							</li>
						{/each}
					</ul>

					<a
						href={typeof plan.buttonLink === 'string' ? plan.buttonLink : '#'}
						class="block w-full text-center px-6 py-3 rounded-lg font-semibold transition {plan.highlighted
							? 'bg-pink-600 text-white hover:bg-pink-700'
							: 'bg-gray-100 text-gray-800 hover:bg-gray-200'}"
					>
						{plan.buttonText}
					</a>
				</div>
			{/each}
		</div>
	</div>
</section>
