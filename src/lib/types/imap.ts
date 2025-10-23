export interface ImapAccount {
	id: string;
	user_id: string;
	name: string;
	email: string;
	imap_host: string;
	imap_port: number;
	smtp_host: string;
	smtp_port: number;
	username: string;
	password: string;
	use_ssl: boolean;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface ImapAccountInput {
	name: string;
	email: string;
	imap_host: string;
	imap_port: number;
	smtp_host: string;
	smtp_port: number;
	username: string;
	password: string;
	use_ssl?: boolean;
	is_active?: boolean;
}

// Gmail用のプリセット
export const GMAIL_PRESET: Partial<ImapAccountInput> = {
	imap_host: 'imap.gmail.com',
	imap_port: 993,
	smtp_host: 'smtp.gmail.com',
	smtp_port: 587,
	use_ssl: true
};
