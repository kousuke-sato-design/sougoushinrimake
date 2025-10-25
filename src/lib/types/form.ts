// フォームフィールドの型定義
export interface FormField {
	name: string;
	label: string;
	type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio';
	required: boolean;
	placeholder?: string;
	options?: string[]; // select/radio用の選択肢
}

// フォームテンプレートの型定義
export interface FormTemplate {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	fields: FormField[];
	is_default: boolean;
	created_at: string;
	updated_at: string;
}

// フォームテンプレート入力用の型
export interface FormTemplateInput {
	name: string;
	description?: string;
	fields: FormField[];
	is_default?: boolean;
}

// デフォルトテンプレート
export const DEFAULT_FORM_TEMPLATES = {
	basic: {
		name: '基本お問い合わせ',
		description: 'お名前、メールアドレス、お問い合わせ内容のシンプルなフォーム',
		fields: [
			{ name: 'name', label: 'お名前', type: 'text' as const, required: true, placeholder: '山田 太郎' },
			{ name: 'email', label: 'メールアドレス', type: 'email' as const, required: true, placeholder: 'yamada@example.com' },
			{ name: 'message', label: 'お問い合わせ内容', type: 'textarea' as const, required: true, placeholder: 'お問い合わせ内容をご記入ください' }
		]
	},
	business: {
		name: 'ビジネスお問い合わせ',
		description: '会社名や電話番号、お問い合わせ種別を含むビジネス向けフォーム',
		fields: [
			{ name: 'name', label: 'お名前', type: 'text' as const, required: true, placeholder: '山田 太郎' },
			{ name: 'email', label: 'メールアドレス', type: 'email' as const, required: true, placeholder: 'yamada@example.com' },
			{ name: 'company', label: '会社名', type: 'text' as const, required: true, placeholder: '株式会社サンプル' },
			{ name: 'phone', label: '電話番号', type: 'tel' as const, required: false, placeholder: '03-1234-5678' },
			{
				name: 'inquiry_type',
				label: 'お問い合わせ種別',
				type: 'select' as const,
				required: true,
				placeholder: '選択してください',
				options: ['製品に関するお問い合わせ', 'サービスに関するお問い合わせ', '価格・見積もりについて', 'その他']
			},
			{
				name: 'budget',
				label: 'ご予算',
				type: 'radio' as const,
				required: false,
				options: ['～50万円', '50万円～100万円', '100万円～300万円', '300万円以上', '未定']
			},
			{ name: 'message', label: 'お問い合わせ内容', type: 'textarea' as const, required: true, placeholder: 'お問い合わせ内容の詳細をご記入ください' }
		]
	},
	download: {
		name: '資料ダウンロード',
		description: '資料請求やホワイトペーパーダウンロード用フォーム',
		fields: [
			{ name: 'name', label: 'お名前', type: 'text' as const, required: true, placeholder: '山田 太郎' },
			{ name: 'email', label: 'メールアドレス', type: 'email' as const, required: true, placeholder: 'yamada@example.com' },
			{ name: 'company', label: '会社名', type: 'text' as const, required: true, placeholder: '株式会社サンプル' },
			{ name: 'phone', label: '電話番号', type: 'tel' as const, required: false, placeholder: '03-1234-5678' }
		]
	}
};
