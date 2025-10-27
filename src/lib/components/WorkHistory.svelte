<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import type { WorkSession, WorkSessionByDate } from '$lib/types/work-history';
	import { Clock, FileText, Calendar, Lock } from 'lucide-svelte';

	let sessionsByDate: WorkSessionByDate[] = [];
	let draftSessions: WorkSession[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadSessions();
	});

	async function loadSessions() {
		loading = true;
		error = '';

		try {
			const { data, error: fetchError } = await supabase
				.from('work_sessions')
				.select('*')
				.order('session_date', { ascending: false })
				.order('start_time', { ascending: false })
				.limit(100);

			if (fetchError) throw fetchError;

			// 下書きと完了済みを分離
			const allSessions = data || [];
			draftSessions = allSessions.filter(s => s.status === 'draft');
			const completedSessions = allSessions.filter(s => s.status === 'completed');

			// 完了済みセッションを日付ごとにグループ化
			const grouped = completedSessions.reduce((acc: Record<string, WorkSession[]>, session) => {
				const date = session.session_date;
				if (!acc[date]) {
					acc[date] = [];
				}
				acc[date].push(session);
				return acc;
			}, {});

			sessionsByDate = Object.entries(grouped).map(([date, sessions]) => {
				const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
				return {
					date,
					sessions,
					totalMinutes
				};
			});
		} catch (e: any) {
			console.error('Failed to load work sessions:', e);
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			weekday: 'short'
		});
	}

	function formatTime(timestamp: string): string {
		return new Date(timestamp).toLocaleTimeString('ja-JP', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}時間${mins}分`;
		}
		return `${mins}分`;
	}

	// 経過時間を計算（下書き用）
	function getElapsedTime(startTime: string): string {
		const start = new Date(startTime);
		const now = new Date();
		const diffMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
		return formatDuration(diffMinutes);
	}

	// 下書きを完了させる（recordページに遷移）
	function completeDraft(sessionId: string) {
		window.location.href = `/dashboard/work-history/record?draft_id=${sessionId}`;
	}

	// 下書きを削除
	async function deleteDraft(sessionId: string) {
		if (!confirm('この下書きを削除しますか？')) return;

		try {
			const { error } = await supabase
				.from('work_sessions')
				.delete()
				.eq('id', sessionId);

			if (error) throw error;

			await loadSessions();
			alert('下書きを削除しました');
		} catch (e: any) {
			console.error('Failed to delete draft:', e);
			alert(`エラー: ${e.message}`);
		}
	}
</script>

<div class="h-full flex flex-col bg-white">
	<div class="p-4 border-b border-gray-200">
		<div class="flex items-center gap-2">
			<Clock size={20} class="text-pink-600" />
			<h3 class="text-lg font-semibold text-gray-800">作業履歴</h3>
		</div>
		<p class="text-xs text-gray-500 mt-1">
			Claude Codeでの作業セッションを記録
		</p>
	</div>

	<div class="flex-1 overflow-y-auto p-4">
		{#if loading}
			<div class="text-center py-8 text-gray-500">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
				<p class="mt-2 text-sm">読み込み中...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
				<p class="text-sm">{error}</p>
			</div>
		{:else}
			<!-- 下書きセクション -->
			{#if draftSessions.length > 0}
				<div class="mb-6">
					<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-3">
						<h4 class="text-sm font-semibold text-blue-800 mb-1">作業中のセッション</h4>
						<p class="text-xs text-blue-700">開始時刻のみ記録されています。完了ボタンで作業を終了してください。</p>
					</div>
					<div class="space-y-3">
						{#each draftSessions as session}
							<div class="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
								<div class="flex items-start justify-between mb-2">
									<div class="flex items-center gap-2">
										<Clock size={16} class="text-blue-600" />
										<span class="text-sm font-medium text-blue-900">
											開始: {formatTime(session.start_time)}
										</span>
										<span class="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
											経過: {getElapsedTime(session.start_time)}
										</span>
									</div>
								</div>
								<div class="flex gap-2 mt-3">
									<button
										on:click={() => completeDraft(session.id)}
										class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
									>
										作業完了
									</button>
									<button
										on:click={() => deleteDraft(session.id)}
										class="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
									>
										削除
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if sessionsByDate.length === 0 && draftSessions.length === 0}
				<div class="text-center py-8 text-gray-500">
					<FileText size={48} class="mx-auto mb-2 text-gray-300" />
					<p class="text-sm">作業履歴がありません</p>
				</div>
			{:else if sessionsByDate.length > 0}
				<div class="space-y-6">
				{#each sessionsByDate as group}
					<div>
						<div class="sticky top-0 bg-white py-2 mb-3 border-b border-gray-200">
							<div class="flex items-center justify-between">
								<h4 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
									<Calendar size={16} class="text-pink-600" />
									{formatDate(group.date)}
								</h4>
								<span class="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded">
									合計 {formatDuration(group.totalMinutes)}
								</span>
							</div>
						</div>
						<div class="space-y-3">
							{#each group.sessions as session}
								<div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition border border-gray-200">
									<div class="flex items-start justify-between mb-2">
										<div class="flex items-center gap-2 flex-wrap">
											<Clock size={16} class="text-gray-400" />
											<span class="text-sm text-gray-600">
												{formatTime(session.start_time)}
												{#if session.end_time}
													→ {formatTime(session.end_time)}
												{:else}
													→ 作業中
												{/if}
											</span>
											{#if session.verified}
												<span
													class="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200"
													title={session.verification_source || '検証済み'}
												>
													✓ 証明あり
												</span>
												<span
													class="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1"
													title="検証済みのため編集・削除不可"
												>
													<Lock size={12} />
													ロック済み
												</span>
											{:else}
												<span
													class="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-300"
													title="活動ログで検証できませんでした"
												>
													証明なし
												</span>
											{/if}
										</div>
										{#if session.duration_minutes}
											<span class="text-xs font-semibold text-pink-600 bg-white px-2 py-1 rounded border border-pink-200">
												{formatDuration(session.duration_minutes)}
											</span>
										{/if}
									</div>
									{#if session.description}
										<details class="mt-2" open>
											<summary class="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 mb-1">
												作業内容
											</summary>
											<p class="text-sm text-gray-800 pl-4 whitespace-pre-wrap">
												{session.description}
											</p>
										</details>
									{:else}
										<p class="text-sm text-gray-400 italic mt-2">
											作業内容が記録されていません
										</p>
									{/if}
									{#if session.changes && session.changes.length > 0}
										<details class="mt-3">
											<summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
												変更ファイル ({session.changes.length}個)
											</summary>
											<ul class="mt-2 ml-4 text-xs text-gray-600 space-y-1">
												{#each session.changes as file}
													<li class="font-mono">{file}</li>
												{/each}
											</ul>
										</details>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
