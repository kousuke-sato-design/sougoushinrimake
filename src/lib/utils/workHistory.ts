import { supabase } from '$lib/supabaseClient';
import type { WorkHistoryActionType } from '$lib/types/work-history';

export async function recordWorkHistory(
	actionType: WorkHistoryActionType,
	description: string,
	landingPageId?: string | null,
	details?: Record<string, any>
): Promise<void> {
	try {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			console.warn('User not authenticated, skipping work history recording');
			return;
		}

		const { error } = await supabase.from('work_history').insert({
			user_id: user.id,
			landing_page_id: landingPageId || null,
			action_type: actionType,
			description,
			details: details || null
		});

		if (error) {
			console.error('Failed to record work history:', error);
		}
	} catch (e) {
		console.error('Error recording work history:', e);
	}
}
