import nodemailer from 'nodemailer';

export interface EmailOptions {
	to: string;
	subject: string;
	text?: string;
	html?: string;
	from?: string;
}

export interface SMTPConfig {
	host: string;
	port: number;
	secure: boolean;
	auth: {
		user: string;
		pass: string;
	};
}

/**
 * メールを送信する
 */
export async function sendEmail(config: SMTPConfig, options: EmailOptions): Promise<void> {
	// Nodemailerトランスポーターを作成
	const transporter = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure, // true for 465, false for other ports
		auth: {
			user: config.auth.user,
			pass: config.auth.pass
		}
	});

	// メール送信
	await transporter.sendMail({
		from: options.from || config.auth.user,
		to: options.to,
		subject: options.subject,
		text: options.text,
		html: options.html
	});
}

/**
 * テンプレート変数を置換
 */
export function replaceTemplateVariables(
	template: string,
	variables: Record<string, any>
): string {
	let result = template;

	// {{variable}} 形式の変数を置換
	for (const [key, value] of Object.entries(variables)) {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
		result = result.replace(regex, String(value || ''));
	}

	return result;
}
