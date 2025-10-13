<script lang="ts">
	import { Upload, X } from 'lucide-svelte';

	export let value: string = '';
	export let landingPageId: string = '';
	export let label: string = '画像をアップロード';
	export let onUpload: (url: string) => void = () => {};

	let uploading = false;
	let error = '';

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploading = true;
		error = '';

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('landingPageId', landingPageId);

			const response = await fetch('/api/upload-image', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				value = result.url;
				onUpload(result.url);
			} else {
				error = result.error || 'アップロードに失敗しました';
			}
		} catch (err: any) {
			console.error('Upload error:', err);
			error = 'アップロードに失敗しました';
		} finally {
			uploading = false;
		}
	}

	function clearImage() {
		value = '';
		onUpload('');
	}
</script>

<div class="space-y-2">
	<label class="block text-sm font-medium text-gray-700">{label}</label>

	{#if value}
		<div class="relative inline-block">
			<img src={value} alt="アップロード済み画像" class="h-24 w-auto rounded border border-gray-300" />
			<button
				on:click={clearImage}
				class="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
			>
				<X size={14} />
			</button>
		</div>
	{:else}
		<label
			class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 {uploading
				? 'opacity-50 cursor-not-allowed'
				: ''}"
		>
			<div class="flex flex-col items-center">
				<Upload size={24} class="text-gray-400 mb-1" />
				<p class="text-sm text-gray-500">
					{uploading ? 'アップロード中...' : 'クリックして画像を選択'}
				</p>
			</div>
			<input
				type="file"
				class="hidden"
				accept="image/*"
				on:change={handleFileSelect}
				disabled={uploading}
			/>
		</label>
	{/if}

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>
