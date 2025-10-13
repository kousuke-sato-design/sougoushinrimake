<script lang="ts">
	import type { TestimonialsSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { Star, Quote } from 'lucide-svelte';

	export let section: TestimonialsSection;

	$: content = section.content;
</script>

<section class="{SPACING.section} {SPACING.container} bg-gray-50">
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

		<div class="grid md:grid-cols-{Math.min(content.testimonials.length, 3)} gap-8 mt-8">
			{#each content.testimonials as testimonial}
				<div class="bg-white rounded-lg shadow-md p-6 relative">
					<Quote class="text-pink-200 absolute top-4 right-4" size={40} />

					{#if testimonial.rating}
						<div class="flex gap-1 mb-4">
							{#each Array(testimonial.rating) as _}
								<Star class="text-yellow-400 fill-yellow-400" size={18} />
							{/each}
						</div>
					{/if}

					<p class="text-gray-700 mb-6 italic">{testimonial.content}</p>

					<div class="flex items-center gap-4">
						{#if testimonial.avatar}
							<img
								src={testimonial.avatar}
								alt={testimonial.name}
								class="w-12 h-12 rounded-full object-cover"
							/>
						{:else}
							<div class="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
								<span class="text-pink-600 font-semibold text-lg">
									{testimonial.name.charAt(0)}
								</span>
							</div>
						{/if}

						<div>
							<p class="font-semibold text-gray-900">{testimonial.name}</p>
							{#if testimonial.position}
								<p class="text-sm text-gray-600">{testimonial.position}</p>
							{/if}
							{#if testimonial.company}
								<p class="text-sm text-gray-600">{testimonial.company}</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
