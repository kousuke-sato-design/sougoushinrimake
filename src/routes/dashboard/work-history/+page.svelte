<script lang="ts">
	import WorkHistory from '$lib/components/WorkHistory.svelte';
	import { Clock, Plus } from 'lucide-svelte';
</script>

<div class="max-w-7xl mx-auto">
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="p-3 bg-pink-100 rounded-lg">
					<Clock size={32} class="text-pink-600" />
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-900">作業履歴</h1>
					<p class="text-gray-600 mt-1">全てのLP編集作業の履歴を確認できます</p>
				</div>
			</div>
			<a
				href="/dashboard/work-history/record"
				class="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition"
			>
				<Plus size={20} />
				手動で記録
			</a>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow-md" style="height: calc(100vh - 250px);">
		<WorkHistory />
	</div>
</div>
