<script lang="ts">
	import type { HeroSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';

	export let section: HeroSection;

	$: content = section.content;

	// 背景色のスタイル
	$: backgroundColorStyle = section.style?.backgroundColor
		? `background-color: ${section.style.backgroundColor};`
		: content.backgroundColor
			? `background-color: ${content.backgroundColor};`
			: '';

	// テキスト色のスタイル
	$: textColorStyle = section.style?.textColor
		? `color: ${section.style.textColor};`
		: '';

	// 背景画像の設定
	$: backgroundImage = section.style?.backgroundImage;

	// 背景画像のURL（安全にstring型に変換）
	$: bgUrl = (() => {
		if (!backgroundImage?.url) return '';
		if (typeof backgroundImage.url === 'string') return backgroundImage.url;
		// urlがオブジェクトの場合の緊急対応
		console.error('Invalid URL type:', typeof backgroundImage.url, backgroundImage.url);
		return '';
	})();

	// 背景画像の詳細位置（positionXとpositionYが指定されている場合はそちらを優先）
	// 拡大されたdiv（200% x 200%）内での位置調整
	$: bgPosition = (() => {
		if (backgroundImage?.positionX && backgroundImage?.positionY) {
			// パーセンテージの場合、拡大されたdiv（-100%オフセット）を考慮して調整
			const xMatch = backgroundImage.positionX.match(/^(-?\d+(?:\.\d+)?)%$/);
			const yMatch = backgroundImage.positionY.match(/^(-?\d+(?:\.\d+)?)%$/);

			if (xMatch && yMatch) {
				// 元の位置: 0% = 左端, 50% = 中央, 100% = 右端
				// 拡大div内: 0% → 33.33%, 50% → 50%, 100% → 66.67%
				// 計算式: (元の位置 + 100) / 3
				const x = parseFloat(xMatch[1]);
				const y = parseFloat(yMatch[1]);
				const adjustedX = (x + 100) / 3;
				const adjustedY = (y + 100) / 3;
				return `${adjustedX}% ${adjustedY}%`;
			}

			return `${backgroundImage.positionX} ${backgroundImage.positionY}`;
		}
		return backgroundImage?.position || 'center';
	})();

	// 回転のスタイル（回転角度を適用、回転時はスケールアップして切れないようにする）
	$: rotationStyle = (() => {
		const rotation = backgroundImage?.rotation || 0;
		// 回転がある場合は画像を拡大して隙間を埋める
		if (rotation !== 0) {
			// 45度回転の場合は√2倍(1.414...)必要、安全のため2倍に
			return `transform: rotate(${rotation}deg) scale(2);`;
		}
		return '';
	})();

	// 背景画像のサイズ（パーセンテージまたはキーワード）
	$: bgSize = (() => {
		const size = backgroundImage?.size || 'cover';
		// パーセンテージの場合は幅のみ指定して、高さはautoで縦横比を維持
		if (size.endsWith('%')) {
			return `${size} auto`;
		}
		return size;
	})();
</script>

<section
	class="{SPACING.section} relative overflow-hidden"
	style="{backgroundColorStyle} {textColorStyle}"
>
	<!-- 背景画像レイヤー（最背面・全幅） -->
	{#if bgUrl}
		<div class="absolute inset-0 z-0 w-full h-full overflow-hidden">
			<div
				class="absolute inset-0"
				style="
					background-image: url({bgUrl});
					background-position: {backgroundImage?.positionX || '50%'} {backgroundImage?.positionY || '50%'};
					background-size: {bgSize};
					background-repeat: {backgroundImage.repeat || 'no-repeat'};
					opacity: {(backgroundImage.opacity || 50) / 100};
					{rotationStyle}
					transform-origin: center center;
				"
			></div>
		</div>
	{/if}

	<!-- コンテンツレイヤー -->
	<div class="max-w-4xl mx-auto px-4 text-center relative z-10">
		{#if content.title}
			<h1 class="{TYPOGRAPHY.h1} mb-6" style={textColorStyle}>
				{content.title}
			</h1>
		{/if}

		{#if content.subtitle}
			<h2 class="{TYPOGRAPHY.h3} mb-4" style={textColorStyle}>
				{content.subtitle}
			</h2>
		{/if}

		{#if content.description}
			<p class="{TYPOGRAPHY.body} mb-8 max-w-2xl mx-auto" style={textColorStyle}>
				{content.description}
			</p>
		{/if}

		{#if content.buttonText && content.buttonLink}
			<a
				href={typeof content.buttonLink === 'string' ? content.buttonLink : '#'}
				class="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
			>
				{content.buttonText}
			</a>
		{/if}
	</div>
</section>
