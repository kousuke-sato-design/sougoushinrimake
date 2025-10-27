<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Clock, Save, CheckCircle, AlertCircle } from 'lucide-svelte';
	import { verifyWorkSession, verifySingleTime } from '$lib/utils/verifyWorkSession';

	let description = '';
	let changes = '';
	let startTime = '';
	let endTime = '';
	let saving = false;
	let message = '';
	let messageType: 'success' | 'error' = 'success';
	let verifying = false;
	let verificationResult: { verified: boolean; source: string; details: string } | null = null;
	let startTimeVerification: { verified: boolean; source: string; details: string } | null = null;
	let endTimeVerification: { verified: boolean; source: string; details: string } | null = null;
	let draftId: string | null = null;
	let isDraftMode = false;

	// 初期値設定（現在時刻の2時間前〜現在）
	const now = new Date();
	const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

	startTime = twoHoursAgo.toISOString().slice(0, 16);
	endTime = now.toISOString().slice(0, 16);

	onMount(async () => {
		// URLパラメータからdraft_idを取得
		const urlParams = new URLSearchParams(window.location.search);
		const draft_id = urlParams.get('draft_id');

		if (draft_id) {
			await loadDraft(draft_id);
		}
	});

	async function loadDraft(id: string) {
		try {
			const { data, error } = await supabase
				.from('work_sessions')
				.select('*')
				.eq('id', id)
				.eq('status', 'draft')
				.single();

			if (error) throw error;

			if (data) {
				draftId = id;
				isDraftMode = true;

				// 開始時刻を設定
				const start = new Date(data.start_time);
				startTime = start.toISOString().slice(0, 16);

				// 終了時刻を現在時刻に設定
				const now = new Date();
				endTime = now.toISOString().slice(0, 16);

				// 既存のdescriptionとchangesがあれば設定
				description = data.description || '';
				if (data.changes && Array.isArray(data.changes)) {
					changes = data.changes.join('\n');
				}

				// 開始時刻の検証状態を表示
				startTimeVerification = await verifySingleTime(start);

				// 終了時刻も自動検証
				await verifyEndTime();
			}
		} catch (e: any) {
			console.error('Failed to load draft:', e);
			message = `下書きの読み込みに失敗しました: ${e.message}`;
			messageType = 'error';
		}
	}

	// 現在時刻を設定
	function setCurrentTime(target: 'start' | 'end') {
		const now = new Date();
		// datetime-local用にローカル時刻をフォーマット (YYYY-MM-DDTHH:mm)
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const currentTime = `${year}-${month}-${day}T${hours}:${minutes}`;

		if (target === 'start') {
			startTime = currentTime;
		} else {
			endTime = currentTime;
		}
		handleTimeChange();
	}

	// 開始時刻の検証
	async function verifyStartTime() {
		if (!startTime) return;

		verifying = true;
		startTimeVerification = null;

		try {
			const start = new Date(startTime);
			const result = await verifySingleTime(start);
			startTimeVerification = result;
		} catch (e) {
			console.error('Start time verification failed:', e);
		} finally {
			verifying = false;
		}
	}

	// 終了時刻の検証
	async function verifyEndTime() {
		if (!endTime) return;

		verifying = true;
		endTimeVerification = null;

		try {
			const end = new Date(endTime);
			const result = await verifySingleTime(end);
			endTimeVerification = result;
		} catch (e) {
			console.error('End time verification failed:', e);
		} finally {
			verifying = false;
		}
	}

	// 時間変更時に自動検証
	async function handleTimeChange() {
		if (!startTime && !endTime) return;

		verifying = true;

		try {
			// 開始時刻と終了時刻を個別に検証
			if (startTime && !isDraftMode) {
				await verifyStartTime();
			}
			if (endTime) {
				await verifyEndTime();
			}
		} catch (e) {
			console.error('Verification failed:', e);
		} finally {
			verifying = false;
		}
	}

	// 下書きとして開始時刻のみ記録
	async function startDraft() {
		if (!startTime) {
			message = '開始時刻を入力してください';
			messageType = 'error';
			return;
		}

		saving = true;
		message = '';

		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				message = 'ユーザー情報を取得できませんでした';
				messageType = 'error';
				saving = false;
				return;
			}

			const start = new Date(startTime);

			const { error } = await supabase.from('work_sessions').insert({
				user_id: user.id,
				session_date: start.toISOString().split('T')[0],
				start_time: start.toISOString(),
				status: 'draft'
			});

			if (error) throw error;

			message = '作業開始を記録しました（下書き）';
			messageType = 'success';

			setTimeout(() => {
				goto('/dashboard/work-history');
			}, 1500);
		} catch (e: any) {
			console.error('Error starting draft:', e);
			message = `エラー: ${e.message}`;
			messageType = 'error';
		} finally {
			saving = false;
		}
	}

	async function saveWorkSession() {
		if (!description.trim()) {
			message = '作業内容を入力してください';
			messageType = 'error';
			return;
		}

		if (!startTime || !endTime) {
			message = '開始時刻と終了時刻を入力してください';
			messageType = 'error';
			return;
		}

		saving = true;
		message = '';

		try {
			// ユーザー情報を取得
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				message = 'ユーザー情報を取得できませんでした';
				messageType = 'error';
				saving = false;
				return;
			}

			const start = new Date(startTime);
			const end = new Date(endTime);
			const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

			if (durationMinutes <= 0) {
				message = '終了時刻は開始時刻より後である必要があります';
				messageType = 'error';
				saving = false;
				return;
			}

			const changesArray = changes
				.split('\n')
				.map(line => line.trim())
				.filter(line => line.length > 0);

			// 検証がまだの場合は実行
			if (!startTimeVerification && !isDraftMode) {
				startTimeVerification = await verifySingleTime(start);
			}
			if (!endTimeVerification) {
				endTimeVerification = await verifySingleTime(end);
			}

			// 両方の時刻が検証済みかチェック
			const isFullyVerified =
				(isDraftMode || startTimeVerification?.verified) &&
				endTimeVerification?.verified;

			// 下書き編集モードの場合はUPDATE、それ以外はINSERT
			if (isDraftMode && draftId) {
				const { error } = await supabase
					.from('work_sessions')
					.update({
						end_time: end.toISOString(),
						duration_minutes: durationMinutes,
						description: description.trim(),
						changes: changesArray.length > 0 ? changesArray : null,
						verified: isFullyVerified,
						verification_source: isFullyVerified ? 'database_activity' : null,
						status: 'completed',
						updated_at: new Date().toISOString()
					})
					.eq('id', draftId);

				if (error) throw error;

				message = '作業を完了しました';
			} else {
				const { error } = await supabase.from('work_sessions').insert({
					user_id: user.id,
					session_date: start.toISOString().split('T')[0],
					start_time: start.toISOString(),
					end_time: end.toISOString(),
					duration_minutes: durationMinutes,
					description: description.trim(),
					changes: changesArray.length > 0 ? changesArray : null,
					verified: isFullyVerified,
					verification_source: isFullyVerified ? 'database_activity' : null,
					status: 'completed'
				});

				if (error) throw error;

				message = '作業履歴を記録しました';
			}

			messageType = 'success';

			// 2秒後に作業履歴ページに戻る
			setTimeout(() => {
				goto('/dashboard/work-history');
			}, 2000);
		} catch (e: any) {
			console.error('Error saving work session:', e);
			message = `エラー: ${e.message}`;
			messageType = 'error';
		} finally {
			saving = false;
		}
	}
</script>

<div class="max-w-3xl mx-auto">
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="p-3 bg-pink-100 rounded-lg">
				<Clock size={32} class="text-pink-600" />
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">
					{isDraftMode ? '作業を完了' : '作業履歴を記録'}
				</h1>
				<p class="text-gray-600 mt-1">
					{isDraftMode ? '作業内容を入力して完了してください' : '本日の作業内容を記録します'}
				</p>
			</div>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow-md p-6">
		<form on:submit|preventDefault={saveWorkSession} class="space-y-6">
			<!-- 作業時間 -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						開始時刻
					</label>
					<div class="flex gap-2">
						<input
							type="datetime-local"
							bind:value={startTime}
							on:change={handleTimeChange}
							disabled={isDraftMode}
							class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
							required
						/>
						{#if !isDraftMode}
							<button
								type="button"
								on:click={() => setCurrentTime('start')}
								class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium whitespace-nowrap"
							>
								現在時刻
							</button>
						{/if}
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						終了時刻
					</label>
					<div class="flex gap-2">
						<input
							type="datetime-local"
							bind:value={endTime}
							on:change={handleTimeChange}
							class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
							required
						/>
						<button
							type="button"
							on:click={() => setCurrentTime('end')}
							class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium whitespace-nowrap"
						>
							現在時刻
						</button>
					</div>
				</div>
			</div>

			<!-- 検証結果 -->
			{#if verifying}
				<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
					<div class="flex items-center gap-2 text-blue-700">
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
						<span class="text-sm font-medium">作業時間を検証中...</span>
					</div>
				</div>
			{:else if startTimeVerification || endTimeVerification}
				<div class="space-y-3">
					<!-- 開始時刻の検証結果 -->
					{#if startTimeVerification}
						<div
							class="p-4 rounded-lg border {startTimeVerification.verified
								? 'bg-green-50 border-green-200'
								: 'bg-amber-50 border-amber-200'}"
						>
							<div class="flex items-start gap-3">
								{#if startTimeVerification.verified}
									<CheckCircle size={20} class="text-green-600 mt-0.5" />
									<div class="flex-1">
										<p class="text-sm font-semibold text-green-800">
											開始時刻 - 検証済み
											{#if isDraftMode}
												<span class="text-xs font-normal text-green-600">(下書き時に記録)</span>
											{/if}
										</p>
										<p class="text-xs text-green-700 mt-1">{startTimeVerification.details}</p>
									</div>
								{:else}
									<AlertCircle size={20} class="text-amber-600 mt-0.5" />
									<div class="flex-1">
										<p class="text-sm font-semibold text-amber-800">
											開始時刻 - 未検証
											{#if isDraftMode}
												<span class="text-xs font-normal text-amber-600">(下書き時に記録)</span>
											{/if}
										</p>
										<p class="text-xs text-amber-700 mt-1">{startTimeVerification.details}</p>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- 終了時刻の検証結果 -->
					{#if endTimeVerification}
						<div
							class="p-4 rounded-lg border {endTimeVerification.verified
								? 'bg-green-50 border-green-200'
								: 'bg-amber-50 border-amber-200'}"
						>
							<div class="flex items-start gap-3">
								{#if endTimeVerification.verified}
									<CheckCircle size={20} class="text-green-600 mt-0.5" />
									<div class="flex-1">
										<p class="text-sm font-semibold text-green-800">終了時刻 - 検証済み</p>
										<p class="text-xs text-green-700 mt-1">{endTimeVerification.details}</p>
									</div>
								{:else}
									<AlertCircle size={20} class="text-amber-600 mt-0.5" />
									<div class="flex-1">
										<p class="text-sm font-semibold text-amber-800">終了時刻 - 未検証</p>
										<p class="text-xs text-amber-700 mt-1">{endTimeVerification.details}</p>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- 作業内容 -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					作業内容 <span class="text-red-500">*</span>
				</label>
				<textarea
					bind:value={description}
					rows="4"
					placeholder="例: 作業履歴システムを実装。サイドバーメニュー追加、データベーステーブル作成、UIコンポーネント作成、記録機能実装"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
					required
				></textarea>
				<p class="text-xs text-gray-500 mt-1">
					具体的かつ簡潔に記述してください
				</p>
			</div>

			<!-- 変更ファイル -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					変更ファイル（任意）
				</label>
				<textarea
					bind:value={changes}
					rows="6"
					placeholder="1行に1ファイルずつ入力してください&#10;例:&#10;src/routes/dashboard/+layout.svelte&#10;src/lib/components/WorkHistory.svelte&#10;CLAUDE.md"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
				></textarea>
				<p class="text-xs text-gray-500 mt-1">
					変更したファイルのパスを1行ずつ入力（空白の場合は記録されません）
				</p>
			</div>

			<!-- メッセージ -->
			{#if message}
				<div
					class="p-4 rounded-lg {messageType === 'success'
						? 'bg-green-50 text-green-700 border border-green-200'
						: 'bg-red-50 text-red-700 border border-red-200'}"
				>
					{message}
				</div>
			{/if}

			<!-- ボタン -->
			<div class="flex gap-3">
				{#if !isDraftMode}
					<button
						type="button"
						on:click={startDraft}
						disabled={saving}
						class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if saving}
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							<span>開始中...</span>
						{:else}
							<Clock size={20} />
							<span>作業開始を記録</span>
						{/if}
					</button>
				{/if}
				<button
					type="submit"
					disabled={saving}
					class="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if saving}
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
						<span>記録中...</span>
					{:else}
						<Save size={20} />
						<span>{isDraftMode ? '作業完了' : '完了を記録'}</span>
					{/if}
				</button>
				<a
					href="/dashboard/work-history"
					class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
				>
					キャンセル
				</a>
			</div>
		</form>
	</div>
</div>
