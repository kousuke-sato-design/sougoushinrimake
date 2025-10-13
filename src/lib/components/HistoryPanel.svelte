<script lang="ts">
	import { Clock, MessageSquare, FileEdit, ChevronDown, ChevronUp } from 'lucide-svelte';
	import DiffViewer from './DiffViewer.svelte';

	interface EditHistory {
		id: string;
		action_type: string;
		section_type?: string;
		content_before?: any;
		content_after?: any;
		change_summary?: string;
		created_at: string;
	}

	interface ConversationHistory {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		sections_generated?: any[];
		model?: string;
		created_at: string;
	}

	export let editHistory: EditHistory[] = [];
	export let conversationHistory: ConversationHistory[] = [];

	let activeTab: 'edits' | 'conversations' = 'edits';
	let expandedItems = new Set<string>();

	function toggleExpand(id: string) {
		if (expandedItems.has(id)) {
			expandedItems.delete(id);
		} else {
			expandedItems.add(id);
		}
		expandedItems = expandedItems; // trigger reactivity
	}

	function getActionLabel(actionType: string): string {
		const labels: Record<string, string> = {
			create: '作成',
			update: '更新',
			delete: '削除',
			add_section: 'セクション追加',
			update_section: 'セクション更新',
			delete_section: 'セクション削除',
			reorder: '順序変更'
		};
		return labels[actionType] || actionType;
	}

	function getActionColor(actionType: string): string {
		if (actionType.includes('add') || actionType === 'create') return 'text-green-600 bg-green-50';
		if (actionType.includes('delete')) return 'text-red-600 bg-red-50';
		if (actionType.includes('update')) return 'text-pink-600 bg-pink-50';
		return 'text-gray-600 bg-gray-50';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return '今';
		if (minutes < 60) return `${minutes}分前`;
		if (hours < 24) return `${hours}時間前`;
		if (days < 7) return `${days}日前`;

		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="history-panel bg-white rounded-lg border border-gray-200 shadow-sm">
	<!-- タブヘッダー -->
	<div class="border-b border-gray-200">
		<div class="flex">
			<button
				on:click={() => (activeTab = 'edits')}
				class="flex-1 px-4 py-3 text-sm font-semibold transition {activeTab === 'edits'
					? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
			>
				<div class="flex items-center justify-center gap-2">
					<FileEdit size={18} />
					<span>編集履歴 ({editHistory.length})</span>
				</div>
			</button>
			<button
				on:click={() => (activeTab = 'conversations')}
				class="flex-1 px-4 py-3 text-sm font-semibold transition {activeTab === 'conversations'
					? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
					: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
			>
				<div class="flex items-center justify-center gap-2">
					<MessageSquare size={18} />
					<span>AI会話履歴 ({conversationHistory.length})</span>
				</div>
			</button>
		</div>
	</div>

	<!-- タブコンテンツ -->
	<div class="p-4 max-h-[600px] overflow-y-auto">
		{#if activeTab === 'edits'}
			<!-- 編集履歴 -->
			{#if editHistory.length === 0}
				<div class="text-center py-12 text-gray-500">
					<FileEdit size={48} class="mx-auto mb-4 text-gray-300" />
					<p class="text-sm">まだ編集履歴がありません</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each editHistory as item}
						<div class="border border-gray-200 rounded-lg overflow-hidden">
							<button
								on:click={() => toggleExpand(item.id)}
								class="w-full px-4 py-3 flex items-start justify-between hover:bg-gray-50 transition"
							>
								<div class="flex items-start gap-3 flex-1 text-left">
									<div
										class="px-2 py-1 rounded text-xs font-semibold {getActionColor(
											item.action_type
										)}"
									>
										{getActionLabel(item.action_type)}
									</div>
									<div class="flex-1 min-w-0">
										{#if item.section_type}
											<p class="text-sm font-medium text-gray-900">
												{item.section_type} セクション
											</p>
										{/if}
										{#if item.change_summary}
											<p class="text-xs text-gray-600 mt-1">{item.change_summary}</p>
										{/if}
										<p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
											<Clock size={12} />
											{formatDate(item.created_at)}
										</p>
									</div>
								</div>
								{#if expandedItems.has(item.id)}
									<ChevronUp size={20} class="text-gray-400 flex-shrink-0" />
								{:else}
									<ChevronDown size={20} class="text-gray-400 flex-shrink-0" />
								{/if}
							</button>

							{#if expandedItems.has(item.id)}
								<div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
									<DiffViewer
										before={item.content_before}
										after={item.content_after}
										label="変更内容の詳細"
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<!-- AI会話履歴 -->
			{#if conversationHistory.length === 0}
				<div class="text-center py-12 text-gray-500">
					<MessageSquare size={48} class="mx-auto mb-4 text-gray-300" />
					<p class="text-sm">まだ会話履歴がありません</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each conversationHistory as item}
						<div
							class="border rounded-lg p-4 {item.role === 'user'
								? 'bg-pink-50 border-pink-200'
								: 'bg-gray-50 border-gray-200'}"
						>
							<div class="flex items-start justify-between mb-2">
								<span
									class="text-xs font-semibold px-2 py-1 rounded {item.role === 'user'
										? 'bg-pink-600 text-white'
										: 'bg-gray-600 text-white'}"
								>
									{item.role === 'user' ? 'ユーザー' : 'AI'}
								</span>
								<span class="text-xs text-gray-500 flex items-center gap-1">
									<Clock size={12} />
									{formatDate(item.created_at)}
								</span>
							</div>
							<p class="text-sm text-gray-800 whitespace-pre-wrap mb-2">{item.content}</p>
							{#if item.sections_generated && item.sections_generated.length > 0}
								<div class="mt-3 pt-3 border-t border-gray-200">
									<p class="text-xs font-semibold text-gray-700 mb-2">
										生成されたセクション ({item.sections_generated.length}個)
									</p>
									<div class="space-y-1">
										{#each item.sections_generated as section}
											<div class="text-xs bg-white p-2 rounded border border-gray-200">
												<span class="font-semibold">{section.type}:</span>
												{section.content?.title || '(タイトルなし)'}
											</div>
										{/each}
									</div>
								</div>
							{/if}
							{#if item.model}
								<p class="text-xs text-gray-500 mt-2">Model: {item.model}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.history-panel {
		height: 100%;
	}
</style>
