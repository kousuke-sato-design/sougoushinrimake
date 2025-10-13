<script lang="ts">
	import type { FAQSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { ChevronDown } from 'lucide-svelte';

	export let section: FAQSection;

	$: content = section.content;

	let openItems: Set<number> = new Set();

	function toggleItem(index: number) {
		if (openItems.has(index)) {
			openItems.delete(index);
		} else {
			openItems.add(index);
		}
		openItems = openItems;
	}
</script>

<section class="{SPACING.section} {SPACING.container}">
	<div class="max-w-3xl mx-auto">
		{#if content.title}
			<h2 class="{TYPOGRAPHY.h2} text-{COLORS.text} text-center mb-4">
				{content.title}
			</h2>
		{/if}

		{#if content.subtitle}
			<p class="{TYPOGRAPHY.body} text-{COLORS.textSecondary} text-center mb-12">
				{content.subtitle}
			</p>
		{/if}

		<div class="space-y-4 mt-8">
			{#each content.items as item, index}
				<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
					<button
						on:click={() => toggleItem(index)}
						class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
					>
						<span class="font-semibold text-gray-900 pr-4">{item.question}</span>
						<ChevronDown
							class="text-pink-600 flex-shrink-0 transition-transform {openItems.has(index)
								? 'rotate-180'
								: ''}"
							size={24}
						/>
					</button>

					{#if openItems.has(index)}
						<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
							<p class="text-gray-700">{item.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
