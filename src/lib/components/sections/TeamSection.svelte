<script lang="ts">
	import type { TeamSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { Twitter, Linkedin, Github } from 'lucide-svelte';

	export let section: TeamSection;

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

		<div class="grid md:grid-cols-{Math.min(content.members.length, 4)} gap-8 mt-8">
			{#each content.members as member}
				<div class="bg-white rounded-lg shadow-md overflow-hidden text-center">
					{#if member.avatar}
						<img
							src={member.avatar}
							alt={member.name}
							class="w-full h-64 object-cover"
						/>
					{:else}
						<div class="w-full h-64 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
							<span class="text-6xl font-bold text-white">
								{member.name.charAt(0)}
							</span>
						</div>
					{/if}

					<div class="p-6">
						<h3 class="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
						<p class="text-pink-600 font-medium mb-3">{member.position}</p>

						{#if member.bio}
							<p class="text-gray-600 text-sm mb-4">{member.bio}</p>
						{/if}

						{#if member.social}
							<div class="flex gap-3 justify-center">
								{#if member.social.twitter}
									<a
										href={member.social.twitter}
										target="_blank"
										rel="noopener noreferrer"
										class="text-gray-400 hover:text-blue-500 transition"
									>
										<Twitter size={20} />
									</a>
								{/if}
								{#if member.social.linkedin}
									<a
										href={member.social.linkedin}
										target="_blank"
										rel="noopener noreferrer"
										class="text-gray-400 hover:text-blue-700 transition"
									>
										<Linkedin size={20} />
									</a>
								{/if}
								{#if member.social.github}
									<a
										href={member.social.github}
										target="_blank"
										rel="noopener noreferrer"
										class="text-gray-400 hover:text-gray-900 transition"
									>
										<Github size={20} />
									</a>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
