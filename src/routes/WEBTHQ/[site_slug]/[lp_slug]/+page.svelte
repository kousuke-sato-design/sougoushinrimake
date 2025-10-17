<script lang="ts">
	/**
	 * LP公開ページ
	 *
	 * 【重要なルール】
	 * このページは編集画面のプレビュータブと完全に同じ内容を表示します。
	 * - ヘッダー・フッターなどの装飾は一切追加しない
	 * - セクションのみをそのまま表示
	 * - SectionRendererを使用してセクションをレンダリング
	 *
	 * これにより、編集画面で確認した内容が公開ページでも全く同じように表示されます。
	 */
	import type { PageData } from './$types';
	import type { Section } from '$lib/types/sections';
	import SectionRenderer from '$lib/components/sections/SectionRenderer.svelte';

	export let data: PageData;

	let sections: Section[] = [];

	// contentをパース
	if (data.landingPage.content && typeof data.landingPage.content === 'object') {
		sections = data.landingPage.content.sections || [];
	}
</script>

<svelte:head>
	<title>{data.landingPage.title} - {data.site.name}</title>
	<meta name="description" content={data.landingPage.description || data.landingPage.title} />
</svelte:head>

<!-- デバッグボタン（一時的・右下に固定） -->
<button
	on:click={() => {
		console.log('=== Published Page Sections Data ===');
		console.log(JSON.stringify(sections, null, 2));
		sections.forEach((section, index) => {
			console.log(`\n=== Section ${index} (${section.type}) ===`);
			console.log('Background Image:', section.style?.backgroundImage);
		});
	}}
	class="fixed bottom-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm shadow-lg"
	style="z-index: 9999;"
>
	🐛 デバッグ
</button>

<div class="bg-white min-h-screen w-full">
	{#if sections.length === 0}
		<div class="flex items-center justify-center h-96 text-gray-400">
			<div class="text-center">
				<p>セクションを追加するとプレビューが表示されます</p>
			</div>
		</div>
	{:else}
		{#each sections as section}
			<SectionRenderer {section} />
		{/each}
	{/if}
</div>
