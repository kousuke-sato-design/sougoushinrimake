<script lang="ts">
	import type { TwoColumnTextVideoSection } from '$lib/types/sections';

	export let section: TwoColumnTextVideoSection;

	$: ratio = section.content.layout.ratio;
	$: gridClass = ratio === '60-40' ? 'md:grid-cols-[60%_40%]' : ratio === '40-60' ? 'md:grid-cols-[40%_60%]' : 'md:grid-cols-2';

	// YouTube/Vimeo URLから埋め込み用URLを生成
	function getEmbedUrl(url: string, type: 'youtube' | 'vimeo' | 'direct'): string {
		if (type === 'youtube') {
			const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
			return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
		} else if (type === 'vimeo') {
			const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
			return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
		}
		return url;
	}

	$: embedUrl = getEmbedUrl(section.content.videoColumn.videoUrl, section.content.videoColumn.videoType);
</script>

<div class="py-16">
	<div class="container mx-auto px-4">
		<div class="grid grid-cols-1 {gridClass} gap-8 items-center">
			<!-- テキストカラム -->
			<div class="space-y-4">
				{#if section.content.textColumn.subtitle}
					<p class="text-pink-600 font-semibold text-sm uppercase tracking-wide">
						{section.content.textColumn.subtitle}
					</p>
				{/if}
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900">
					{section.content.textColumn.title}
				</h2>
				<p class="text-lg text-gray-600 leading-relaxed">
					{section.content.textColumn.description}
				</p>
				{#if section.content.textColumn.buttonText}
					<div class="pt-4">
						<a
							href={section.content.textColumn.buttonLink || '#'}
							class="inline-block px-8 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition"
						>
							{section.content.textColumn.buttonText}
						</a>
					</div>
				{/if}
			</div>

			<!-- 動画カラム -->
			<div class="rounded-lg overflow-hidden shadow-xl bg-gray-900 aspect-video">
				{#if section.content.videoColumn.videoType === 'direct'}
					<video controls class="w-full h-full" poster={section.content.videoColumn.thumbnail}>
						<source src={section.content.videoColumn.videoUrl} type="video/mp4" />
						お使いのブラウザは動画タグに対応していません。
					</video>
				{:else}
					<iframe
						src={embedUrl}
						title="動画"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						class="w-full h-full"
					></iframe>
				{/if}
			</div>
		</div>
	</div>
</div>
