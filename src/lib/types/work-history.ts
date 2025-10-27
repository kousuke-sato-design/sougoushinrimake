export interface WorkSession {
	id: string;
	user_id: string;
	session_date: string; // YYYY-MM-DD形式
	start_time: string;
	end_time?: string;
	duration_minutes?: number;
	description?: string;
	changes?: string[]; // 変更されたファイルのリスト
	verified?: boolean; // 実際の活動ログで検証済みか
	verification_source?: string; // 検証方法
	created_at: string;
	updated_at: string;
}

export interface WorkSessionByDate {
	date: string; // YYYY-MM-DD形式
	sessions: WorkSession[];
	totalMinutes: number; // その日の合計作業時間
}
