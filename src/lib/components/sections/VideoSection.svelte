<script lang="ts">
	import type { VideoSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { Play } from 'lucide-svelte';

	export let section: VideoSection;

	$: content = section.content;

	function getEmbedUrl(url: string, type: string): string {
		if (type === 'youtube') {
			const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
			return `https://www.youtube.com/embed/${videoId}`;
		} else if (type === 'vimeo') {
			const videoId = url.split('/').pop();
			return `https://player.vimeo.com/video/${videoId}`;
		}
		return url;
	}
</script>

<section class="{SPACING.section} {SPACING.container}">
	<div class="max-w-5xl mx-auto">
		{#if content.title}
			<h2 class="{TYPOGRAPHY.h2} text-{COLORS.text} text-center mb-4">
				{content.title}
			</h2>
		{/if}

		{#if content.subtitle}
			<p class="{TYPOGRAPHY.body} text-{COLORS.textSecondary} text-center mb-8">
				{content.subtitle}
			</p>
		{/if}

		<div class="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
			{#if content.videoType === 'direct'}
				<video controls class="w-full h-full" poster={content.thumbnail}>
					<source src={content.videoUrl} type="video/mp4" />
					<track kind="captions" />
					お使いのブラウザは動画タグをサポートしていません。
				</video>
			{:else}
				<iframe
					src={getEmbedUrl(content.videoUrl, content.videoType)}
					title={content.title || 'Video'}
					class="w-full h-full"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
			{/if}
		</div>

		{#if content.description}
			<p class="text-gray-700 text-center mt-6 max-w-2xl mx-auto">
				{content.description}
			</p>
		{/if}
	</div>
</section>
