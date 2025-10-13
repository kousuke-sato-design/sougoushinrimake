<script lang="ts">
	import type { NewsletterSection } from '$lib/types/sections';
	import { SPACING, TYPOGRAPHY, COLORS } from '$lib/constants/design';
	import { Mail } from 'lucide-svelte';

	export let section: NewsletterSection;

	$: content = section.content;
	$: backgroundStyle = content.backgroundColor
		? `background-color: ${content.backgroundColor};`
		: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';

	let email = '';
	let submitted = false;

	function handleSubmit() {
		if (email) {
			// TODO: メールアドレスの送信処理を実装
			submitted = true;
			setTimeout(() => {
				submitted = false;
				email = '';
			}, 3000);
		}
	}
</script>

<section class="{SPACING.section} {SPACING.container}" style={backgroundStyle}>
	<div class="max-w-3xl mx-auto text-center">
		<div class="flex justify-center mb-6">
			<div class="bg-white/20 p-4 rounded-full">
				<Mail class="text-white" size={48} />
			</div>
		</div>

		{#if content.title}
			<h2 class="{TYPOGRAPHY.h2} text-white mb-4">
				{content.title}
			</h2>
		{/if}

		{#if content.description}
			<p class="{TYPOGRAPHY.body} text-white/90 mb-8">
				{content.description}
			</p>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
			<input
				type="email"
				bind:value={email}
				placeholder={content.placeholder || 'メールアドレスを入力'}
				required
				class="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-white/50 outline-none"
			/>
			<button
				type="submit"
				class="px-8 py-4 bg-white text-purple-700 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg whitespace-nowrap"
			>
				{content.buttonText}
			</button>
		</form>

		{#if submitted}
			<p class="mt-4 text-white font-semibold">
				ありがとうございます！登録が完了しました。
			</p>
		{/if}

		{#if content.privacyText}
			<p class="mt-6 text-white/80 text-sm">
				{content.privacyText}
			</p>
		{/if}
	</div>
</section>
