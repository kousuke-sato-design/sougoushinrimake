import { supabase } from '$lib/supabaseClient';

let currentSessionId: string | null = null;
let sessionStartTime: Date | null = null;

/**
 * 作業セッションを開始
 */
export async function startWorkSession(): Promise<string | null> {
	try {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			console.warn('User not authenticated');
			return null;
		}

		sessionStartTime = new Date();

		const { data, error } = await supabase
			.from('work_sessions')
			.insert({
				user_id: user.id,
				session_date: new Date().toISOString().split('T')[0],
				start_time: sessionStartTime.toISOString()
			})
			.select()
			.single();

		if (error) {
			console.error('Failed to start work session:', error);
			return null;
		}

		currentSessionId = data.id;
		console.log('Work session started:', currentSessionId);
		return currentSessionId;
	} catch (e) {
		console.error('Error starting work session:', e);
		return null;
	}
}

/**
 * 作業セッションを終了
 */
export async function endWorkSession(description?: string): Promise<void> {
	if (!currentSessionId || !sessionStartTime) {
		console.warn('No active work session');
		return;
	}

	try {
		const endTime = new Date();
		const durationMinutes = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 60000);

		const { error } = await supabase
			.from('work_sessions')
			.update({
				end_time: endTime.toISOString(),
				duration_minutes: durationMinutes,
				description: description || null
			})
			.eq('id', currentSessionId);

		if (error) {
			console.error('Failed to end work session:', error);
		} else {
			console.log(`Work session ended: ${durationMinutes} minutes`);
		}

		currentSessionId = null;
		sessionStartTime = null;
	} catch (e) {
		console.error('Error ending work session:', e);
	}
}

/**
 * 作業内容を記録（セッション中）
 */
export async function recordWorkDescription(description: string, changedFiles?: string[]): Promise<void> {
	if (!currentSessionId) {
		console.warn('No active work session');
		return;
	}

	try {
		const updateData: any = {
			description
		};

		if (changedFiles && changedFiles.length > 0) {
			updateData.changes = changedFiles;
		}

		const { error } = await supabase
			.from('work_sessions')
			.update(updateData)
			.eq('id', currentSessionId);

		if (error) {
			console.error('Failed to record work description:', error);
		}
	} catch (e) {
		console.error('Error recording work description:', e);
	}
}

/**
 * 現在のセッションIDを取得
 */
export function getCurrentSessionId(): string | null {
	return currentSessionId;
}
