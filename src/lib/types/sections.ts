// LP/サイトのセクション型定義

export type SectionType =
	| 'hero'
	| 'features'
	| 'cta'
	| 'contact'
	| 'pricing'
	| 'testimonials'
	| 'faq'
	| 'team'
	| 'stats'
	| 'gallery'
	| 'video'
	| 'newsletter'
	| 'custom'
	| 'style'
	| 'two_column_text_image'
	| 'two_column_image_text'
	| 'two_column_text_video'
	| 'two_column_features_image'
	| 'two_column_text_contact'
	| 'two_column_contact_image';

export interface BaseSection {
	id: string;
	type: SectionType;
	order: number;
	// スタイル設定
	style?: {
		backgroundColor?: string; // 背景色
		textColor?: string; // テキスト色
		padding?: string; // パディング
		backgroundImage?: {
			url: string; // 画像URL
			opacity: number; // 透過度 (0-100)
			position: string; // 配置位置 ('center', 'top', 'bottom', etc.)
			positionX?: string; // X軸位置 (例: '50%', '100px', '-50px')
			positionY?: string; // Y軸位置 (例: '50%', '100px', '-50px')
			size: string; // サイズ ('cover', 'contain', 'auto')
			repeat: string; // リピート ('no-repeat', 'repeat', etc.)
			rotation?: number; // 回転角度 (0-360度)
		};
	};
	// 2カラムレイアウト用画像
	images?: {
		leftImage?: string; // 左側の画像URL
		rightImage?: string; // 右側の画像URL
		layout?: 'image-left' | 'image-right' | 'two-column'; // レイアウトタイプ
	};
}

export interface HeroSection extends BaseSection {
	type: 'hero';
	content: {
		title: string;
		subtitle?: string;
		description?: string;
		buttonText?: string;
		buttonLink?: string;
		backgroundImage?: string;
		backgroundColor?: string;
	};
}

export interface FeaturesSection extends BaseSection {
	type: 'features';
	content: {
		title: string;
		subtitle?: string;
		features: Array<{
			iconName: string; // lucide-svelteのアイコン名
			title: string;
			description: string;
		}>;
	};
}

export interface CTASection extends BaseSection {
	type: 'cta';
	content: {
		title: string;
		description?: string;
		buttonText: string;
		buttonLink: string;
		backgroundColor?: string;
	};
}

export interface ContactSection extends BaseSection {
	type: 'contact';
	content: {
		title: string;
		description?: string;
		formFields: Array<{
			name: string;
			label: string;
			type: 'text' | 'email' | 'tel' | 'textarea';
			required: boolean;
			placeholder?: string;
		}>;
		submitButtonText: string;
		// 専用ページモード設定
		useDedicatedPage?: boolean; // true: /contactへのリンクボタン表示、false: インラインフォーム表示
		dedicatedPageButtonText?: string; // 専用ページへのボタンテキスト（デフォルト: "お問い合わせはこちら"）
		titleColor?: string;
		descriptionColor?: string;
		fontFamily?: string;
	};
}

export interface CustomSection extends BaseSection {
	type: 'custom';
	content: {
		html: string;
	};
}

export interface StyleSection extends BaseSection {
	type: 'style';
	content: {
		title: string;
		description?: string;
	};
}

export interface PricingSection extends BaseSection {
	type: 'pricing';
	content: {
		title: string;
		subtitle?: string;
		plans: Array<{
			name: string;
			price: string;
			period?: string;
			description?: string;
			features: string[];
			highlighted?: boolean;
			buttonText: string;
			buttonLink: string;
		}>;
	};
}

export interface TestimonialsSection extends BaseSection {
	type: 'testimonials';
	content: {
		title: string;
		subtitle?: string;
		testimonials: Array<{
			name: string;
			position?: string;
			company?: string;
			content: string;
			avatar?: string;
			rating?: number;
		}>;
	};
}

export interface FAQSection extends BaseSection {
	type: 'faq';
	content: {
		title: string;
		subtitle?: string;
		items: Array<{
			question: string;
			answer: string;
		}>;
	};
}

export interface TeamSection extends BaseSection {
	type: 'team';
	content: {
		title: string;
		subtitle?: string;
		members: Array<{
			name: string;
			position: string;
			bio?: string;
			avatar?: string;
			social?: {
				twitter?: string;
				linkedin?: string;
				github?: string;
			};
		}>;
	};
}

export interface StatsSection extends BaseSection {
	type: 'stats';
	content: {
		title?: string;
		subtitle?: string;
		stats: Array<{
			value: string;
			label: string;
			description?: string;
		}>;
		backgroundColor?: string;
	};
}

export interface GallerySection extends BaseSection {
	type: 'gallery';
	content: {
		title: string;
		subtitle?: string;
		images: Array<{
			url: string;
			alt: string;
			caption?: string;
		}>;
		columns?: number;
	};
}

export interface VideoSection extends BaseSection {
	type: 'video';
	content: {
		title?: string;
		subtitle?: string;
		videoUrl: string;
		videoType: 'youtube' | 'vimeo' | 'direct';
		thumbnail?: string;
		description?: string;
	};
}

export interface NewsletterSection extends BaseSection {
	type: 'newsletter';
	content: {
		title: string;
		description?: string;
		placeholder?: string;
		buttonText: string;
		privacyText?: string;
		backgroundColor?: string;
	};
}

export interface TwoColumnTextImageSection extends BaseSection {
	type: 'two_column_text_image';
	content: {
		textColumn: {
			title?: string;
			subtitle?: string;
			description?: string;
			buttonText?: string;
			buttonLink?: string;
			titleColor?: string;
			subtitleColor?: string;
			descriptionColor?: string;
			titleBold?: boolean;
			titleItalic?: boolean;
			subtitleBold?: boolean;
			subtitleItalic?: boolean;
			fontFamily?: string;
		};
		imageColumn: {
			imageUrl: string;
			imageAlt: string;
			caption?: string;
		};
		layout: {
			ratio: '50-50' | '60-40' | '40-60';
		};
	};
}

export interface TwoColumnImageTextSection extends BaseSection {
	type: 'two_column_image_text';
	content: {
		imageColumn: {
			imageUrl: string;
			imageAlt: string;
			caption?: string;
		};
		textColumn: {
			title?: string;
			subtitle?: string;
			description?: string;
			buttonText?: string;
			buttonLink?: string;
			titleColor?: string;
			subtitleColor?: string;
			descriptionColor?: string;
			titleBold?: boolean;
			titleItalic?: boolean;
			subtitleBold?: boolean;
			subtitleItalic?: boolean;
			fontFamily?: string;
		};
		layout: {
			ratio: '50-50' | '60-40' | '40-60';
		};
	};
}

export interface TwoColumnTextVideoSection extends BaseSection {
	type: 'two_column_text_video';
	content: {
		textColumn: {
			title?: string;
			subtitle?: string;
			description?: string;
			buttonText?: string;
			buttonLink?: string;
			titleColor?: string;
			subtitleColor?: string;
			descriptionColor?: string;
			titleBold?: boolean;
			titleItalic?: boolean;
			subtitleBold?: boolean;
			subtitleItalic?: boolean;
			fontFamily?: string;
		};
		videoColumn: {
			videoUrl: string;
			videoType: 'youtube' | 'vimeo' | 'direct';
			thumbnail?: string;
		};
		layout: {
			ratio: '50-50' | '60-40' | '40-60';
		};
	};
}

export interface TwoColumnFeaturesImageSection extends BaseSection {
	type: 'two_column_features_image';
	content: {
		featuresColumn: {
			title: string;
			subtitle?: string;
			features: Array<{
				iconName: string;
				title: string;
				description: string;
			}>;
		};
		imageColumn: {
			imageUrl: string;
			imageAlt: string;
			caption?: string;
		};
		layout: {
			ratio: '50-50' | '60-40' | '40-60';
		};
	};
}

export interface TwoColumnTextContactSection extends BaseSection {
	type: 'two_column_text_contact';
	content: {
		textColumn: {
			title?: string;
			subtitle?: string;
			description?: string;
			titleColor?: string;
			subtitleColor?: string;
			descriptionColor?: string;
			fontFamily?: string;
		};
		contactColumn: {
			formFields: Array<{
				name: string;
				label: string;
				type: 'text' | 'email' | 'tel' | 'textarea';
				required: boolean;
				placeholder?: string;
			}>;
			submitButtonText: string;
			useDedicatedPage?: boolean;
			dedicatedPageButtonText?: string;
		};
		layout: {
			ratio: '50-50' | '60-40' | '40-60';
		};
	};
}

export interface TwoColumnContactImageSection extends BaseSection {
	type: 'two_column_contact_image';
	content: {
		contactColumn: {
			formFields: Array<{
				name: string;
				label: string;
				type: 'text' | 'email' | 'tel' | 'textarea';
				required: boolean;
				placeholder?: string;
			}>;
			submitButtonText: string;
			useDedicatedPage?: boolean;
			dedicatedPageButtonText?: string;
		};
		imageColumn: {
			imageUrl: string;
			imageAlt: string;
			caption?: string;
		};
		layout: {
			ratio: '50-50' | '60-40' | '40-60';
		};
	};
}

export type Section =
	| HeroSection
	| FeaturesSection
	| CTASection
	| ContactSection
	| PricingSection
	| TestimonialsSection
	| FAQSection
	| TeamSection
	| StatsSection
	| GallerySection
	| VideoSection
	| NewsletterSection
	| CustomSection
	| StyleSection
	| TwoColumnTextImageSection
	| TwoColumnImageTextSection
	| TwoColumnTextVideoSection
	| TwoColumnFeaturesImageSection
	| TwoColumnTextContactSection
	| TwoColumnContactImageSection;

export interface PageContent {
	sections: Section[];
}
