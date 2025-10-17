<script lang="ts">
	import { Upload, X, Check, Image as ImageIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';

	export let show = false;
	export let onSelect: (url: string) => void = () => {};
	export let landingPageId: string = '';

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
	let selectedUrl: string | null = null;

	// 画像一覧を取得
	async function fetchImages() {
		try {
			const response = await fetch(`/api/images?landingPageId=${landingPageId}`);
			const result = await response.json();

			if (response.ok && result.success) {
				images = result.images;
			}
		} catch (err) {
			console.error('Failed to fetch images:', err);
		}
	}

	// モーダルが開いたときに画像を取得
	$: if (show) {
		fetchImages();
	}

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
				formData.append('landingPageId', landingPageId);

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

	function selectImage(url: string) {
		selectedUrl = url;
	}

	function confirmSelection() {
		if (selectedUrl) {
			onSelect(selectedUrl);
			closeModal();
		}
	}

	function closeModal() {
		show = false;
		selectedUrl = null;
	}
</script>

{#if show}
	<!-- モーダルオーバーレイ -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		on:click={closeModal}
	>
		<!-- モーダルコンテンツ -->
		<div
			class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
			on:click|stopPropagation
		>
			<!-- ヘッダー -->
			<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<ImageIcon size={24} class="text-blue-600" />
					<h2 class="text-xl font-bold text-gray-800">画像を選択</h2>
				</div>
				<button
					on:click={closeModal}
					class="p-2 hover:bg-gray-100 rounded-lg transition"
				>
					<X size={20} class="text-gray-500" />
				</button>
			</div>

			<!-- コンテンツ -->
			<div class="flex-1 overflow-y-auto p-6 space-y-6">
				<!-- アップロードエリア -->
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
						id="modal-file-upload"
						class="hidden"
						accept="image/*"
						multiple
						on:change={handleFileSelect}
						disabled={uploading}
					/>

					<label for="modal-file-upload" class="cursor-pointer">
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
					<div>
						<h3 class="text-sm font-semibold text-gray-700 mb-3">アップロード済みの画像 ({images.length}枚)</h3>
						<div class="grid grid-cols-3 md:grid-cols-4 gap-4">
							{#each images as image}
								<button
									on:click={() => selectImage(image.url)}
									class="group relative bg-white border-2 rounded-lg overflow-hidden hover:shadow-lg transition {selectedUrl === image.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}"
								>
									<img src={image.url} alt={image.name} class="w-full h-32 object-cover" />

									<!-- 選択チェックマーク -->
									{#if selectedUrl === image.url}
										<div class="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full">
											<Check size={16} />
										</div>
									{/if}

									<!-- 画像名 -->
									<div class="p-2 bg-gray-50">
										<p class="text-xs text-gray-600 truncate" title={image.name}>{image.name}</p>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="text-center py-12 text-gray-400">
						<ImageIcon size={48} class="mx-auto mb-2 opacity-30" />
						<p class="text-sm">まだ画像がアップロードされていません</p>
						<p class="text-xs text-gray-500 mt-1">上のエリアから画像をアップロードしてください</p>
					</div>
				{/if}
			</div>

			<!-- フッター -->
			<div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
				<button
					on:click={closeModal}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
				>
					キャンセル
				</button>
				<button
					on:click={confirmSelection}
					disabled={!selectedUrl}
					class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					選択した画像を使用
				</button>
			</div>
		</div>
	</div>
{/if}
