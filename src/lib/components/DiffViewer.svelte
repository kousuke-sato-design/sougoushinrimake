<script lang="ts">
	import { Plus, Minus, Edit } from 'lucide-svelte';

	export let before: any;
	export let after: any;
	export let label: string = '変更内容';

	interface Change {
		type: 'added' | 'removed' | 'modified';
		key: string;
		oldValue?: any;
		newValue?: any;
	}

	// 差分を計算
	function calculateDiff(before: any, after: any): Change[] {
		const changes: Change[] = [];

		if (!before && after) {
			return [{ type: 'added', key: 'content', newValue: after }];
		}

		if (before && !after) {
			return [{ type: 'removed', key: 'content', oldValue: before }];
		}

		if (typeof before !== 'object' || typeof after !== 'object') {
			if (before !== after) {
				return [{ type: 'modified', key: 'value', oldValue: before, newValue: after }];
			}
			return [];
		}

		// すべてのキーを取得
		const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

		allKeys.forEach((key) => {
			const oldVal = before?.[key];
			const newVal = after?.[key];

			if (oldVal === undefined && newVal !== undefined) {
				changes.push({ type: 'added', key, newValue: newVal });
			} else if (oldVal !== undefined && newVal === undefined) {
				changes.push({ type: 'removed', key, oldValue: oldVal });
			} else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
				changes.push({ type: 'modified', key, oldValue: oldVal, newValue: newVal });
			}
		});

		return changes;
	}

	$: changes = calculateDiff(before, after);

	function formatValue(value: any): string {
		if (value === null || value === undefined) return '(empty)';
		if (typeof value === 'string') return value;
		if (Array.isArray(value)) return `[${value.length} items]`;
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}
</script>

<div class="diff-viewer">
	<h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
		<Edit size={16} />
		{label}
	</h4>

	{#if changes.length === 0}
		<p class="text-sm text-gray-500 italic">変更なし</p>
	{:else}
		<div class="space-y-2">
			{#each changes as change}
				<div class="border rounded-lg overflow-hidden">
					{#if change.type === 'added'}
						<div class="bg-green-50 border-l-4 border-green-500 p-3">
							<div class="flex items-start gap-2">
								<Plus size={16} class="text-green-600 mt-1 flex-shrink-0" />
								<div class="flex-1 min-w-0">
									<p class="text-xs font-semibold text-green-800 mb-1">{change.key}</p>
									<pre
										class="text-xs text-green-700 whitespace-pre-wrap break-words">{formatValue(change.newValue)}</pre>
								</div>
							</div>
						</div>
					{:else if change.type === 'removed'}
						<div class="bg-red-50 border-l-4 border-red-500 p-3">
							<div class="flex items-start gap-2">
								<Minus size={16} class="text-red-600 mt-1 flex-shrink-0" />
								<div class="flex-1 min-w-0">
									<p class="text-xs font-semibold text-red-800 mb-1">{change.key}</p>
									<pre
										class="text-xs text-red-700 whitespace-pre-wrap break-words">{formatValue(change.oldValue)}</pre>
								</div>
							</div>
						</div>
					{:else if change.type === 'modified'}
						<div class="bg-yellow-50 border-l-4 border-yellow-500 p-3">
							<div class="flex items-start gap-2">
								<Edit size={16} class="text-yellow-600 mt-1 flex-shrink-0" />
								<div class="flex-1 min-w-0">
									<p class="text-xs font-semibold text-yellow-800 mb-2">{change.key}</p>
									<div class="space-y-2">
										<div>
											<p class="text-xs text-gray-600 mb-1">変更前:</p>
											<pre
												class="text-xs text-red-700 bg-red-50 p-2 rounded whitespace-pre-wrap break-words">{formatValue(change.oldValue)}</pre>
										</div>
										<div>
											<p class="text-xs text-gray-600 mb-1">変更後:</p>
											<pre
												class="text-xs text-green-700 bg-green-50 p-2 rounded whitespace-pre-wrap break-words">{formatValue(change.newValue)}</pre>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.diff-viewer pre {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		margin: 0;
	}
</style>
