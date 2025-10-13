<script lang="ts">
	import { Upload, X, Copy, Check, Image as ImageIcon } from 'lucide-svelte';

	export let landingPageId: string = '';
	export let siteId: string = '';

	interface UploadedImage {
		url: string;
		path: string;
		name: string;
		uploadedAt: Date;
	}

	let images: UploadedImage[] = [];
	let uploading = false;
	let error = '';
	let dragActive = false;
	let copiedUrl: string | null = null;

	// ドラッグ&ドロップイベント
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			await uploadFiles(files);
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			await uploadFiles(files);
		}
	}

	async function uploadFiles(files: FileList) {
		uploading = true;
		error = '';

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			try {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('landingPageId', landingPageId || siteId);

				const response = await fetch('/api/upload-image', {
					method: 'POST',
					body: formData
				});

				const result = await response.json();

				if (response.ok && result.success) {
					images = [
						{
							url: result.url,
							path: result.path,
							name: file.name,
							uploadedAt: new Date()
						},
						...images
					];
				} else {
					error = result.error || 'アップロードに失敗しました';
				}
			} catch (err: any) {
				console.error('Upload error:', err);
				error = 'アップロードに失敗しました';
			}
		}

		uploading = false;
	}

	async function copyUrl(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedUrl = url;
			setTimeout(() => {
				copiedUrl = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function removeImage(index: number) {
		if (confirm('この画像を削除しますか？')) {
			images = images.filter((_, i) => i !== index);
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-md font-semibold text-gray-800 flex items-center gap-2">
			<ImageIcon size={20} class="text-blue-600" />
			画像ギャラリー
		</h3>
		<span class="text-xs text-gray-500">{images.length}枚</span>
	</div>

	<!-- ドラッグ&ドロップエリア -->
	<div
		on:dragenter={handleDragEnter}
		on:dragleave={handleDragLeave}
		on:dragover={handleDragOver}
		on:drop={handleDrop}
		class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors {dragActive
			? 'border-blue-500 bg-blue-50'
			: 'border-gray-300 hover:border-gray-400'} {uploading ? 'opacity-50 pointer-events-none' : ''}"
	>
		<input
			type="file"
			id="file-upload"
			class="hidden"
			accept="image/*"
			multiple
			on:change={handleFileSelect}
			disabled={uploading}
		/>

		<label for="file-upload" class="cursor-pointer">
			<div class="flex flex-col items-center">
				<Upload size={40} class="text-gray-400 mb-3" />
				<p class="text-sm font-medium text-gray-700">
					{uploading ? 'アップロード中...' : 'ドラッグ&ドロップ または クリックして画像を選択'}
				</p>
				<p class="text-xs text-gray-500 mt-1">JPG, PNG, WEBP, SVG (最大5MB)</p>
			</div>
		</label>
	</div>

	{#if error}
		<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
			<p class="text-sm text-red-600">{error}</p>
		</div>
	{/if}

	<!-- 画像一覧 -->
	{#if images.length > 0}
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
			{#each images as image, i}
				<div class="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
					<img src={image.url} alt={image.name} class="w-full h-32 object-cover" />

					<!-- オーバーレイアクション -->
					<div
						class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
					>
						<button
							on:click={() => copyUrl(image.url)}
							class="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition"
							title="URLをコピー"
						>
							{#if copiedUrl === image.url}
								<Check size={18} class="text-green-600" />
							{:else}
								<Copy size={18} />
							{/if}
						</button>
						<button
							on:click={() => removeImage(i)}
							class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
							title="削除"
						>
							<X size={18} />
						</button>
					</div>

					<!-- 画像名 -->
					<div class="p-2 bg-gray-50">
						<p class="text-xs text-gray-600 truncate" title={image.name}>{image.name}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8 text-gray-400">
			<ImageIcon size={48} class="mx-auto mb-2 opacity-30" />
			<p class="text-sm">まだ画像がアップロードされていません</p>
		</div>
	{/if}
</div>
