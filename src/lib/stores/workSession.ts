import { writable } from 'svelte/store';

export interface ActiveSession {
	id: string;
	startTime: Date;
	lastActivityTime: Date;
	description: string;
	changedFiles: Set<string>;
}

export const activeWorkSession = writable<ActiveSession | null>(null);

export function startSession(id: string) {
	activeWorkSession.set({
		id,
		startTime: new Date(),
		lastActivityTime: new Date(),
		description: '',
		changedFiles: new Set()
	});
}

export function endSession() {
	activeWorkSession.set(null);
}

export function updateDescription(description: string) {
	activeWorkSession.update(session => {
		if (session) {
			return { ...session, description };
		}
		return session;
	});
}

export function addChangedFile(filePath: string) {
	activeWorkSession.update(session => {
		if (session) {
			session.changedFiles.add(filePath);
			// 最終活動時刻を更新
			session.lastActivityTime = new Date();
			return session;
		}
		return session;
	});
}
