<script lang="ts">
	import type { Section } from '$lib/types/sections';
	import HeroSection from './HeroSection.svelte';
	import FeaturesSection from './FeaturesSection.svelte';
	import CTASection from './CTASection.svelte';
	import ContactSection from './ContactSection.svelte';
	import PricingSection from './PricingSection.svelte';
	import TestimonialsSection from './TestimonialsSection.svelte';
	import FAQSection from './FAQSection.svelte';
	import TeamSection from './TeamSection.svelte';
	import StatsSection from './StatsSection.svelte';
	import GallerySection from './GallerySection.svelte';
	import VideoSection from './VideoSection.svelte';
	import NewsletterSection from './NewsletterSection.svelte';
	import TwoColumnTextImageSection from './TwoColumnTextImageSection.svelte';
	import TwoColumnImageTextSection from './TwoColumnImageTextSection.svelte';
	import TwoColumnTextVideoSection from './TwoColumnTextVideoSection.svelte';
	import TwoColumnFeaturesImageSection from './TwoColumnFeaturesImageSection.svelte';
	import TwoColumnTextContactSection from './TwoColumnTextContactSection.svelte';
	import TwoColumnContactImageSection from './TwoColumnContactImageSection.svelte';

	export let section: Section;
	export let landingPageId: string = '';

	// セクションスタイルを構築
	$: sectionStyle = buildSectionStyle(section);
	$: hasBackgroundImage = section.style?.backgroundImage;

	function buildSectionStyle(section: Section): string {
		const styles: string[] = [];

		if (section.style?.backgroundColor) {
			styles.push(`background-color: ${section.style.backgroundColor}`);
		}

		if (section.style?.textColor) {
			styles.push(`color: ${section.style.textColor}`);
		}

		if (section.style?.padding) {
			styles.push(`padding: ${section.style.padding}`);
		}

		return styles.join('; ');
	}

	function buildBackgroundImageStyle(section: Section): string {
		if (!section.style?.backgroundImage) return '';

		// backgroundImageがオブジェクトの場合はurlプロパティを使用
		const bgImage = typeof section.style.backgroundImage === 'string'
			? section.style.backgroundImage
			: section.style.backgroundImage.url;

		// URLが文字列でない場合は空文字を返す
		if (typeof bgImage !== 'string') return '';

		const opacity = section.style.backgroundImageOpacity ?? section.style.backgroundImage.opacity ?? 1;
		return `background-image: url('${bgImage}'); background-size: cover; background-position: center; opacity: ${opacity};`;
	}

	// 画像レイアウトがあるかチェック
	$: hasImageLayout = section.images?.layout && (section.images?.leftImage || section.images?.rightImage);
</script>

<div class="section-wrapper relative" style={sectionStyle}>
	{#if hasBackgroundImage}
		<div class="absolute inset-0 pointer-events-none" style={buildBackgroundImageStyle(section)}></div>
	{/if}

	<div class="relative z-10">
		{#if hasImageLayout}
			<!-- 2カラムレイアウト -->
			<div class="container mx-auto px-4">
				{#if section.images?.layout === 'two-column'}
					<!-- 2つの画像を並べて表示 -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8 py-16">
						{#if section.images.leftImage && typeof section.images.leftImage === 'string'}
							<div class="rounded-lg overflow-hidden shadow-lg">
								<img src={section.images.leftImage} alt="Left" class="w-full h-full object-cover" />
							</div>
						{/if}
						{#if section.images.rightImage && typeof section.images.rightImage === 'string'}
							<div class="rounded-lg overflow-hidden shadow-lg">
								<img src={section.images.rightImage} alt="Right" class="w-full h-full object-cover" />
							</div>
						{/if}
					</div>
				{:else if section.images?.layout === 'image-left'}
					<!-- 画像左、コンテンツ右 -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-16">
						{#if section.images.leftImage && typeof section.images.leftImage === 'string'}
							<div class="rounded-lg overflow-hidden shadow-lg">
								<img src={section.images.leftImage} alt="Section" class="w-full h-auto object-cover" />
							</div>
						{/if}
						<div>
							{#if section.type === 'hero'}
								<HeroSection {section} />
							{:else if section.type === 'features'}
								<FeaturesSection {section} />
							{:else if section.type === 'cta'}
								<CTASection {section} />
							{:else if section.type === 'contact'}
								<ContactSection {section} {landingPageId} />
							{:else if section.type === 'pricing'}
								<PricingSection {section} />
							{:else if section.type === 'testimonials'}
								<TestimonialsSection {section} />
							{:else if section.type === 'faq'}
								<FAQSection {section} />
							{:else if section.type === 'team'}
								<TeamSection {section} />
							{:else if section.type === 'stats'}
								<StatsSection {section} />
							{:else if section.type === 'gallery'}
								<GallerySection {section} />
							{:else if section.type === 'video'}
								<VideoSection {section} />
							{:else if section.type === 'newsletter'}
								<NewsletterSection {section} />
							{:else if section.type === 'custom'}
								<div class="py-16">
									{@html section.content.html}
								</div>
							{/if}
						</div>
					</div>
				{:else if section.images?.layout === 'image-right'}
					<!-- コンテンツ左、画像右 -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-16">
						<div>
							{#if section.type === 'hero'}
								<HeroSection {section} />
							{:else if section.type === 'features'}
								<FeaturesSection {section} />
							{:else if section.type === 'cta'}
								<CTASection {section} />
							{:else if section.type === 'contact'}
								<ContactSection {section} {landingPageId} />
							{:else if section.type === 'pricing'}
								<PricingSection {section} />
							{:else if section.type === 'testimonials'}
								<TestimonialsSection {section} />
							{:else if section.type === 'faq'}
								<FAQSection {section} />
							{:else if section.type === 'team'}
								<TeamSection {section} />
							{:else if section.type === 'stats'}
								<StatsSection {section} />
							{:else if section.type === 'gallery'}
								<GallerySection {section} />
							{:else if section.type === 'video'}
								<VideoSection {section} />
							{:else if section.type === 'newsletter'}
								<NewsletterSection {section} />
							{:else if section.type === 'custom'}
								<div class="py-16">
									{@html section.content.html}
								</div>
							{/if}
						</div>
						{#if section.images.rightImage && typeof section.images.rightImage === 'string'}
							<div class="rounded-lg overflow-hidden shadow-lg">
								<img src={section.images.rightImage} alt="Section" class="w-full h-auto object-cover" />
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<!-- 通常レイアウト（画像なし） -->
			{#if section.type === 'hero'}
				<HeroSection {section} />
			{:else if section.type === 'features'}
				<FeaturesSection {section} />
			{:else if section.type === 'cta'}
				<CTASection {section} />
			{:else if section.type === 'contact'}
				<ContactSection {section} {landingPageId} />
			{:else if section.type === 'pricing'}
				<PricingSection {section} />
			{:else if section.type === 'testimonials'}
				<TestimonialsSection {section} />
			{:else if section.type === 'faq'}
				<FAQSection {section} />
			{:else if section.type === 'team'}
				<TeamSection {section} />
			{:else if section.type === 'stats'}
				<StatsSection {section} />
			{:else if section.type === 'gallery'}
				<GallerySection {section} />
			{:else if section.type === 'video'}
				<VideoSection {section} />
			{:else if section.type === 'newsletter'}
				<NewsletterSection {section} />
			{:else if section.type === 'two_column_text_image'}
				<TwoColumnTextImageSection {section} />
			{:else if section.type === 'two_column_image_text'}
				<TwoColumnImageTextSection {section} />
			{:else if section.type === 'two_column_text_video'}
				<TwoColumnTextVideoSection {section} />
			{:else if section.type === 'two_column_features_image'}
				<TwoColumnFeaturesImageSection {section} />
			{:else if section.type === 'two_column_text_contact'}
				<TwoColumnTextContactSection {section} {landingPageId} />
			{:else if section.type === 'two_column_contact_image'}
				<TwoColumnContactImageSection {section} {landingPageId} />
			{:else if section.type === 'custom'}
				<div class="py-16">
					{@html section.content.html}
				</div>
			{/if}
		{/if}
	</div>
</div>
