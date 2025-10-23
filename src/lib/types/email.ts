export interface EmailSetting {
	id: string;
	user_id: string;
	name: string;
	subject: string;
	body: string;
	from_name?: string;
	imap_account_id?: string; // IMAPアカウントID
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface EmailSettingInput {
	name: string;
	subject: string;
	body: string;
	from_name?: string;
	imap_account_id?: string;
	is_active?: boolean;
}
