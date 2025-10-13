<script lang="ts">
	import { Bot, Send, User, Loader, Trash2, RotateCcw } from 'lucide-svelte';
	import type { Section } from '$lib/types/sections';
	import { onMount } from 'svelte';

	export let onAddSections: (sections: Section[]) => void;
	export let existingSections: Section[] = [];
	export let disabled = false;
	export let modelName: string = 'gemini-pro';
	export let selectedApiKeyId: string = '';
	export let landingPageId: string = '';
	export let lpType: string = 'product_lp';

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		sections?: Section[];
		timestamp: Date;
	}

	let messages: Message[] = [];
	let inputMessage = '';
	let generating = false;
	let error = '';
	let chatContainer: HTMLDivElement;

	// 初回メッセージ
	onMount(() => {
		messages = [
			{
				role: 'assistant',
				content: 'こんにちは！👋 LPのセクション作成をお手伝いします。\n\n例えば：\n• 「ヒーローセクションを追加して」\n• 「最初のセクションのタイトルをもっとキャッチーにして」\n• 「特徴セクションを追加。タイトルは「選ばれる理由」で」\n\nどんなセクションを作りたいですか？',
				timestamp: new Date()
			}
		];
	});

	// 会話履歴をスクロール
	function scrollToBottom() {
		if (chatContainer) {
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 100);
		}
	}

	async function sendMessage() {
		if (!inputMessage.trim() || generating) return;

		const userMessage = inputMessage.trim();
		inputMessage = '';
		error = '';

		// ユーザーメッセージを追加
		messages = [
			...messages,
			{
				role: 'user',
				content: userMessage,
				timestamp: new Date()
			}
		];
		scrollToBottom();

		generating = true;

		try {
			const requestBody = {
				prompt: userMessage,
				existingSections,
				conversationHistory: messages.slice(-5), // 直近5件の会話履歴
				apiKeyId: selectedApiKeyId || null,
				landingPageId,
				lpType
			};

			console.log('Sending request with:', {
				prompt: userMessage,
				sectionsCount: existingSections.length,
				apiKeyId: selectedApiKeyId
			});

			const response = await fetch('/api/generate-sections', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			console.log('Response status:', response.status);

			const result = await response.json();
			console.log('Response result:', result);

			if (response.ok && result.success) {
				const assistantMessage: Message = {
					role: 'assistant',
					content: result.message || 'セクションを生成しました。',
					sections: result.sections || [],
					timestamp: new Date()
				};

				messages = [...messages, assistantMessage];
				scrollToBottom();

				// セクションがある場合は自動的に追加
				if (assistantMessage.sections && assistantMessage.sections.length > 0) {
					onAddSections(assistantMessage.sections);
				}
			} else {
				// エラーレスポンス
				const errorMsg = result.error || 'セクションの生成に失敗しました';
				const errorDetails = result.details || '';
				const fullError = errorDetails ? `${errorMsg}\n\n詳細: ${errorDetails}` : errorMsg;

				error = fullError;
				messages = [
					...messages,
					{
						role: 'assistant',
						content: `❌ ${fullError}`,
						timestamp: new Date()
					}
				];
				scrollToBottom();
			}
		} catch (e: any) {
			console.error('AIChat error:', e);
			error = `エラーが発生しました: ${e.message}`;
			messages = [
				...messages,
				{
					role: 'assistant',
					content: `❌ ${error}\n\nスタックトレース: ${e.stack || 'なし'}`,
					timestamp: new Date()
				}
			];
			scrollToBottom();
		} finally {
			generating = false;
		}
	}

	function clearConversation() {
		messages = [
			{
				role: 'assistant',
				content: '会話をリセットしました。新しく始めましょう！',
				timestamp: new Date()
			}
		];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- ヘッダー -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-br from-pink-50 to-rose-50">
		<div class="flex items-center gap-2">
			<div class="text-pink-600">
				<Bot size={24} />
			</div>
			<div>
				<h3 class="text-lg font-semibold text-gray-800">AI アシスタント</h3>
				<p class="text-xs text-gray-500">会話しながらセクションを作成</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<div class="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border border-pink-200">
				{modelName}
			</div>
			<button
				on:click={clearConversation}
				class="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:text-pink-600"
				title="会話をリセット"
			>
				<RotateCcw size={18} />
			</button>
		</div>
	</div>

	<!-- 会話履歴 -->
	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-4 space-y-4"
		style="max-height: 400px; min-height: 300px;"
	>
		{#each messages as message}
			<div class="flex gap-3 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				{#if message.role === 'assistant'}
					<div class="flex-shrink-0 w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center">
						<Bot size={18} class="text-white" />
					</div>
				{/if}

				<div
					class="max-w-[80%] {message.role === 'user'
						? 'bg-pink-600 text-white'
						: 'bg-white border border-pink-200'} rounded-lg p-3 shadow-sm"
				>
					<div class="text-sm whitespace-pre-wrap">{message.content}</div>

					{#if message.sections && message.sections.length > 0}
						<div class="mt-3 pt-3 border-t border-pink-100 space-y-2">
							<div class="text-xs font-semibold text-gray-700">
								生成されたセクション ({message.sections.length}個)
							</div>
							{#each message.sections as section}
								<div class="bg-pink-50 p-2 rounded text-xs">
									<div class="flex items-center gap-2">
										{#if section.type === 'hero'}
											<span>🎯 ヒーロー</span>
										{:else if section.type === 'features'}
											<span>✨ 機能・特徴</span>
										{:else if section.type === 'cta'}
											<span>📣 CTA</span>
										{:else if section.type === 'contact'}
											<span>📧 お問い合わせ</span>
										{/if}
										{#if section.content.title}
											<span class="text-gray-700 truncate">{section.content.title}</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class="text-xs text-gray-400 mt-2">
						{message.timestamp.toLocaleTimeString('ja-JP', {
							hour: '2-digit',
							minute: '2-digit'
						})}
					</div>
				</div>

				{#if message.role === 'user'}
					<div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
						<User size={18} class="text-white" />
					</div>
				{/if}
			</div>
		{/each}

		{#if generating}
			<div class="flex gap-3">
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center">
					<Bot size={18} class="text-white" />
				</div>
				<div class="bg-white border border-pink-200 rounded-lg p-3 shadow-sm">
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<Loader size={16} class="animate-spin" />
						<span>考え中...</span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- 入力エリア -->
	<div class="p-4 border-t border-gray-200 bg-white">
		{#if error}
			<div class="mb-3 p-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
				{error}
			</div>
		{/if}

		<div class="flex gap-2">
			<textarea
				bind:value={inputMessage}
				on:keydown={handleKeydown}
				{disabled}
				placeholder="メッセージを入力... (⌘/Ctrl + Enter で送信)"
				rows="2"
				class="flex-1 px-4 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
			></textarea>

			<button
				on:click={sendMessage}
				disabled={generating || disabled || !inputMessage.trim()}
				class="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if generating}
					<Loader size={20} class="animate-spin" />
				{:else}
					<Send size={20} />
				{/if}
			</button>
		</div>

		<p class="text-xs text-gray-500 mt-2 text-center">
			⌘/Ctrl + Enter で送信 • 会話しながらセクションを編集できます
		</p>
	</div>
</div>
