<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { Section, PageContent } from '$lib/types/sections';
	import type { EmailSetting } from '$lib/types/email';
	import type { FormTemplate } from '$lib/types/form';
	import SectionRenderer from '$lib/components/sections/SectionRenderer.svelte';
	import HistoryPanel from '$lib/components/HistoryPanel.svelte';
	import ImageGallery from '$lib/components/ImageGallery.svelte';
	import { supabase } from '$lib/supabaseClient';
	import { onMount } from 'svelte';
	import { recordWorkHistory } from '$lib/utils/workHistory';
	import {
		Sparkles,
		Grid3x3,
		Megaphone,
		Mail,
		FileText,
		Eye,
		History,
		DollarSign,
		MessageSquare,
		HelpCircle,
		Users,
		BarChart3,
		Image as ImageIcon,
		Video as VideoIcon,
		Newspaper,
		ChevronDown,
		Save,
		RotateCcw,
		Palette,
		Settings,
		Columns2,
		Columns3,
		Code,
		GripVertical
	} from 'lucide-svelte';
	import ImageUploader from '$lib/components/ImageUploader.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { activeWorkSession, addChangedFile } from '$lib/stores/workSession';

	export let data: PageData;
	export let form: ActionData;

	let lp = data.landingPage;
	let sections: Section[] = (lp?.content?.sections as Section[]) || [];
	let currentStatus = lp?.status || 'draft';
	let saving = false;
	let leftPanelTab: 'preview' | 'source' | 'history' | 'work-history' = 'preview';

	// 初期化時にbuttonLinkとソーシャルリンクをクリーンアップ
	sections = sections.map((section, index) => {
		const cleanedSection = { ...section };
		if (cleanedSection.content) {
			// 直接buttonLinkがある場合
			if (cleanedSection.content.buttonLink && typeof cleanedSection.content.buttonLink !== 'string') {
				cleanedSection.content.buttonLink = '#';
			}
			// textColumnにbuttonLinkがある場合
			if (cleanedSection.content.textColumn?.buttonLink && typeof cleanedSection.content.textColumn.buttonLink !== 'string') {
				cleanedSection.content.textColumn.buttonLink = '#';
			}
			// plansにbuttonLinkがある場合（Pricingセクション）
			if (cleanedSection.content.plans && Array.isArray(cleanedSection.content.plans)) {
				cleanedSection.content.plans = cleanedSection.content.plans.map((plan: any) => ({
					...plan,
					buttonLink: typeof plan.buttonLink === 'string' ? plan.buttonLink : '#'
				}));
			}
			// teamメンバーのソーシャルリンクとavatarをクリーンアップ
			if (cleanedSection.content.members && Array.isArray(cleanedSection.content.members)) {
				cleanedSection.content.members = cleanedSection.content.members.map((member: any, memberIndex: number) => {
					const cleanedMember = { ...member };

					// avatarをクリーンアップ
					if (cleanedMember.avatar && typeof cleanedMember.avatar !== 'string') {
						console.log(`Section ${index} (${cleanedSection.type}): member[${memberIndex}].avatar is object, cleaning...`, cleanedMember.avatar);
						cleanedMember.avatar = '';
					}

					// ソーシャルリンクをクリーンアップ
					if (cleanedMember.social) {
						cleanedMember.social = {
							twitter: typeof cleanedMember.social.twitter === 'string' ? cleanedMember.social.twitter : '',
							linkedin: typeof cleanedMember.social.linkedin === 'string' ? cleanedMember.social.linkedin : '',
							github: typeof cleanedMember.social.github === 'string' ? cleanedMember.social.github : ''
						};
					}

					return cleanedMember;
				});
			}
			// testimonialsのavatarをクリーンアップ
			if (cleanedSection.content.testimonials && Array.isArray(cleanedSection.content.testimonials)) {
				cleanedSection.content.testimonials = cleanedSection.content.testimonials.map((testimonial: any, testimonialIndex: number) => {
					if (testimonial.avatar && typeof testimonial.avatar !== 'string') {
						console.log(`Section ${index} (${cleanedSection.type}): testimonial[${testimonialIndex}].avatar is object, cleaning...`, testimonial.avatar);
						return {
							...testimonial,
							avatar: ''
						};
					}
					return testimonial;
				});
			}
			// galleryの画像リンクをクリーンアップ
			if (cleanedSection.content.images && Array.isArray(cleanedSection.content.images)) {
				cleanedSection.content.images = cleanedSection.content.images.map((img: any) => {
					if (typeof img === 'string') {
						return img;
					}
					return typeof img?.url === 'string' ? img.url : '';
				});
			}
			// 2カラムセクションの画像URLをクリーンアップ
			if (cleanedSection.content.imageColumn?.imageUrl && typeof cleanedSection.content.imageColumn.imageUrl !== 'string') {
				console.log(`Section ${index} (${cleanedSection.type}): imageColumn.imageUrl is object, cleaning...`, cleanedSection.content.imageColumn.imageUrl);
				cleanedSection.content.imageColumn.imageUrl = '';
			}
			// 2カラムセクションの動画URLをクリーンアップ
			if (cleanedSection.content.videoColumn?.videoUrl && typeof cleanedSection.content.videoColumn.videoUrl !== 'string') {
				console.log(`Section ${index} (${cleanedSection.type}): videoColumn.videoUrl is object, cleaning...`, cleanedSection.content.videoColumn.videoUrl);
				cleanedSection.content.videoColumn.videoUrl = '';
			}
			if (cleanedSection.content.videoColumn?.thumbnail && typeof cleanedSection.content.videoColumn.thumbnail !== 'string') {
				console.log(`Section ${index} (${cleanedSection.type}): videoColumn.thumbnail is object, cleaning...`, cleanedSection.content.videoColumn.thumbnail);
				cleanedSection.content.videoColumn.thumbnail = '';
			}
			// 通常の動画URLをクリーンアップ
			if (cleanedSection.content.videoUrl && typeof cleanedSection.content.videoUrl !== 'string') {
				console.log(`Section ${index} (${cleanedSection.type}): videoUrl is object, cleaning...`, cleanedSection.content.videoUrl);
				cleanedSection.content.videoUrl = '';
			}
			if (cleanedSection.content.thumbnail && typeof cleanedSection.content.thumbnail !== 'string') {
				console.log(`Section ${index} (${cleanedSection.type}): thumbnail is object, cleaning...`, cleanedSection.content.thumbnail);
				cleanedSection.content.thumbnail = '';
			}
			// SectionRendererで使われる画像をクリーンアップ
			if (cleanedSection.images) {
				if (cleanedSection.images.leftImage && typeof cleanedSection.images.leftImage !== 'string') {
					console.log(`Section ${index} (${cleanedSection.type}): leftImage is object, cleaning...`, cleanedSection.images.leftImage);
					cleanedSection.images.leftImage = '';
				}
				if (cleanedSection.images.rightImage && typeof cleanedSection.images.rightImage !== 'string') {
					console.log(`Section ${index} (${cleanedSection.type}): rightImage is object, cleaning...`, cleanedSection.images.rightImage);
					cleanedSection.images.rightImage = '';
				}
			}
		}
		// セクションスタイルの背景画像URLをクリーンアップ
		if (cleanedSection.style?.backgroundImage?.url && typeof cleanedSection.style.backgroundImage.url !== 'string') {
			console.log(`Section ${index} (${cleanedSection.type}): style.backgroundImage.url is object, cleaning...`, cleanedSection.style.backgroundImage.url);
			cleanedSection.style.backgroundImage.url = '';
		}
		return cleanedSection;
	});

	// APIキー管理
	let showApiKeyDropdown = false;

	// メール設定管理
	let emailSettings: EmailSetting[] = [];
	let loadingEmailSettings = false;

	// フォームテンプレート管理
	let formTemplates: FormTemplate[] = [];
	let loadingFormTemplates = false;

	// トグル状態を管理（セクションインデックスごと）
	let expandedSections: Set<number> = new Set();
	let expandedColorSettings: Set<number> = new Set(); // 色設定のトグル状態
	let expandedBackgroundImageSettings: Set<number> = new Set(); // 背景画像設定のトグル状態
	let columnLayout: '1-column' | '2-column' | '3-column' | 'contact' = '1-column'; // レイアウトタブ状態
	let fullWidthPreview = false; // 全幅プレビューモード
	let showBulkColorSettings = false; // 一括色設定パネルの表示状態

	// 一括色設定用の変数
	let bulkTitleColor = '#000000';
	let bulkSubtitleColor = '#666666';
	let bulkDescriptionColor = '#000000';
	let bulkFontFamily = '';

	// トースト通知
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' = 'success';
	let showToast = false;

	function showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
		toastMessage = message;
		toastType = type;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	// メール設定を読み込む
	async function loadEmailSettings() {
		loadingEmailSettings = true;
		try {
			const { data, error } = await supabase
				.from('email_settings')
				.select('*')
				.eq('is_active', true)
				.order('created_at', { ascending: false });

			if (error) throw error;
			emailSettings = data || [];
		} catch (err) {
			console.error('Error loading email settings:', err);
		} finally {
			loadingEmailSettings = false;
		}
	}

	// フォームテンプレートを読み込む
	async function loadFormTemplates() {
		loadingFormTemplates = true;
		try {
			const { data, error } = await supabase
				.from('form_templates')
				.select('*')
				.order('is_default', { ascending: false })
				.order('created_at', { ascending: false });

			if (error) throw error;
			formTemplates = data || [];
		} catch (err) {
			console.error('Error loading form templates:', err);
		} finally {
			loadingFormTemplates = false;
		}
	}

	// テンプレートからフォーム項目を適用
	async function applyFormTemplate(sectionIndex: number, templateId: string) {
		const template = formTemplates.find(t => t.id === templateId);
		if (!template) return;

		const section = sections[sectionIndex];

		// セクションタイプに応じてフィールドを適用
		if (section.type === 'contact') {
			section.content.formFields = JSON.parse(JSON.stringify(template.fields));
		} else if (section.type === 'two_column_text_contact' || section.type === 'two_column_contact_image') {
			if (!section.content.contactColumn) section.content.contactColumn = {};
			section.content.contactColumn.formFields = JSON.parse(JSON.stringify(template.fields));
		}

		sections = [...sections]; // リアクティブ更新（新しい配列を作成）

		// 自動保存
		await saveContent();
	}

	onMount(async () => {
		await loadEmailSettings();
		await loadFormTemplates();
	});

	// ソースコード編集用（セクション毎）
	let sectionSourceCodes: string[] = [];
	let sectionSourceErrors: Map<number, string> = new Map();
	let expandedSourceSections: Set<number> = new Set();

	// 画像ピッカー
	let showImagePicker = false;
	let currentImageTarget: { sectionIndex: number; field: string } | null = null;

	// セクション毎のソースコードを初期化
	$: sectionSourceCodes = sections.map(section =>
		JSON.stringify({
			content: section.content,
			style: section.style || {}
		}, null, 2)
	);

	function toggleSourceSection(index: number) {
		if (expandedSourceSections.has(index)) {
			expandedSourceSections.delete(index);
		} else {
			expandedSourceSections.add(index);
		}
		expandedSourceSections = expandedSourceSections;
	}

	function toggleSection(index: number) {
		if (expandedSections.has(index)) {
			expandedSections.delete(index);
		} else {
			expandedSections.add(index);
		}
		expandedSections = expandedSections;
	}

	function toggleColorSettings(index: number) {
		if (expandedColorSettings.has(index)) {
			expandedColorSettings.delete(index);
		} else {
			expandedColorSettings.add(index);
		}
		expandedColorSettings = expandedColorSettings;
	}

	function toggleBackgroundImageSettings(index: number) {
		if (expandedBackgroundImageSettings.has(index)) {
			expandedBackgroundImageSettings.delete(index);
		} else {
			expandedBackgroundImageSettings.add(index);
		}
		expandedBackgroundImageSettings = expandedBackgroundImageSettings;
	}

	// 一括色設定を全セクションに適用
	function applyBulkColorSettings() {
		sections = sections.map(section => {
			// セクションのcontentにcolorプロパティを追加
			if (section.content) {
				// タイトルがある場合は色を設定
				if (section.content.title !== undefined) {
					section.content.titleColor = bulkTitleColor;
				}
				// サブタイトルがある場合は色を設定
				if (section.content.subtitle !== undefined) {
					section.content.subtitleColor = bulkSubtitleColor;
				}
				// 説明文がある場合は色を設定
				if (section.content.description !== undefined) {
					section.content.descriptionColor = bulkDescriptionColor;
				}
				// フォントファミリーを設定
				if (bulkFontFamily) {
					section.content.fontFamily = bulkFontFamily;
				}

				// 2カラムセクションの場合はtextColumnにも適用
				if (section.content.textColumn) {
					if (section.content.textColumn.title !== undefined) {
						section.content.textColumn.titleColor = bulkTitleColor;
					}
					if (section.content.textColumn.subtitle !== undefined) {
						section.content.textColumn.subtitleColor = bulkSubtitleColor;
					}
					if (section.content.textColumn.description !== undefined) {
						section.content.textColumn.descriptionColor = bulkDescriptionColor;
					}
					if (bulkFontFamily) {
						section.content.textColumn.fontFamily = bulkFontFamily;
					}
				}
			}
			return section;
		});

		showToastMessage('全セクションに色設定を適用しました', 'success');
	}

	// 個別セクション保存
	async function saveSingleSection(index: number) {
		saving = true;
		const contentData: PageContent = { sections };
		const formData = new FormData();
		formData.append('content', JSON.stringify(contentData));

		const response = await fetch('?/updateContent', {
			method: 'POST',
			body: formData
		});

		saving = false;
		if (response.ok) {
			showNotification('セクションを保存しました', 'success');
		}
	}

	// セクションのリセット
	function resetSection(index: number) {
		const section = sections[index];
		if (confirm('このセクションを初期状態に戻しますか？')) {
			sections[index] = {
				...section,
				content: getDefaultContent(section.type)
			};
			sections = sections;
		}
	}

	// サイト情報の取得（ネストされたオブジェクトか配列かの判定）
	$: site = Array.isArray(lp?.sites) ? lp?.sites[0] : lp?.sites;
	$: previewUrl = (site && typeof site === 'object' && 'slug' in site && typeof site.slug === 'string' && lp?.slug && typeof lp.slug === 'string')
		? `/WEBTHQ/${site.slug}/${lp.slug}`
		: '#';

	// セクション削除
	function removeSection(index: number) {
		const removedSection = sections[index];
		sections = sections.filter((_, i) => i !== index);

		// 作業履歴を記録
		recordWorkHistory(
			'section_deleted',
			`${removedSection.type}セクションを削除しました`,
			lp?.id,
			{ sectionType: removedSection.type, sectionId: removedSection.id }
		);

		// 作業セッションにファイル変更を記録
		if ($activeWorkSession) {
			addChangedFile(`LP: ${lp?.title || lp?.id} - ${removedSection.type}セクション削除`);
		}
	}

	// セクション移動
	function moveSection(index: number, direction: 'up' | 'down') {
		const section = sections[index];
		if (direction === 'up' && index > 0) {
			[sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
		} else if (direction === 'down' && index < sections.length - 1) {
			[sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
		}
		sections = sections;

		// 作業履歴を記録
		recordWorkHistory(
			'section_reordered',
			`${section.type}セクションを${direction === 'up' ? '上' : '下'}に移動しました`,
			lp?.id,
			{ sectionType: section.type, sectionId: section.id, direction }
		);

		// 作業セッションにファイル変更を記録
		if ($activeWorkSession) {
			addChangedFile(`LP: ${lp?.title || lp?.id} - セクション並び替え`);
		}
	}

	// 手動でセクション追加
	function addSection(
		type:
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
			| 'style'
			| 'two_column_text_image'
			| 'two_column_image_text'
			| 'two_column_text_video'
			| 'two_column_features_image'
			| 'two_column_text_contact'
			| 'two_column_contact_image'
	) {
		const newSection: Section = {
			id: `section-${Date.now()}`,
			type,
			order: sections.length,
			content: getDefaultContent(type)
		};
		sections = [...sections, newSection];

		// 作業履歴を記録
		recordWorkHistory(
			'section_added',
			`${type}セクションを追加しました`,
			lp?.id,
			{ sectionType: type, sectionId: newSection.id }
		);

		// 作業セッションにファイル変更を記録
		if ($activeWorkSession) {
			addChangedFile(`LP: ${lp?.title || lp?.id} - ${type}セクション追加`);
		}
	}

	function getDefaultContent(type: string) {
		switch (type) {
			case 'hero':
				return {
					title: '新しいヒーローセクション',
					subtitle: 'サブタイトルを入力',
					description: '説明文を入力してください',
					buttonText: 'ボタンテキスト',
					buttonLink: '#'
				};
			case 'features':
				return {
					title: '新しい特徴セクション',
					features: [
						{ iconName: 'Sparkles', title: '特徴1', description: '説明1' },
						{ iconName: 'Zap', title: '特徴2', description: '説明2' },
						{ iconName: 'Award', title: '特徴3', description: '説明3' }
					]
				};
			case 'cta':
				return {
					title: '今すぐ始めよう',
					description: 'CTAの説明文を入力',
					buttonText: '今すぐ登録',
					buttonLink: '#'
				};
			case 'contact':
				return {
					title: 'お問い合わせ',
					description: 'お気軽にお問い合わせください',
					formFields: [
						{ name: 'name', label: 'お名前', type: 'text', required: true },
						{ name: 'email', label: 'メールアドレス', type: 'email', required: true },
						{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true }
					],
					submitButtonText: '送信'
				};
			case 'pricing':
				return {
					title: '料金プラン',
					subtitle: 'あなたに最適なプランをお選びください',
					plans: [
						{
							name: 'ベーシック',
							price: '¥9,800',
							period: '月',
							description: '小規模チーム向け',
							features: ['機能1', '機能2', '機能3'],
							buttonText: '始める',
							buttonLink: '#'
						},
						{
							name: 'プロ',
							price: '¥19,800',
							period: '月',
							description: '成長企業向け',
							features: ['機能1', '機能2', '機能3', '機能4', '機能5'],
							highlighted: true,
							buttonText: '始める',
							buttonLink: '#'
						},
						{
							name: 'エンタープライズ',
							price: 'お問い合わせ',
							description: '大規模組織向け',
							features: ['全機能', 'カスタムサポート', '専用担当者'],
							buttonText: 'お問い合わせ',
							buttonLink: '#'
						}
					]
				};
			case 'testimonials':
				return {
					title: 'お客様の声',
					subtitle: '多くの企業に選ばれています',
					testimonials: [
						{
							name: '山田太郎',
							position: 'CEO',
							company: '株式会社サンプル',
							content: '素晴らしいサービスです。導入後、業務効率が大幅に向上しました。',
							rating: 5
						},
						{
							name: '佐藤花子',
							position: 'マーケティング責任者',
							company: '株式会社テスト',
							content: '使いやすく、サポートも充実しています。おすすめです。',
							rating: 5
						}
					]
				};
			case 'faq':
				return {
					title: 'よくある質問',
					subtitle: 'お客様からよくいただく質問をまとめました',
					items: [
						{
							question: 'サービスの利用開始方法は？',
							answer: 'アカウント登録後、すぐにご利用いただけます。'
						},
						{
							question: '無料トライアルはありますか？',
							answer: 'はい、14日間の無料トライアルをご用意しています。'
						},
						{
							question: 'サポート体制について教えてください',
							answer: 'メール・チャットで平日10:00-18:00にサポートいたします。'
						}
					]
				};
			case 'team':
				return {
					title: '私たちのチーム',
					subtitle: '情熱を持ったメンバーが揃っています',
					members: [
						{
							name: '山田太郎',
							position: 'CEO',
							bio: 'テクノロジーで世界を変える。'
						},
						{
							name: '佐藤花子',
							position: 'CTO',
							bio: '最高の技術でサービスを支える。'
						}
					]
				};
			case 'stats':
				return {
					title: '数字で見る実績',
					subtitle: '多くのお客様に信頼されています',
					stats: [
						{ value: '10,000+', label: '導入企業数', description: '国内シェアNo.1' },
						{ value: '99.9%', label: '稼働率', description: '安定したサービス' },
						{ value: '24/7', label: 'サポート', description: 'いつでもお手伝い' }
					]
				};
			case 'gallery':
				return {
					title: 'ギャラリー',
					subtitle: '私たちの作品をご覧ください',
					images: []
				};
			case 'video':
				return {
					title: '動画で見る',
					subtitle: 'サービス紹介動画',
					videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
					videoType: 'youtube' as const,
					description: '1分でわかるサービス紹介'
				};
			case 'newsletter':
				return {
					title: 'ニュースレター登録',
					description: '最新情報をお届けします',
					placeholder: 'メールアドレスを入力',
					buttonText: '登録する',
					privacyText: 'プライバシーポリシーに同意の上、登録してください'
				};
			case 'style':
				return {
					title: '新しいスタイルセクション',
					description: 'カスタムスタイルとレイアウトを設定できます'
				};
			case 'two_column_text_image':
				return {
					textColumn: {
						title: '新しい2カラムセクション',
						subtitle: 'サブタイトルを入力',
						description: '左側のテキストコンテンツを入力してください。サービスの特徴や詳細な説明を記載できます。',
						buttonText: '詳しく見る',
						buttonLink: '#'
					},
					imageColumn: {
						imageUrl: '',
						imageAlt: '画像の説明',
						caption: ''
					},
					layout: {
						ratio: '50-50' as const
					}
				};
			case 'two_column_image_text':
				return {
					imageColumn: {
						imageUrl: '',
						imageAlt: '画像の説明',
						caption: ''
					},
					textColumn: {
						title: '新しい2カラムセクション',
						subtitle: 'サブタイトルを入力',
						description: '右側のテキストコンテンツを入力してください。サービスの特徴や詳細な説明を記載できます。',
						buttonText: '詳しく見る',
						buttonLink: '#'
					},
					layout: {
						ratio: '50-50' as const
					}
				};
			case 'two_column_text_video':
				return {
					textColumn: {
						title: '動画で見るサービス紹介',
						subtitle: 'サブタイトルを入力',
						description: '左側のテキストコンテンツを入力してください。動画の補足説明や詳細情報を記載できます。',
						buttonText: '詳しく見る',
						buttonLink: '#'
					},
					videoColumn: {
						videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
						videoType: 'youtube' as const,
						thumbnail: ''
					},
					layout: {
						ratio: '50-50' as const
					}
				};
			case 'two_column_features_image':
				return {
					featuresColumn: {
						title: 'サービスの特徴',
						subtitle: '選ばれる理由',
						features: [
							{ iconName: 'Check', title: '特徴1', description: '詳細な説明を入力' },
							{ iconName: 'Check', title: '特徴2', description: '詳細な説明を入力' },
							{ iconName: 'Check', title: '特徴3', description: '詳細な説明を入力' }
						]
					},
					imageColumn: {
						imageUrl: '',
						imageAlt: '画像の説明',
						caption: ''
					},
					layout: {
						ratio: '50-50' as const
					}
				};
			case 'two_column_text_contact':
				return {
					textColumn: {
						title: 'お問い合わせ',
						subtitle: 'お気軽にご連絡ください',
						description: 'サービスに関するご質問や資料請求など、お気軽にお問い合わせください。担当者より折り返しご連絡いたします。'
					},
					contactColumn: {
						formFields: [
							{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
							{ name: 'email', label: 'メールアドレス', type: 'email', required: true, placeholder: 'yamada@example.com' },
							{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true, placeholder: 'お問い合わせ内容をご記入ください' }
						],
						submitButtonText: '送信する',
						useDedicatedPage: false
					},
					layout: {
						ratio: '50-50' as const
					}
				};
			case 'two_column_contact_image':
				return {
					contactColumn: {
						formFields: [
							{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
							{ name: 'email', label: 'メールアドレス', type: 'email', required: true, placeholder: 'yamada@example.com' },
							{ name: 'company', label: '会社名', type: 'text', required: false, placeholder: '株式会社サンプル' },
							{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true, placeholder: 'お問い合わせ内容をご記入ください' }
						],
						submitButtonText: '送信する',
						useDedicatedPage: false
					},
					imageColumn: {
						imageUrl: '',
						imageAlt: 'お問い合わせイメージ',
						caption: ''
					},
					layout: {
						ratio: '50-50' as const
					}
				};
			default:
				return {};
		}
	}

	// 保存
	async function saveContent() {
		saving = true;

		// buttonLinkを安全に文字列に変換
		const cleanedSections = sections.map(section => {
			const cleanedSection = { ...section };
			if (cleanedSection.content) {
				// 直接buttonLinkがある場合
				if (cleanedSection.content.buttonLink && typeof cleanedSection.content.buttonLink !== 'string') {
					cleanedSection.content.buttonLink = '#';
				}
				// textColumnにbuttonLinkがある場合
				if (cleanedSection.content.textColumn?.buttonLink && typeof cleanedSection.content.textColumn.buttonLink !== 'string') {
					cleanedSection.content.textColumn.buttonLink = '#';
				}
				// plansにbuttonLinkがある場合（Pricingセクション）
				if (cleanedSection.content.plans && Array.isArray(cleanedSection.content.plans)) {
					cleanedSection.content.plans = cleanedSection.content.plans.map((plan: any) => ({
						...plan,
						buttonLink: typeof plan.buttonLink === 'string' ? plan.buttonLink : '#'
					}));
				}
			}
			return cleanedSection;
		});

		const contentData: PageContent = { sections: cleanedSections };
		const formData = new FormData();
		formData.append('content', JSON.stringify(contentData));

		const response = await fetch('?/updateContent', {
			method: 'POST',
			body: formData
		});

		saving = false;
		if (response.ok) {
			showNotification('保存しました', 'success');

			// 作業履歴を記録
			recordWorkHistory(
				'content_saved',
				`LPコンテンツを保存しました（${sections.length}セクション）`,
				lp?.id,
				{ sectionCount: sections.length }
			);

			// 作業セッションにファイル変更を記録
			if ($activeWorkSession) {
				addChangedFile(`src/routes/dashboard/landing-pages/${lp?.id}/edit`);
			}
		} else {
			showNotification('保存に失敗しました', 'error');
		}
	}

	// セクション毎のソースコードから保存
	async function saveSectionSource(index: number) {
		// エラーをクリア
		sectionSourceErrors.delete(index);
		sectionSourceErrors = sectionSourceErrors;

		try {
			const parsed = JSON.parse(sectionSourceCodes[index]);

			// バリデーション: contentが必須
			if (!parsed.content) {
				sectionSourceErrors.set(index, 'contentフィールドは必須です');
				sectionSourceErrors = sectionSourceErrors;
				return;
			}

			// バリデーション: styleは省略可能だがオブジェクトである必要がある
			if (parsed.style && typeof parsed.style !== 'object') {
				sectionSourceErrors.set(index, 'styleフィールドはオブジェクト形式である必要があります');
				sectionSourceErrors = sectionSourceErrors;
				return;
			}

			// セクションの構造的な部分は維持し、contentとstyleのみ更新
			sections[index] = {
				...sections[index],
				content: parsed.content,
				style: parsed.style || sections[index].style
			};

			// 変更を反映
			sections = sections;

			// サーバーに保存
			await saveContent();

			showNotification(`セクション ${index + 1} を保存しました`, 'success');
		} catch (e: any) {
			sectionSourceErrors.set(index, `JSON解析エラー: ${e.message}`);
			sectionSourceErrors = sectionSourceErrors;
		}
	}

	// 画像選択モーダル
	function openImagePicker(sectionIndex: number, field: string) {
		currentImageTarget = { sectionIndex, field };
		showImagePicker = true;
	}

	function handleImageSelect(url: string) {
		if (!currentImageTarget) return;

		const { sectionIndex, field } = currentImageTarget;
		const section = sections[sectionIndex];

		// 背景画像の場合は style.backgroundImage.url に設定
		if (field === 'style.backgroundImage.url') {
			if (!section.style) section.style = {};
			if (!section.style.backgroundImage) {
				section.style.backgroundImage = {
					url: url,
					opacity: 50,
					positionX: '50%',
					positionY: '50%',
					size: 'cover',
					repeat: 'no-repeat',
					rotation: 0
				};
			} else {
				section.style.backgroundImage.url = url;
			}
		} else {
			// 通常のフィールドパス処理
			const parts = field.split('.');
			let target: any = section.content;

			for (let i = 0; i < parts.length - 1; i++) {
				target = target[parts[i]];
			}

			target[parts[parts.length - 1]] = url;
		}

		sections = sections;
		showImagePicker = false;
		currentImageTarget = null;
	}

	// ドラッグ&ドロップハンドラー
	const flipDurationMs = 200;
	function handleDndConsider(e: CustomEvent) {
		sections = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent) {
		sections = e.detail.items;
		// orderプロパティを更新
		sections = sections.map((section, index) => ({
			...section,
			order: index
		}));
	}

	// テンプレート保存
	let showTemplateModal = false;
	let templateName = '';
	let templateDescription = '';
	let savingTemplate = false;

	function openTemplateModal() {
		showTemplateModal = true;
		templateName = lp?.title + 'のテンプレート';
		templateDescription = '';
	}

	async function saveAsTemplate() {
		if (!templateName.trim()) {
			showNotification('テンプレート名を入力してください', 'error');
			return;
		}

		savingTemplate = true;
		const formData = new FormData();
		formData.append('templateName', templateName);
		formData.append('templateDescription', templateDescription);

		const response = await fetch('?/saveAsTemplate', {
			method: 'POST',
			body: formData
		});

		savingTemplate = false;
		if (response.ok) {
			showNotification('テンプレートとして保存しました', 'success');
			showTemplateModal = false;
			templateName = '';
			templateDescription = '';
		} else {
			const result = await response.json();
			showNotification(result.message || 'テンプレートの保存に失敗しました', 'error');
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- ヘッダー -->
	<div class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="px-6 py-4">
			<div class="flex items-center justify-between">
				<div>
					<a
						href="/dashboard/landing-pages"
						class="text-pink-600 hover:underline text-sm mb-2 inline-block"
					>
						← LP一覧に戻る
					</a>
					<h1 class="text-2xl font-bold text-gray-800">{lp?.title || '無題のLP'}</h1>
					<p class="text-sm text-gray-500">
						{site?.name || 'サイト名'} / {lp?.lp_type === 'product_lp' ? '商品LP' : lp?.lp_type === 'benefit_page' ? '特典ページ' : 'ホワイトペーパー'}
					</p>
				</div>

				<div class="flex items-center gap-4">
					<!-- ステータス表示 -->
					<span
						class="px-3 py-1 rounded-full text-sm font-semibold {currentStatus === 'published'
							? 'bg-green-100 text-green-700'
							: currentStatus === 'archived'
								? 'bg-amber-100 text-amber-700'
								: 'bg-gray-100 text-gray-700'}"
					>
						{currentStatus === 'published'
							? '公開中'
							: currentStatus === 'archived'
								? 'アーカイブ'
								: '下書き'}
					</span>

					<!-- 保存ボタン -->
					<button
						on:click={saveContent}
						disabled={saving}
						class="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50"
					>
						{saving ? '保存中...' : '保存'}
					</button>

					<!-- 一括色設定ボタン -->
					<button
						on:click={() => showBulkColorSettings = !showBulkColorSettings}
						class="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-sm flex items-center gap-2"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
						一括色設定
					</button>

					<!-- デバッグボタン（一時的） -->
					<button
						on:click={() => {
							console.log('=== Current Sections Data ===');
							console.log(JSON.stringify(sections, null, 2));
							sections.forEach((section, index) => {
								console.log(`\n=== Section ${index} (${section.type}) ===`);
								console.log('Background Image:', section.style?.backgroundImage);
							});
						}}
						class="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition text-sm"
					>
						デバッグ情報
					</button>

					<!-- プレビューボタン -->
					{#if currentStatus === 'published'}
						<a
							href={previewUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
						>
							公開ページを見る
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- メインコンテンツ: 2カラムレイアウト -->
	<div class="flex h-[calc(100vh-120px)]">
		<!-- 左側: 編集UI（セクション一覧） -->
		<div class="w-1/2 overflow-y-auto bg-white border-r border-gray-200">
			<div class="p-6 space-y-6">
				<!-- セクション一覧 -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-gray-800">セクション一覧</h2>
						<p class="text-xs text-gray-500">ドラッグ&ドロップで並び替え</p>
					</div>

					<!-- 一括色設定パネル -->
					{#if showBulkColorSettings}
						<div class="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4">
							<div class="flex items-center justify-between mb-3">
								<h3 class="text-base font-bold text-purple-900">🎨 全セクション一括色設定</h3>
								<button on:click={() => showBulkColorSettings = false} class="text-gray-500 hover:text-gray-700">✕</button>
							</div>

							<div class="grid grid-cols-2 gap-3 mb-3">
								<div>
									<label class="block text-xs font-semibold text-purple-900 mb-1">タイトル色</label>
									<div class="flex gap-1">
										<input type="color" bind:value={bulkTitleColor} class="w-10 h-10 rounded border border-purple-300"/>
										<input type="text" bind:value={bulkTitleColor} placeholder="#000000" class="flex-1 px-2 py-1 border border-purple-300 rounded text-xs font-mono"/>
									</div>
								</div>
								<div>
									<label class="block text-xs font-semibold text-purple-900 mb-1">サブタイトル色</label>
									<div class="flex gap-1">
										<input type="color" bind:value={bulkSubtitleColor} class="w-10 h-10 rounded border border-purple-300"/>
										<input type="text" bind:value={bulkSubtitleColor} placeholder="#666666" class="flex-1 px-2 py-1 border border-purple-300 rounded text-xs font-mono"/>
									</div>
								</div>
								<div>
									<label class="block text-xs font-semibold text-purple-900 mb-1">説明文色</label>
									<div class="flex gap-1">
										<input type="color" bind:value={bulkDescriptionColor} class="w-10 h-10 rounded border border-purple-300"/>
										<input type="text" bind:value={bulkDescriptionColor} placeholder="#000000" class="flex-1 px-2 py-1 border border-purple-300 rounded text-xs font-mono"/>
									</div>
								</div>
								<div>
									<label class="block text-xs font-semibold text-purple-900 mb-1">フォント</label>
									<select bind:value={bulkFontFamily} class="w-full px-2 py-2 border border-purple-300 rounded text-xs">
										<option value="">デフォルト</option>
										<option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
										<option value="'Noto Serif JP', serif">Noto Serif JP</option>
									</select>
								</div>
							</div>

							<button
								on:click={applyBulkColorSettings}
								class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
							>
								全セクションに適用
							</button>
						</div>
					{/if}

					{#if sections.length === 0}
						<div class="text-center py-12 text-gray-500">
							<div class="mb-2 flex justify-center text-gray-400"><FileText size={64} /></div>
							<p>セクションがありません</p>
							<p class="text-sm">AIアシスタントに「ヒーローセクションを追加して」のように指示してください</p>
						</div>
					{:else}
						<div
							use:dndzone={{ items: sections, flipDurationMs, type: 'sections' }}
							on:consider={handleDndConsider}
							on:finalize={handleDndFinalize}
							class="space-y-4"
						>
							{#each sections as section, i (section.id)}
								<div animate:flip={{ duration: flipDurationMs }} class="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
									<!-- セクションヘッダー -->
									<div class="flex items-center">
										<!-- ドラッグハンドル -->
										<div class="px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition">
											<GripVertical size={20} class="text-gray-400" />
										</div>
										<!-- セクションタイトルボタン -->
										<button
											on:click={() => toggleSection(i)}
											class="flex-1 px-4 py-3 flex items-center justify-between hover:bg-gray-50"
										>
											<span class="font-semibold text-gray-800">{section.type}セクション</span>
											<ChevronDown
												size={20}
												class="text-gray-400 transition-transform {expandedSections.has(i) ? 'rotate-180' : ''}"
											/>
										</button>
									</div>

							<!-- セクション編集エリア（展開時のみ） -->
							{#if expandedSections.has(i)}
								<div class="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
									<!-- アクションボタン -->
									<div class="flex items-center justify-between">
										<div class="flex gap-2">
											<button
												on:click={() => moveSection(i, 'up')}
												disabled={i === 0}
												class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-30"
											>
												↑ 上へ
											</button>
											<button
												on:click={() => moveSection(i, 'down')}
												disabled={i === sections.length - 1}
												class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-30"
											>
												↓ 下へ
											</button>
										</div>
										<div class="flex gap-2">
											<button
												on:click={() => saveSingleSection(i)}
												disabled={saving}
												class="px-3 py-1 text-sm border border-green-300 text-green-600 rounded hover:bg-green-50 disabled:opacity-50"
											>
												保存
											</button>
											<button
												on:click={() => resetSection(i)}
												class="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
											>
												リセット
											</button>
											<button
												on:click={() => removeSection(i)}
												class="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
											>
												削除
											</button>
										</div>
									</div>

									<!-- 基本スタイル設定（色のみ） -->
									<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
										<button
											on:click={() => toggleColorSettings(i)}
											class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
										>
											<div class="flex items-center gap-2">
												<Palette size={18} class="text-pink-600" />
												<h4 class="font-semibold text-sm">色設定</h4>
											</div>
											<ChevronDown
												size={16}
												class="text-gray-400 transition-transform {expandedColorSettings.has(i) ? 'rotate-180' : ''}"
											/>
										</button>

										{#if expandedColorSettings.has(i)}
											<div class="border-t border-gray-200 p-4 space-y-3">
												<!-- 背景色 -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">背景色</label>
													<div class="flex items-center gap-2">
														<input
															type="color"
															value={section.style?.backgroundColor || '#ffffff'}
															on:input={(e) => {
																if (!section.style) section.style = {};
																section.style.backgroundColor = e.target.value;
																sections = sections;
															}}
															class="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
														/>
														<input
															type="text"
															value={section.style?.backgroundColor || '#ffffff'}
															on:input={(e) => {
																const value = e.target.value;
																if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
																	if (!section.style) section.style = {};
																	section.style.backgroundColor = value;
																	sections = sections;
																}
															}}
															placeholder="#ffffff"
															class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono uppercase"
														/>
													</div>
												</div>

												<!-- テキスト色 -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">テキスト色</label>
													<div class="flex items-center gap-2">
														<input
															type="color"
															value={section.style?.textColor || '#000000'}
															on:input={(e) => {
																if (!section.style) section.style = {};
																section.style.textColor = e.target.value;
																sections = sections;
															}}
															class="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
														/>
														<input
															type="text"
															value={section.style?.textColor || '#000000'}
															on:input={(e) => {
																const value = e.target.value;
																if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
																	if (!section.style) section.style = {};
																	section.style.textColor = value;
																	sections = sections;
																}
															}}
															placeholder="#000000"
															class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono uppercase"
														/>
													</div>
												</div>
											</div>
										{/if}
									</div>

									<!-- 背景画像設定 -->
									<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
										<button
											on:click={() => toggleBackgroundImageSettings(i)}
											class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
										>
											<div class="flex items-center gap-2">
												<ImageIcon size={18} class="text-blue-600" />
												<h4 class="font-semibold text-sm">背景画像設定</h4>
											</div>
											<ChevronDown
												size={16}
												class="text-gray-400 transition-transform {expandedBackgroundImageSettings.has(i) ? 'rotate-180' : ''}"
											/>
										</button>

										{#if expandedBackgroundImageSettings.has(i)}
											<div class="border-t border-gray-200 p-4 space-y-3">
												<!-- 画像URL -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">背景画像</label>
													<div class="flex gap-2">
														<input
															type="text"
															value={section.style?.backgroundImage?.url || ''}
															on:input={(e) => {
																if (!section.style) section.style = {};
																if (!section.style.backgroundImage) {
																	section.style.backgroundImage = {
																		url: e.target.value,
																		opacity: 50,
																		positionX: '50%',
																		positionY: '50%',
																		size: 'cover',
																		repeat: 'no-repeat',
																		rotation: 0
																	};
																} else {
																	section.style.backgroundImage.url = e.target.value;
																}
																sections = sections;
															}}
															placeholder="https://..."
															class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
														/>
														<button
															on:click={() => openImagePicker(i, 'style.backgroundImage.url')}
															class="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
														>
															画像を選択
														</button>
													</div>
													{#if section.style?.backgroundImage?.url && typeof section.style.backgroundImage.url === 'string'}
														<div class="mt-2">
															<img
																src={section.style.backgroundImage.url}
																alt="背景画像プレビュー"
																class="w-full h-24 object-cover rounded border border-gray-300"
															/>
														</div>
													{/if}
												</div>

												<!-- 透過度 -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">
														透過度: {section.style?.backgroundImage?.opacity || 50}%
													</label>
													<input
														type="range"
														min="0"
														max="100"
														value={section.style?.backgroundImage?.opacity || 50}
														on:input={(e) => {
															if (!section.style) section.style = {};
															if (!section.style.backgroundImage) {
																section.style.backgroundImage = {
																	url: '',
																	opacity: parseInt(e.target.value),
																	positionX: '50%',
																	positionY: '50%',
																	size: 'cover',
																	repeat: 'no-repeat',
																	rotation: 0
																};
															} else {
																section.style.backgroundImage.opacity = parseInt(e.target.value);
															}
															sections = sections;
														}}
														class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
													/>
													<div class="flex justify-between text-xs text-gray-500 mt-1">
														<span>透明 (0%)</span>
														<span>不透明 (100%)</span>
													</div>
												</div>

												<!-- 画像サイズ -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">
														画像サイズ: {section.style?.backgroundImage?.size || '100%'}
													</label>
													<input
														type="range"
														min="10"
														max="300"
														value={parseInt((section.style?.backgroundImage?.size || '100%').replace('%', ''))}
														on:input={(e) => {
															const value = `${e.target.value}%`;
															if (!section.style) section.style = {};
															if (!section.style.backgroundImage) {
																section.style.backgroundImage = {
																	url: '',
																	opacity: 50,
																	positionX: '50%',
																	positionY: '50%',
																	size: value,
																	repeat: 'no-repeat',
																	rotation: 0
																};
															} else {
																section.style.backgroundImage.size = value;
															}
															sections = sections;
														}}
														class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
													/>
													<div class="flex justify-between text-xs text-gray-500 mt-1">
														<span>縮小 (10%)</span>
														<span>等倍 (100%)</span>
														<span>拡大 (300%)</span>
													</div>
												</div>

												<!-- 画像リピート -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">画像の繰り返し</label>
													<select
														value={section.style?.backgroundImage?.repeat || 'no-repeat'}
														on:change={(e) => {
															if (!section.style) section.style = {};
															if (!section.style.backgroundImage) {
																section.style.backgroundImage = {
																	url: '',
																	opacity: 50,
																	positionX: '50%',
																	positionY: '50%',
																	size: 'cover',
																	repeat: e.target.value,
																	rotation: 0
																};
															} else {
																section.style.backgroundImage.repeat = e.target.value;
															}
															sections = sections;
														}}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													>
														<option value="no-repeat">繰り返しなし</option>
														<option value="repeat">両方向に繰り返し</option>
														<option value="repeat-x">横方向のみ繰り返し</option>
														<option value="repeat-y">縦方向のみ繰り返し</option>
													</select>
												</div>

												<!-- 詳細位置調整（X軸・Y軸） -->
												<div class="border-t border-gray-200 pt-3">
													<label class="block text-xs font-medium text-gray-700 mb-2">詳細位置調整</label>

													<!-- X軸位置 -->
													<div class="mb-3">
														<label class="block text-xs text-gray-600 mb-2">
															X軸位置: {section.style?.backgroundImage?.positionX || '50%'}
														</label>
														<input
															type="range"
															min="-100"
															max="200"
															value={parseInt((section.style?.backgroundImage?.positionX || '50%').replace('%', ''))}
															on:input={(e) => {
																const value = `${e.target.value}%`;
																if (!section.style) section.style = {};
																if (!section.style.backgroundImage) {
																	section.style.backgroundImage = {
																		url: '',
																		opacity: 50,
																		positionX: value,
																		positionY: '50%',
																		size: 'cover',
																		repeat: 'no-repeat',
																		rotation: 0
																	};
																} else {
																	section.style.backgroundImage.positionX = value;
																}
																sections = sections;
															}}
															class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
														/>
														<div class="flex justify-between text-xs text-gray-500 mt-1">
															<span>左端外 (-100%)</span>
															<span>中央 (50%)</span>
															<span>右端外 (200%)</span>
														</div>
													</div>

													<!-- Y軸位置 -->
													<div class="mb-3">
														<label class="block text-xs text-gray-600 mb-2">
															Y軸位置: {section.style?.backgroundImage?.positionY || '50%'}
														</label>
														<input
															type="range"
															min="-100"
															max="200"
															value={parseInt((section.style?.backgroundImage?.positionY || '50%').replace('%', ''))}
															on:input={(e) => {
																const value = `${e.target.value}%`;
																if (!section.style) section.style = {};
																if (!section.style.backgroundImage) {
																	section.style.backgroundImage = {
																		url: '',
																		opacity: 50,
																		positionX: '50%',
																		positionY: value,
																		size: 'cover',
																		repeat: 'no-repeat',
																		rotation: 0
																	};
																} else {
																	section.style.backgroundImage.positionY = value;
																}
																sections = sections;
															}}
															class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
														/>
														<div class="flex justify-between text-xs text-gray-500 mt-1">
															<span>上端外 (-100%)</span>
															<span>中央 (50%)</span>
															<span>下端外 (200%)</span>
														</div>
													</div>

													<!-- 手動入力（細かい調整用） -->
													<details class="mt-2">
														<summary class="text-xs text-blue-600 cursor-pointer hover:text-blue-800">手動で入力（詳細調整）</summary>
														<div class="grid grid-cols-2 gap-2 mt-2">
															<div>
																<label class="block text-xs text-gray-600 mb-1">X軸（カスタム）</label>
																<input
																	type="text"
																	value={section.style?.backgroundImage?.positionX || '50%'}
																	on:input={(e) => {
																		if (!section.style) section.style = {};
																		if (!section.style.backgroundImage) {
																			section.style.backgroundImage = {
																				url: '',
																				opacity: 50,
																				positionX: e.target.value,
																				positionY: '50%',
																				size: 'cover',
																				repeat: 'no-repeat',
																				rotation: 0
																			};
																		} else {
																			section.style.backgroundImage.positionX = e.target.value;
																		}
																		sections = sections;
																	}}
																	placeholder="50%, 100px, -20px"
																	class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
																/>
															</div>
															<div>
																<label class="block text-xs text-gray-600 mb-1">Y軸（カスタム）</label>
																<input
																	type="text"
																	value={section.style?.backgroundImage?.positionY || '50%'}
																	on:input={(e) => {
																		if (!section.style) section.style = {};
																		if (!section.style.backgroundImage) {
																			section.style.backgroundImage = {
																				url: '',
																				opacity: 50,
																				positionX: '50%',
																				positionY: e.target.value,
																				size: 'cover',
																				repeat: 'no-repeat',
																				rotation: 0
																			};
																		} else {
																			section.style.backgroundImage.positionY = e.target.value;
																		}
																		sections = sections;
																	}}
																	placeholder="50%, 100px, -20px"
																	class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
																/>
															</div>
														</div>
													</details>
												</div>

												<!-- 向きの角度 -->
												<div class="border-t border-gray-200 pt-3">
													<label class="block text-xs font-medium text-gray-700 mb-2">
														向きの角度: {section.style?.backgroundImage?.rotation || 0}°
													</label>
													<input
														type="range"
														min="-180"
														max="180"
														value={section.style?.backgroundImage?.rotation || 0}
														on:input={(e) => {
															if (!section.style) section.style = {};
															if (!section.style.backgroundImage) {
																section.style.backgroundImage = {
																	url: '',
																	opacity: 50,
																	positionX: '50%',
																	positionY: '50%',
																	size: '100%',
																	repeat: 'no-repeat',
																	rotation: parseInt(e.target.value)
																};
															} else {
																section.style.backgroundImage.rotation = parseInt(e.target.value);
															}
															sections = sections;
														}}
														class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
													/>
													<div class="flex justify-between text-xs text-gray-500 mt-1">
														<span>-180° (左)</span>
														<span>-90° (左向き)</span>
														<span>0° (通常)</span>
														<span>90° (右向き)</span>
														<span>180° (右)</span>
													</div>
												</div>

												<!-- 背景画像設定リセットボタン -->
												{#if section.style?.backgroundImage}
													<button
														on:click={() => {
															if (section.style && section.style.backgroundImage) {
																section.style.backgroundImage = {
																	url: '',
																	opacity: 50,
																	positionX: '50%',
																	positionY: '50%',
																	size: '100%',
																	repeat: 'no-repeat',
																	rotation: 0
																};
																sections = sections;
															}
														}}
														class="w-full px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"
													>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
															<path d="M21 3v5h-5"/>
															<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
															<path d="M8 16H3v5"/>
														</svg>
														すべての設定をリセット
													</button>
												{/if}
											</div>
										{/if}
									</div>

									<!-- コンテンツ編集（セクションタイプ別） -->
									<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
										<div class="flex items-center gap-2 mb-2">
											<FileText size={18} class="text-blue-600" />
											<h4 class="font-semibold text-sm">コンテンツ編集</h4>
										</div>

										<!-- Hero Section -->
										{#if section.type === 'hero'}
											<div class="space-y-4">
												<!-- タイトル -->
												<div class="p-2 border rounded-lg bg-white">
													<div class="flex items-center justify-between mb-3">
														<span class="text-xs font-semibold text-gray-700">タイトル</span>
													</div>
													<input
														type="text"
														bind:value={section.content.title}
														placeholder="タイトル"
														class="w-full px-2 py-1 border rounded text-sm mb-2"
													/>
													<div class="flex items-center gap-2">
														<input
															type="color"
															bind:value={section.content.titleColor}
															class="w-6 h-6 rounded cursor-pointer"
														/>
														<input
															type="text"
															bind:value={section.content.titleColor}
															placeholder="#000000"
															class="w-20 px-1 py-1 border rounded text-xs"
														/>
														<span class="text-xs text-gray-500">色</span>
													</div>
												</div>

												<!-- サブタイトル -->
												<div class="p-2 border rounded-lg bg-white">
													<div class="flex items-center justify-between mb-3">
														<span class="text-xs font-semibold text-gray-700">サブタイトル</span>
													</div>
													<input
														type="text"
														bind:value={section.content.subtitle}
														placeholder="サブタイトル"
														class="w-full px-2 py-1 border rounded text-sm mb-2"
													/>
													<div class="flex items-center gap-2">
														<input
															type="color"
															bind:value={section.content.subtitleColor}
															class="w-6 h-6 rounded cursor-pointer"
														/>
														<input
															type="text"
															bind:value={section.content.subtitleColor}
															placeholder="#666666"
															class="w-20 px-1 py-1 border rounded text-xs"
														/>
														<span class="text-xs text-gray-500">色</span>
													</div>
												</div>

												<!-- 説明文 -->
												<div class="p-2 border rounded-lg bg-white">
													<div class="flex items-center justify-between mb-3">
														<span class="text-xs font-semibold text-gray-700">説明文</span>
													</div>
													<textarea
														bind:value={section.content.description}
														placeholder="説明"
														class="w-full px-2 py-1 border rounded text-sm mb-2"
														rows="3"
													></textarea>
													<div class="flex items-center gap-2">
														<input
															type="color"
															bind:value={section.content.descriptionColor}
															class="w-6 h-6 rounded cursor-pointer"
														/>
														<input
															type="text"
															bind:value={section.content.descriptionColor}
															placeholder="#000000"
															class="w-20 px-1 py-1 border rounded text-xs"
														/>
														<span class="text-xs text-gray-500">色</span>
													</div>
												</div>

												<!-- ボタン設定 -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<button
														on:click={() => {
															const btn = document.getElementById('hero-button-settings-' + section.id);
															if (btn) btn.classList.toggle('hidden');
														}}
														class="w-full flex items-center justify-between text-left"
													>
														<h5 class="text-xs font-semibold text-gray-700">🔘 ボタン設定</h5>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
													</button>
													<div id="hero-button-settings-{section.id}" class="mt-3 space-y-2">
														{#if section.content.buttonText !== undefined || section.content.buttonLink !== undefined}
															<div class="space-y-2">
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンテキスト</label>
																	<input
																		type="text"
																		bind:value={section.content.buttonText}
																		placeholder="ボタンテキスト"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンリンク</label>
																	{#if sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')).length > 0}
																		<div class="mb-2">
																			<label class="block text-xs font-medium text-gray-600 mb-1">クイック選択</label>
																			<select
																				on:change={(e) => {
																					const value = e.currentTarget.value;
																					if (value) {
																						section.content.buttonLink = value;
																						sections = sections;
																					}
																				}}
																				class="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
																			>
																				<option value="">（お問い合わせフォームを選択）</option>
																				{#each sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')) as contactSection, idx}
																					{@const title = contactSection.content.formName || contactSection.content.contactColumn?.formName || contactSection.content.title || contactSection.content.textColumn?.title || 'お問い合わせ'}
																					{@const isInline = !contactSection.content.useDedicatedPage && !contactSection.content.contactColumn?.useDedicatedPage}
																					{@const siteSlug = typeof site?.slug === 'string' ? site.slug : 'site'}
																					{@const lpSlug = typeof lp?.slug === 'string' ? lp.slug : 'lp'}
																					{@const sectionId = typeof contactSection.id === 'string' ? contactSection.id : ''}
																					<option value={isInline ? `#${sectionId}` : `/WEBTHQ/${siteSlug}/${lpSlug}/contact`}>
																						{title} {isInline ? '(ページ内)' : '(専用ページ)'}
																					</option>
																				{/each}
																			</select>
																		</div>
																	{/if}
																	<label class="block text-xs font-medium text-gray-600 mb-1 mt-2">カスタムURL</label>
																	<input
																		type="text"
																		bind:value={section.content.buttonLink}
																		placeholder="ボタンリンク (例: #, /contact)"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<button
																	on:click={() => {
																		section.content.buttonText = undefined;
																		section.content.buttonLink = undefined;
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 bg-red-50 text-red-600 border border-red-300 rounded text-sm font-semibold hover:bg-red-100 transition"
																>
																	ボタンを削除
																</button>
															</div>
														{:else}
															<button
																on:click={() => {
																	section.content.buttonText = 'ボタン';
																	section.content.buttonLink = '#';
																	sections = sections;
																}}
																class="w-full px-2 py-1 bg-green-50 text-green-600 border border-green-300 rounded text-sm font-semibold hover:bg-green-100 transition"
															>
																+ ボタンを追加
															</button>
														{/if}
													</div>
												</div>

												<!-- フォント設定 -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<button
														on:click={() => {
															const fontSettings = document.getElementById('hero-font-settings-' + section.id);
															if (fontSettings) fontSettings.classList.toggle('hidden');
														}}
														class="w-full flex items-center justify-between text-left"
													>
														<h5 class="text-xs font-semibold text-gray-700">🔤 フォント設定</h5>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
													</button>
													<div id="hero-font-settings-{section.id}" class="mt-3 space-y-2 hidden">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">フォントファミリー</label>
															<select
																bind:value={section.content.fontFamily}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															>
																<option value="">デフォルト</option>
																<option value="'Noto Sans JP', sans-serif">Noto Sans JP（ゴシック体）</option>
																<option value="'Noto Serif JP', serif">Noto Serif JP（明朝体）</option>
																<option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded 1c（丸ゴシック）</option>
																<option value="'Zen Kaku Gothic New', sans-serif">Zen Kaku Gothic New（角ゴシック）</option>
																<option value="'Shippori Mincho', serif">Shippori Mincho（明朝体）</option>
																<option value="Arial, sans-serif">Arial</option>
																<option value="'Times New Roman', serif">Times New Roman</option>
																<option value="Georgia, serif">Georgia</option>
																<option value="'Courier New', monospace">Courier New（等幅）</option>
															</select>
														</div>
														<p class="text-xs text-gray-500">※ セクション全体のフォントが変更されます</p>
													</div>
												</div>
											</div>
										{/if}

										<!-- Features Section -->
										{#if section.type === 'features'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">サブタイトル</label>
													<input
														type="text"
														bind:value={section.content.subtitle}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">特徴リスト</label>
													{#each section.content.features as feature, idx}
														<div class="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
															<div class="mb-2">
																<label class="block text-xs font-medium text-gray-600 mb-1">特徴 {idx + 1} - タイトル</label>
																<input
																	type="text"
																	bind:value={feature.title}
																	class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																/>
															</div>
															<div>
																<label class="block text-xs font-medium text-gray-600 mb-1">説明</label>
																<textarea
																	bind:value={feature.description}
																	rows="2"
																	class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																></textarea>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- CTA Section -->
										{#if section.type === 'cta'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">説明文</label>
													<textarea
														bind:value={section.content.description}
														rows="3"
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													></textarea>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">ボタン設定</label>
													{#if section.content.buttonText !== undefined || section.content.buttonLink !== undefined}
														<input
															type="text"
															bind:value={section.content.buttonText}
															placeholder="ボタンテキスト"
															class="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
														/>

														{#if sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')).length > 0}
															<div class="mb-2">
																<label class="block text-xs font-medium text-gray-600 mb-1">クイック選択</label>
																<select
																	on:change={(e) => {
																		const value = e.currentTarget.value;
																		if (value) {
																			section.content.buttonLink = value;
																			sections = sections;
																		}
																	}}
																	class="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
																>
																	<option value="">（お問い合わせフォームを選択）</option>
																	{#each sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')) as contactSection, idx}
																		{@const title = contactSection.content.formName || contactSection.content.contactColumn?.formName || contactSection.content.title || contactSection.content.textColumn?.title || 'お問い合わせ'}
																		{@const isInline = !contactSection.content.useDedicatedPage && !contactSection.content.contactColumn?.useDedicatedPage}
																		{@const siteSlug = typeof site?.slug === 'string' ? site.slug : 'site'}
																		{@const lpSlug = typeof lp?.slug === 'string' ? lp.slug : 'lp'}
																		{@const sectionId = typeof contactSection.id === 'string' ? contactSection.id : ''}
																		<option value={isInline ? `#${sectionId}` : `/WEBTHQ/${siteSlug}/${lpSlug}/contact`}>
																			{title} {isInline ? '(ページ内)' : '(専用ページ)'}
																		</option>
																	{/each}
																</select>
															</div>
														{/if}

														<label class="block text-xs font-medium text-gray-600 mb-1">カスタムURL</label>
														<input
															type="text"
															bind:value={section.content.buttonLink}
															placeholder="ボタンリンク (例: #, /contact)"
															class="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
														/>
														<button
															on:click={() => {
																section.content.buttonText = undefined;
																section.content.buttonLink = undefined;
																sections = sections;
															}}
															class="w-full px-3 py-2 bg-red-50 text-red-600 border border-red-300 rounded text-sm font-semibold hover:bg-red-100 transition"
														>
															ボタンを削除
														</button>
													{:else}
														<button
															on:click={() => {
																section.content.buttonText = 'ボタン';
																section.content.buttonLink = '#';
																sections = sections;
															}}
															class="w-full px-3 py-2 bg-green-50 text-green-600 border border-green-300 rounded text-sm font-semibold hover:bg-green-100 transition"
														>
															+ ボタンを追加
														</button>
													{/if}
												</div>
											</div>
										{/if}

										<!-- Contact Section -->
										{#if section.type === 'contact'}
											<div class="space-y-4">
												<!-- タイトル -->
												<div class="p-2 border rounded-lg bg-white">
													<span class="text-xs font-semibold text-gray-700">タイトル</span>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-2 py-1 border rounded text-sm mb-2"
													/>
													<div class="flex items-center gap-2">
														<input
															type="color"
															bind:value={section.content.titleColor}
															class="w-6 h-6 rounded cursor-pointer"
														/>
														<input
															type="text"
															bind:value={section.content.titleColor}
															placeholder="#000000"
															class="w-20 px-1 py-1 border rounded text-xs"
														/>
														<span class="text-xs text-gray-500">色</span>
													</div>
												</div>

												<!-- 説明文 -->
												<div class="p-2 border rounded-lg bg-white">
													<span class="text-xs font-semibold text-gray-700">説明文</span>
													<textarea
														bind:value={section.content.description}
														rows="3"
														class="w-full px-2 py-1 border rounded text-sm mb-2"
													></textarea>
													<div class="flex items-center gap-2">
														<input
															type="color"
															bind:value={section.content.descriptionColor}
															class="w-6 h-6 rounded cursor-pointer"
														/>
														<input
															type="text"
															bind:value={section.content.descriptionColor}
															placeholder="#666666"
															class="w-20 px-1 py-1 border rounded text-xs"
														/>
														<span class="text-xs text-gray-500">色</span>
													</div>
												</div>

												<!-- 専用ページモード設定 -->
												<div class="p-3 border-2 border-purple-300 rounded-lg bg-purple-50">
													<label class="flex items-center gap-2 cursor-pointer">
														<input
															type="checkbox"
															bind:checked={section.content.useDedicatedPage}
															class="w-4 h-4 text-purple-600 rounded"
														/>
														<span class="text-sm font-semibold text-purple-900">専用ページへのリンクボタン表示モード</span>
													</label>
													<p class="text-xs text-purple-700 mt-1 ml-6">
														ON: /contact ページへのリンクボタンを表示 / OFF: インラインフォームを表示
													</p>
													{#if section.content.useDedicatedPage}
														<div class="mt-2 ml-6">
															<label class="block text-xs font-medium text-purple-900 mb-1">ボタンテキスト</label>
															<input
																type="text"
																bind:value={section.content.dedicatedPageButtonText}
																placeholder="お問い合わせはこちら"
																class="w-full px-2 py-1 border border-purple-300 rounded text-sm"
															/>
														</div>
													{/if}
												</div>

												<!-- フォーム項目設定 -->
												<div class="p-3 border rounded-lg bg-gray-50">
													<h4 class="text-sm font-bold text-gray-900 mb-3">フォーム項目</h4>

													<!-- テンプレート選択 -->
													<div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
														<label class="block text-sm font-medium text-blue-900 mb-2">テンプレートを選択</label>
														{#if loadingFormTemplates}
															<p class="text-xs text-gray-500">読み込み中...</p>
														{:else if formTemplates.length === 0}
															<p class="text-sm text-gray-600">
																テンプレートがありません。
																<a href="/dashboard/form-templates" target="_blank" class="text-blue-600 hover:underline font-medium">
																	テンプレートを作成
																</a>
															</p>
														{:else}
															<select
																class="w-full px-3 py-2 border border-blue-300 rounded text-sm bg-white"
																on:change={(e) => {
																	const templateId = e.currentTarget.value;
																	if (templateId) {
																		applyFormTemplate(i, templateId);
																		e.currentTarget.value = '';
																	}
																}}
															>
																<option value="">テンプレートを選択してください</option>
																{#each formTemplates as template}
																	<option value={template.id}>
																		{template.name}
																		{#if template.is_default}(デフォルト){/if}
																	</option>
																{/each}
															</select>
															<p class="text-xs text-blue-700 mt-2">
																※ フォーム項目を変更する場合は
																<a href="/dashboard/form-templates" target="_blank" class="text-blue-600 hover:underline font-medium">
																	テンプレート管理
																</a>
																から編集してください
															</p>
														{/if}
													</div>

													<!-- 現在のフォーム項目表示（読み取り専用） -->
													{#if !section.content.formFields}
														{section.content.formFields = [
															{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
															{ name: 'email', label: 'メールアドレス', type: 'email', required: true, placeholder: 'yamada@example.com' },
															{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true, placeholder: 'お問い合わせ内容をご記入ください' }
														]}
													{/if}

													<div class="space-y-2">
														<div class="text-xs font-medium text-gray-700 mb-1">現在の項目 ({section.content.formFields.length}個)</div>
														{#each section.content.formFields as field, fieldIndex}
															<div class="p-2 border border-gray-200 rounded bg-white">
																<div class="flex items-center gap-2">
																	<span class="text-xs text-gray-500">#{fieldIndex + 1}</span>
																	<span class="flex-1 text-sm font-medium text-gray-900">{field.label}</span>
																	<span class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{field.type}</span>
																	{#if field.required}
																		<span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">必須</span>
																	{/if}
																</div>
																{#if field.placeholder}
																	<div class="mt-1 text-xs text-gray-500">例: {field.placeholder}</div>
																{/if}
															</div>
														{/each}
													</div>
												</div>

												<!-- 送信ボタンテキスト -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">送信ボタンテキスト</label>
													<input
														type="text"
														bind:value={section.content.submitButtonText}
														placeholder="送信する"
														class="w-full px-2 py-1 border rounded text-sm"
													/>
												</div>

												<!-- 自動返信メール設定 -->
												<div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
													<h4 class="text-sm font-semibold text-blue-900 mb-2">自動返信メール</h4>
													<div class="space-y-2">
														<label class="flex items-center gap-2">
															<input
																type="checkbox"
																bind:checked={section.content.autoReplyEnabled}
																class="w-4 h-4 text-blue-600 rounded"
															/>
															<span class="text-sm text-gray-700">自動返信メールを送信する</span>
														</label>

														{#if section.content.autoReplyEnabled}
															<div>
																<label class="block text-xs font-medium text-gray-700 mb-1">メール設定を選択</label>
																<select
																	bind:value={section.content.autoReplyEmailSettingId}
																	class="w-full px-2 py-1.5 border rounded text-sm bg-white"
																>
																	<option value="">選択してください</option>
																	{#each emailSettings as setting}
																		<option value={setting.id}>{setting.name}</option>
																	{/each}
																</select>
																{#if emailSettings.length === 0}
																	<p class="text-xs text-gray-500 mt-1">
																		メール設定がありません。
																		<a href="/dashboard/email-settings" target="_blank" class="text-blue-600 hover:underline">
																			メール設定を作成
																		</a>
																	</p>
																{/if}
															</div>
														{/if}
													</div>
												</div>

												<!-- フォントファミリー -->
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">フォント</label>
													<select
														bind:value={section.content.fontFamily}
														class="w-full px-2 py-1 border rounded text-sm"
													>
														<option value="">デフォルト</option>
														<option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
														<option value="'Noto Serif JP', serif">Noto Serif JP</option>
														<option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded 1c</option>
														<option value="'Zen Kaku Gothic New', sans-serif">Zen Kaku Gothic New</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- Gallery Section -->
										{#if section.type === 'gallery'}
											<div class="space-y-3">
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
													<input
														type="text"
														bind:value={section.content.title}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-1">サブタイトル</label>
													<input
														type="text"
														bind:value={section.content.subtitle}
														class="w-full px-3 py-2 border border-gray-300 rounded text-sm"
													/>
												</div>
												<div>
													<label class="block text-xs font-medium text-gray-700 mb-2">画像一覧</label>
													<p class="text-xs text-gray-500 mb-2">画像はレスポンシブ対応で表示されます（モバイル: 1列、タブレット: 2列、デスクトップ: 3列）</p>
													{#if !section.content.images}
														{section.content.images = []}
													{/if}
													{#each section.content.images as image, idx}
														<div class="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
															<div class="flex items-center justify-between mb-3">
																<span class="text-xs font-semibold text-gray-700">画像 {idx + 1}</span>
																<button
																	on:click={() => {
																		section.content.images = section.content.images.filter((_, j) => j !== idx);
																		sections = sections;
																	}}
																	class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
																>
																	削除
																</button>
															</div>
															<div class="space-y-2">
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">画像URL</label>
																	<div class="flex gap-2">
																		<input
																			type="text"
																			bind:value={image.url}
																			class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
																			placeholder="https://..."
																		/>
																		<button
																			on:click={() => openImagePicker(i, `images.${idx}.url`)}
																			class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
																		>
																			選択
																		</button>
																	</div>
																</div>
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">Alt テキスト</label>
																	<input
																		type="text"
																		bind:value={image.alt}
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">キャプション（任意）</label>
																	<input
																		type="text"
																		bind:value={image.caption}
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
															</div>
														</div>
													{/each}
													<button
														on:click={() => {
															if (!section.content.images) section.content.images = [];
															section.content.images = [...section.content.images, { url: '', alt: '', caption: '' }];
															sections = sections;
														}}
														class="w-full px-3 py-2 bg-blue-50 text-blue-600 border border-blue-300 rounded text-sm hover:bg-blue-100 transition"
													>
														+ 画像を追加
													</button>
												</div>
											</div>
										{/if}

										<!-- Two Column Text + Image Section -->
										{#if section.type === 'two_column_text_image'}
											<div class="space-y-4">
												<!-- テキストカラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<div class="flex items-center justify-between mb-3">
														<h5 class="text-xs font-semibold text-gray-700">テキストカラム</h5>
														<button
															on:click={() => {
																section.content.textColumn = {
																	title: '',
																	subtitle: '',
																	description: '',
																	buttonText: undefined,
																	buttonLink: undefined
																};
																sections = sections;
															}}
															class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
														>
															リセット
														</button>
													</div>

													<div class="space-y-3">
														<!-- タイトル -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.title !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">タイトル</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.title;
																			delete section.content.textColumn.titleColor;
																			delete section.content.textColumn.titleBold;
																			delete section.content.textColumn.titleItalic;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<input
																	type="text"
																	bind:value={section.content.textColumn.title}
																	placeholder="タイトル"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																/>
																<div class="flex gap-2 items-center">
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.titleBold}
																			class="rounded"
																		/>
																		<span class="font-bold">B</span>
																	</label>
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.titleItalic}
																			class="rounded"
																		/>
																		<span class="italic">I</span>
																	</label>
																	<div class="flex items-center gap-2 ml-auto">
																		<input
																			type="color"
																			bind:value={section.content.textColumn.titleColor}
																			class="w-6 h-6 rounded cursor-pointer"
																		/>
																		<input
																			type="text"
																			bind:value={section.content.textColumn.titleColor}
																			placeholder="#000000"
																			class="w-20 px-1 py-1 border rounded text-xs"
																		/>
																	</div>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.title = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ タイトルを追加
																</button>
															{/if}
														</div>

														<!-- サブタイトル -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.subtitle !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">サブタイトル</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.subtitle;
																			delete section.content.textColumn.subtitleColor;
																			delete section.content.textColumn.subtitleBold;
																			delete section.content.textColumn.subtitleItalic;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<input
																	type="text"
																	bind:value={section.content.textColumn.subtitle}
																	placeholder="サブタイトル"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																/>
																<div class="flex gap-2 items-center">
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.subtitleBold}
																			class="rounded"
																		/>
																		<span class="font-bold">B</span>
																	</label>
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.subtitleItalic}
																			class="rounded"
																		/>
																		<span class="italic">I</span>
																	</label>
																	<div class="flex items-center gap-2 ml-auto">
																		<input
																			type="color"
																			bind:value={section.content.textColumn.subtitleColor}
																			class="w-6 h-6 rounded cursor-pointer"
																		/>
																		<input
																			type="text"
																			bind:value={section.content.textColumn.subtitleColor}
																			placeholder="#000000"
																			class="w-20 px-1 py-1 border rounded text-xs"
																		/>
																	</div>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.subtitle = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ サブタイトルを追加
																</button>
															{/if}
														</div>

														<!-- 説明 -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.description !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">説明</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.description;
																			delete section.content.textColumn.descriptionColor;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<textarea
																	bind:value={section.content.textColumn.description}
																	placeholder="説明"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																	rows="3"
																></textarea>
																<div class="flex items-center gap-2">
																	<input
																		type="color"
																		bind:value={section.content.textColumn.descriptionColor}
																		class="w-6 h-6 rounded cursor-pointer"
																	/>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.descriptionColor}
																		placeholder="#000000"
																		class="w-20 px-1 py-1 border rounded text-xs"
																	/>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.description = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ 説明を追加
																</button>
															{/if}
														</div>

													</div>
												</div>

												<!-- ボタン設定 -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<button
														on:click={() => {
															const btn = document.getElementById('button-settings-' + section.id);
															if (btn) btn.classList.toggle('hidden');
														}}
														class="w-full flex items-center justify-between text-left"
													>
														<h5 class="text-xs font-semibold text-gray-700">🔘 ボタン設定</h5>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
													</button>
													<div id="button-settings-{section.id}" class="mt-3 space-y-2">
														{#if section.content.textColumn.buttonText !== undefined || section.content.textColumn.buttonLink !== undefined}
															<div class="space-y-2">
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンテキスト</label>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.buttonText}
																		placeholder="ボタンテキスト"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンリンク</label>
																	{#if sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')).length > 0}
																		<div class="mb-2">
																			<label class="block text-xs font-medium text-gray-500 mb-1">クイック選択</label>
																			<select
																				on:change={(e) => {
																					const value = e.currentTarget.value;
																					if (value) {
																						section.content.textColumn.buttonLink = value;
																						sections = sections;
																					}
																				}}
																				class="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
																			>
																				<option value="">（お問い合わせフォームを選択）</option>
																				{#each sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')) as contactSection}
																					{@const title = contactSection.content.formName || contactSection.content.contactColumn?.formName || contactSection.content.title || contactSection.content.textColumn?.title || 'お問い合わせ'}
																					{@const isInline = !contactSection.content.useDedicatedPage && !contactSection.content.contactColumn?.useDedicatedPage}
																					{@const siteSlug = typeof site?.slug === 'string' ? site.slug : 'site'}
																					{@const lpSlug = typeof lp?.slug === 'string' ? lp.slug : 'lp'}
																					{@const sectionId = typeof contactSection.id === 'string' ? contactSection.id : ''}
																					<option value={isInline ? `#${sectionId}` : `/WEBTHQ/${siteSlug}/${lpSlug}/contact`}>
																						{title} {isInline ? '(ページ内)' : '(専用ページ)'}
																					</option>
																				{/each}
																			</select>
																		</div>
																	{/if}
																	<label class="block text-xs font-medium text-gray-500 mb-1">カスタムURL</label>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.buttonLink}
																		placeholder="ボタンリンク (例: #, /contact)"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<button
																	on:click={() => {
																		section.content.textColumn.buttonText = undefined;
																		section.content.textColumn.buttonLink = undefined;
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 bg-red-50 text-red-600 border border-red-300 rounded text-sm font-semibold hover:bg-red-100 transition"
																>
																	ボタンを削除
																</button>
															</div>
														{:else}
															<button
																on:click={() => {
																	section.content.textColumn.buttonText = 'ボタン';
																	section.content.textColumn.buttonLink = '#';
																	sections = sections;
																}}
																class="w-full px-2 py-1 bg-green-50 text-green-600 border border-green-300 rounded text-sm font-semibold hover:bg-green-100 transition"
															>
																+ ボタンを追加
															</button>
														{/if}
													</div>
												</div>

												<!-- フォント設定 -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<button
														on:click={() => {
															const fontSettings = document.getElementById('font-settings-' + section.id);
															if (fontSettings) fontSettings.classList.toggle('hidden');
														}}
														class="w-full flex items-center justify-between text-left"
													>
														<h5 class="text-xs font-semibold text-gray-700">🔤 フォント設定</h5>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
													</button>
													<div id="font-settings-{section.id}" class="mt-3 space-y-2 hidden">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">フォントファミリー</label>
															<select
																bind:value={section.content.textColumn.fontFamily}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															>
																<option value="">デフォルト</option>
																<option value="'Noto Sans JP', sans-serif">Noto Sans JP（ゴシック体）</option>
																<option value="'Noto Serif JP', serif">Noto Serif JP（明朝体）</option>
																<option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded 1c（丸ゴシック）</option>
																<option value="'Zen Kaku Gothic New', sans-serif">Zen Kaku Gothic New（角ゴシック）</option>
																<option value="'Shippori Mincho', serif">Shippori Mincho（明朝体）</option>
																<option value="Arial, sans-serif">Arial</option>
																<option value="'Times New Roman', serif">Times New Roman</option>
																<option value="Georgia, serif">Georgia</option>
																<option value="'Courier New', monospace">Courier New（等幅）</option>
															</select>
														</div>
														<p class="text-xs text-gray-500">※ セクション全体のフォントが変更されます</p>
													</div>
												</div>

												<!-- 画像カラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">画像カラム</h5>
													<div class="space-y-2">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像URL</label>
															<div class="flex gap-2">
																<input
																	type="text"
																	bind:value={section.content.imageColumn.imageUrl}
																	class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
																	placeholder="https://..."
																/>
																<button
																	on:click={() => openImagePicker(i, 'imageColumn.imageUrl')}
																	class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
																>
																	画像を選択
																</button>
															</div>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像の説明（Alt）</label>
															<input
																type="text"
																bind:value={section.content.imageColumn.imageAlt}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															/>
														</div>
													</div>
												</div>

												<!-- レイアウト -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">カラム比率</h5>
													<select
														bind:value={section.content.layout.ratio}
														class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
													>
														<option value="50-50">50% - 50%</option>
														<option value="60-40">60% - 40%</option>
														<option value="40-60">40% - 60%</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- Two Column Image + Text Section -->
										{#if section.type === 'two_column_image_text'}
											<div class="space-y-4">
												<!-- 画像カラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">画像カラム</h5>
													<div class="space-y-2">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像URL</label>
															<div class="flex gap-2">
																<input
																	type="text"
																	bind:value={section.content.imageColumn.imageUrl}
																	class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
																	placeholder="https://..."
																/>
																<button
																	on:click={() => openImagePicker(i, 'imageColumn.imageUrl')}
																	class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
																>
																	画像を選択
																</button>
															</div>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像の説明（Alt）</label>
															<input
																type="text"
																bind:value={section.content.imageColumn.imageAlt}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															/>
														</div>
													</div>
												</div>

												<!-- テキストカラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<div class="flex items-center justify-between mb-3">
														<h5 class="text-xs font-semibold text-gray-700">テキストカラム</h5>
														<button
															on:click={() => {
																section.content.textColumn = {
																	title: '',
																	subtitle: '',
																	description: '',
																	buttonText: undefined,
																	buttonLink: undefined
																};
																sections = sections;
															}}
															class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
														>
															リセット
														</button>
													</div>

													<div class="space-y-3">
														<!-- タイトル -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.title !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">タイトル</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.title;
																			delete section.content.textColumn.titleColor;
																			delete section.content.textColumn.titleBold;
																			delete section.content.textColumn.titleItalic;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<input
																	type="text"
																	bind:value={section.content.textColumn.title}
																	placeholder="タイトル"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																/>
																<div class="flex gap-2 items-center">
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.titleBold}
																			class="rounded"
																		/>
																		<span class="font-bold">B</span>
																	</label>
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.titleItalic}
																			class="rounded"
																		/>
																		<span class="italic">I</span>
																	</label>
																	<div class="flex items-center gap-2 ml-auto">
																		<input
																			type="color"
																			bind:value={section.content.textColumn.titleColor}
																			class="w-6 h-6 rounded cursor-pointer"
																		/>
																		<input
																			type="text"
																			bind:value={section.content.textColumn.titleColor}
																			placeholder="#000000"
																			class="w-20 px-1 py-1 border rounded text-xs"
																		/>
																	</div>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.title = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ タイトルを追加
																</button>
															{/if}
														</div>

														<!-- サブタイトル -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.subtitle !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">サブタイトル</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.subtitle;
																			delete section.content.textColumn.subtitleColor;
																			delete section.content.textColumn.subtitleBold;
																			delete section.content.textColumn.subtitleItalic;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<input
																	type="text"
																	bind:value={section.content.textColumn.subtitle}
																	placeholder="サブタイトル"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																/>
																<div class="flex gap-2 items-center">
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.subtitleBold}
																			class="rounded"
																		/>
																		<span class="font-bold">B</span>
																	</label>
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.subtitleItalic}
																			class="rounded"
																		/>
																		<span class="italic">I</span>
																	</label>
																	<div class="flex items-center gap-2 ml-auto">
																		<input
																			type="color"
																			bind:value={section.content.textColumn.subtitleColor}
																			class="w-6 h-6 rounded cursor-pointer"
																		/>
																		<input
																			type="text"
																			bind:value={section.content.textColumn.subtitleColor}
																			placeholder="#000000"
																			class="w-20 px-1 py-1 border rounded text-xs"
																		/>
																	</div>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.subtitle = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ サブタイトルを追加
																</button>
															{/if}
														</div>

														<!-- 説明 -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.description !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">説明</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.description;
																			delete section.content.textColumn.descriptionColor;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<textarea
																	bind:value={section.content.textColumn.description}
																	placeholder="説明"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																	rows="3"
																></textarea>
																<div class="flex items-center gap-2">
																	<input
																		type="color"
																		bind:value={section.content.textColumn.descriptionColor}
																		class="w-6 h-6 rounded cursor-pointer"
																	/>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.descriptionColor}
																		placeholder="#000000"
																		class="w-20 px-1 py-1 border rounded text-xs"
																	/>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.description = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ 説明を追加
																</button>
															{/if}
														</div>

													</div>
												</div>

												<!-- ボタン設定 -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<button
														on:click={() => {
															const btn = document.getElementById('button-settings-' + section.id);
															if (btn) btn.classList.toggle('hidden');
														}}
														class="w-full flex items-center justify-between text-left"
													>
														<h5 class="text-xs font-semibold text-gray-700">🔘 ボタン設定</h5>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
													</button>
													<div id="button-settings-{section.id}" class="mt-3 space-y-2">
														{#if section.content.textColumn.buttonText !== undefined || section.content.textColumn.buttonLink !== undefined}
															<div class="space-y-2">
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンテキスト</label>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.buttonText}
																		placeholder="ボタンテキスト"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンリンク</label>
																	{#if sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')).length > 0}
																		<div class="mb-2">
																			<label class="block text-xs font-medium text-gray-500 mb-1">クイック選択</label>
																			<select
																				on:change={(e) => {
																					const value = e.currentTarget.value;
																					if (value) {
																						section.content.textColumn.buttonLink = value;
																						sections = sections;
																					}
																				}}
																				class="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
																			>
																				<option value="">（お問い合わせフォームを選択）</option>
																				{#each sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')) as contactSection}
																					{@const title = contactSection.content.formName || contactSection.content.contactColumn?.formName || contactSection.content.title || contactSection.content.textColumn?.title || 'お問い合わせ'}
																					{@const isInline = !contactSection.content.useDedicatedPage && !contactSection.content.contactColumn?.useDedicatedPage}
																					{@const siteSlug = typeof site?.slug === 'string' ? site.slug : 'site'}
																					{@const lpSlug = typeof lp?.slug === 'string' ? lp.slug : 'lp'}
																					{@const sectionId = typeof contactSection.id === 'string' ? contactSection.id : ''}
																					<option value={isInline ? `#${sectionId}` : `/WEBTHQ/${siteSlug}/${lpSlug}/contact`}>
																						{title} {isInline ? '(ページ内)' : '(専用ページ)'}
																					</option>
																				{/each}
																			</select>
																		</div>
																	{/if}
																	<label class="block text-xs font-medium text-gray-500 mb-1">カスタムURL</label>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.buttonLink}
																		placeholder="ボタンリンク (例: #, /contact)"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<button
																	on:click={() => {
																		section.content.textColumn.buttonText = undefined;
																		section.content.textColumn.buttonLink = undefined;
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 bg-red-50 text-red-600 border border-red-300 rounded text-sm font-semibold hover:bg-red-100 transition"
																>
																	ボタンを削除
																</button>
															</div>
														{:else}
															<button
																on:click={() => {
																	section.content.textColumn.buttonText = 'ボタン';
																	section.content.textColumn.buttonLink = '#';
																	sections = sections;
																}}
																class="w-full px-2 py-1 bg-green-50 text-green-600 border border-green-300 rounded text-sm font-semibold hover:bg-green-100 transition"
															>
																+ ボタンを追加
															</button>
														{/if}
													</div>
												</div>

												<!-- レイアウト -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">カラム比率</h5>
													<select
														bind:value={section.content.layout.ratio}
														class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
													>
														<option value="50-50">50% - 50%</option>
														<option value="60-40">60% - 40%</option>
														<option value="40-60">40% - 60%</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- Two Column Text + Video Section -->
										{#if section.type === 'two_column_text_video'}
											<div class="space-y-4">
												<!-- テキストカラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<div class="flex items-center justify-between mb-3">
														<h5 class="text-xs font-semibold text-gray-700">テキストカラム</h5>
														<button
															on:click={() => {
																section.content.textColumn = {
																	title: '',
																	subtitle: '',
																	description: '',
																	buttonText: undefined,
																	buttonLink: undefined
																};
																sections = sections;
															}}
															class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
														>
															リセット
														</button>
													</div>

													<div class="space-y-3">
														<!-- タイトル -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.title !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">タイトル</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.title;
																			delete section.content.textColumn.titleColor;
																			delete section.content.textColumn.titleBold;
																			delete section.content.textColumn.titleItalic;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<input
																	type="text"
																	bind:value={section.content.textColumn.title}
																	placeholder="タイトル"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																/>
																<div class="flex gap-2 items-center">
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.titleBold}
																			class="rounded"
																		/>
																		<span class="font-bold">B</span>
																	</label>
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.titleItalic}
																			class="rounded"
																		/>
																		<span class="italic">I</span>
																	</label>
																	<div class="flex items-center gap-2 ml-auto">
																		<input
																			type="color"
																			bind:value={section.content.textColumn.titleColor}
																			class="w-6 h-6 rounded cursor-pointer"
																		/>
																		<input
																			type="text"
																			bind:value={section.content.textColumn.titleColor}
																			placeholder="#000000"
																			class="w-20 px-1 py-1 border rounded text-xs"
																		/>
																	</div>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.title = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ タイトルを追加
																</button>
															{/if}
														</div>

														<!-- サブタイトル -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.subtitle !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">サブタイトル</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.subtitle;
																			delete section.content.textColumn.subtitleColor;
																			delete section.content.textColumn.subtitleBold;
																			delete section.content.textColumn.subtitleItalic;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<input
																	type="text"
																	bind:value={section.content.textColumn.subtitle}
																	placeholder="サブタイトル"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																/>
																<div class="flex gap-2 items-center">
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.subtitleBold}
																			class="rounded"
																		/>
																		<span class="font-bold">B</span>
																	</label>
																	<label class="flex items-center gap-1 text-xs">
																		<input
																			type="checkbox"
																			bind:checked={section.content.textColumn.subtitleItalic}
																			class="rounded"
																		/>
																		<span class="italic">I</span>
																	</label>
																	<div class="flex items-center gap-2 ml-auto">
																		<input
																			type="color"
																			bind:value={section.content.textColumn.subtitleColor}
																			class="w-6 h-6 rounded cursor-pointer"
																		/>
																		<input
																			type="text"
																			bind:value={section.content.textColumn.subtitleColor}
																			placeholder="#000000"
																			class="w-20 px-1 py-1 border rounded text-xs"
																		/>
																	</div>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.subtitle = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ サブタイトルを追加
																</button>
															{/if}
														</div>

														<!-- 説明 -->
														<div class="p-2 border rounded-lg bg-white">
															{#if section.content.textColumn.description !== undefined}
																<div class="flex items-center justify-between mb-3">
																	<span class="text-xs font-semibold text-gray-700">説明</span>
																	<button
																		on:click={() => {
																			delete section.content.textColumn.description;
																			delete section.content.textColumn.descriptionColor;
																			sections = sections;
																		}}
																		class="text-xs text-red-600 hover:text-red-800"
																	>
																		削除
																	</button>
																</div>
																<textarea
																	bind:value={section.content.textColumn.description}
																	placeholder="説明"
																	class="w-full px-2 py-1 border rounded text-sm mb-2"
																	rows="3"
																></textarea>
																<div class="flex items-center gap-2">
																	<input
																		type="color"
																		bind:value={section.content.textColumn.descriptionColor}
																		class="w-6 h-6 rounded cursor-pointer"
																	/>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.descriptionColor}
																		placeholder="#000000"
																		class="w-20 px-1 py-1 border rounded text-xs"
																	/>
																</div>
															{:else}
																<button
																	on:click={() => {
																		section.content.textColumn.description = '';
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
																>
																	+ 説明を追加
																</button>
															{/if}
														</div>

													</div>
												</div>

												<!-- ボタン設定 -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<button
														on:click={() => {
															const btn = document.getElementById('button-settings-' + section.id);
															if (btn) btn.classList.toggle('hidden');
														}}
														class="w-full flex items-center justify-between text-left"
													>
														<h5 class="text-xs font-semibold text-gray-700">🔘 ボタン設定</h5>
														<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><polyline points="6 9 12 15 18 9"></polyline></svg>
													</button>
													<div id="button-settings-{section.id}" class="mt-3 space-y-2">
														{#if section.content.textColumn.buttonText !== undefined || section.content.textColumn.buttonLink !== undefined}
															<div class="space-y-2">
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンテキスト</label>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.buttonText}
																		placeholder="ボタンテキスト"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<div>
																	<label class="block text-xs font-medium text-gray-600 mb-1">ボタンリンク</label>
																	{#if sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')).length > 0}
																		<div class="mb-2">
																			<label class="block text-xs font-medium text-gray-500 mb-1">クイック選択</label>
																			<select
																				on:change={(e) => {
																					const value = e.currentTarget.value;
																					if (value) {
																						section.content.textColumn.buttonLink = value;
																						sections = sections;
																					}
																				}}
																				class="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
																			>
																				<option value="">（お問い合わせフォームを選択）</option>
																				{#each sections.filter(s => (s.type === 'contact' || s.type === 'two_column_text_contact' || s.type === 'two_column_contact_image')) as contactSection}
																					{@const title = contactSection.content.formName || contactSection.content.contactColumn?.formName || contactSection.content.title || contactSection.content.textColumn?.title || 'お問い合わせ'}
																					{@const isInline = !contactSection.content.useDedicatedPage && !contactSection.content.contactColumn?.useDedicatedPage}
																					{@const siteSlug = typeof site?.slug === 'string' ? site.slug : 'site'}
																					{@const lpSlug = typeof lp?.slug === 'string' ? lp.slug : 'lp'}
																					{@const sectionId = typeof contactSection.id === 'string' ? contactSection.id : ''}
																					<option value={isInline ? `#${sectionId}` : `/WEBTHQ/${siteSlug}/${lpSlug}/contact`}>
																						{title} {isInline ? '(ページ内)' : '(専用ページ)'}
																					</option>
																				{/each}
																			</select>
																		</div>
																	{/if}
																	<label class="block text-xs font-medium text-gray-500 mb-1">カスタムURL</label>
																	<input
																		type="text"
																		bind:value={section.content.textColumn.buttonLink}
																		placeholder="ボタンリンク (例: #, /contact)"
																		class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																	/>
																</div>
																<button
																	on:click={() => {
																		section.content.textColumn.buttonText = undefined;
																		section.content.textColumn.buttonLink = undefined;
																		sections = sections;
																	}}
																	class="w-full px-2 py-1 bg-red-50 text-red-600 border border-red-300 rounded text-sm font-semibold hover:bg-red-100 transition"
																>
																	ボタンを削除
																</button>
															</div>
														{:else}
															<button
																on:click={() => {
																	section.content.textColumn.buttonText = 'ボタン';
																	section.content.textColumn.buttonLink = '#';
																	sections = sections;
																}}
																class="w-full px-2 py-1 bg-green-50 text-green-600 border border-green-300 rounded text-sm font-semibold hover:bg-green-100 transition"
															>
																+ ボタンを追加
															</button>
														{/if}
													</div>
												</div>

												<!-- 動画カラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">動画カラム</h5>
													<div class="space-y-2">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">動画URL</label>
															<input
																type="text"
																bind:value={section.content.videoColumn.videoUrl}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
																placeholder="https://www.youtube.com/watch?v=..."
															/>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">動画タイプ</label>
															<select
																bind:value={section.content.videoColumn.videoType}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															>
																<option value="youtube">YouTube</option>
																<option value="vimeo">Vimeo</option>
																<option value="direct">直接URL（MP4など）</option>
															</select>
														</div>
													</div>
												</div>

												<!-- レイアウト -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">カラム比率</h5>
													<select
														bind:value={section.content.layout.ratio}
														class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
													>
														<option value="50-50">50% - 50%</option>
														<option value="60-40">60% - 40%</option>
														<option value="40-60">40% - 60%</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- Two Column Features + Image Section -->
										{#if section.type === 'two_column_features_image'}
											<div class="space-y-4">
												<!-- 特徴カラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">特徴カラム</h5>
													<div class="space-y-2">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">タイトル</label>
															<input
																type="text"
																bind:value={section.content.featuresColumn.title}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															/>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">サブタイトル</label>
															<input
																type="text"
																bind:value={section.content.featuresColumn.subtitle}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															/>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-2">特徴リスト</label>
															{#each section.content.featuresColumn.features as feature, idx}
																<div class="mb-2 p-2 bg-white rounded border border-gray-200">
																	<div class="mb-1">
																		<label class="block text-xs text-gray-500">特徴 {idx + 1} - タイトル</label>
																		<input
																			type="text"
																			bind:value={feature.title}
																			class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
																		/>
																	</div>
																	<div>
																		<label class="block text-xs text-gray-500">説明</label>
																		<textarea
																			bind:value={feature.description}
																			rows="2"
																			class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
																		></textarea>
																	</div>
																</div>
															{/each}
														</div>
													</div>
												</div>

												<!-- 画像カラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">画像カラム</h5>
													<div class="space-y-2">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像URL</label>
															<div class="flex gap-2">
																<input
																	type="text"
																	bind:value={section.content.imageColumn.imageUrl}
																	class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
																	placeholder="https://..."
																/>
																<button
																	on:click={() => openImagePicker(i, 'imageColumn.imageUrl')}
																	class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition whitespace-nowrap"
																>
																	画像を選択
																</button>
															</div>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像の説明（Alt）</label>
															<input
																type="text"
																bind:value={section.content.imageColumn.imageAlt}
																class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
															/>
														</div>
													</div>
												</div>

												<!-- レイアウト -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">カラム比率</h5>
													<select
														bind:value={section.content.layout.ratio}
														class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
													>
														<option value="50-50">50% - 50%</option>
														<option value="60-40">60% - 40%</option>
														<option value="40-60">40% - 60%</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- Two Column Text + Contact Section -->
										{#if section.type === 'two_column_text_contact'}
											<div class="space-y-4">
												<!-- テキストカラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">テキストカラム</h5>
													<div class="space-y-3">
														<!-- タイトル -->
														<div class="p-2 border rounded-lg bg-white">
															<span class="text-xs font-semibold text-gray-700">タイトル</span>
															<input
																type="text"
																bind:value={section.content.textColumn.title}
																class="w-full px-2 py-1 border rounded text-sm mb-2"
															/>
															<div class="flex items-center gap-2">
																<input
																	type="color"
																	bind:value={section.content.textColumn.titleColor}
																	class="w-6 h-6 rounded cursor-pointer"
																/>
																<input
																	type="text"
																	bind:value={section.content.textColumn.titleColor}
																	placeholder="#000000"
																	class="w-20 px-1 py-1 border rounded text-xs"
																/>
																<span class="text-xs text-gray-500">色</span>
															</div>
														</div>

														<!-- サブタイトル -->
														<div class="p-2 border rounded-lg bg-white">
															<span class="text-xs font-semibold text-gray-700">サブタイトル</span>
															<input
																type="text"
																bind:value={section.content.textColumn.subtitle}
																class="w-full px-2 py-1 border rounded text-sm mb-2"
															/>
															<div class="flex items-center gap-2">
																<input
																	type="color"
																	bind:value={section.content.textColumn.subtitleColor}
																	class="w-6 h-6 rounded cursor-pointer"
																/>
																<input
																	type="text"
																	bind:value={section.content.textColumn.subtitleColor}
																	placeholder="#666666"
																	class="w-20 px-1 py-1 border rounded text-xs"
																/>
																<span class="text-xs text-gray-500">色</span>
															</div>
														</div>

														<!-- 説明 -->
														<div class="p-2 border rounded-lg bg-white">
															<span class="text-xs font-semibold text-gray-700">説明</span>
															<textarea
																bind:value={section.content.textColumn.description}
																rows="3"
																class="w-full px-2 py-1 border rounded text-sm mb-2"
															></textarea>
															<div class="flex items-center gap-2">
																<input
																	type="color"
																	bind:value={section.content.textColumn.descriptionColor}
																	class="w-6 h-6 rounded cursor-pointer"
																/>
																<input
																	type="text"
																	bind:value={section.content.textColumn.descriptionColor}
																	placeholder="#666666"
																	class="w-20 px-1 py-1 border rounded text-xs"
																/>
																<span class="text-xs text-gray-500">色</span>
															</div>
														</div>

														<!-- フォント -->
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">フォント</label>
															<select
																bind:value={section.content.textColumn.fontFamily}
																class="w-full px-2 py-1 border rounded text-sm"
															>
																<option value="">デフォルト</option>
																<option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
																<option value="'Noto Serif JP', serif">Noto Serif JP</option>
																<option value="'M PLUS Rounded 1c', sans-serif">M PLUS Rounded 1c</option>
															</select>
														</div>
													</div>
												</div>

												<!-- 問い合わせカラム -->
												<div class="p-3 bg-blue-50 rounded border-2 border-blue-200">
													<h5 class="text-xs font-semibold text-blue-900 mb-2">問い合わせカラム</h5>

													<!-- 専用ページモード -->
													<div class="mb-3 p-2 bg-white rounded border border-blue-200">
														<label class="flex items-center gap-2 cursor-pointer">
															<input
																type="checkbox"
																bind:checked={section.content.contactColumn.useDedicatedPage}
																class="w-4 h-4 text-blue-600 rounded"
															/>
															<span class="text-sm font-semibold text-blue-900">専用ページボタン表示</span>
														</label>
														{#if section.content.contactColumn.useDedicatedPage}
															<div class="mt-2">
																<label class="block text-xs font-medium text-blue-900 mb-1">ボタンテキスト</label>
																<input
																	type="text"
																	bind:value={section.content.contactColumn.dedicatedPageButtonText}
																	placeholder="お問い合わせはこちら"
																	class="w-full px-2 py-1 border rounded text-sm"
																/>
															</div>
														{/if}
													</div>

													<!-- フォーム項目 -->
													<div class="mb-2">
														<!-- テンプレート選択 -->
														<div class="mb-2 p-2 bg-white border border-blue-300 rounded">
															<label class="block text-xs font-medium text-blue-900 mb-1">テンプレートを選択</label>
															{#if loadingFormTemplates}
																<p class="text-xs text-gray-500">読み込み中...</p>
															{:else if formTemplates.length === 0}
																<p class="text-xs text-gray-600">
																	テンプレートがありません。
																	<a href="/dashboard/form-templates" target="_blank" class="text-blue-600 hover:underline">
																		テンプレートを作成
																	</a>
																</p>
															{:else}
																<select
																	class="w-full px-2 py-1.5 border border-blue-300 rounded text-xs bg-white"
																	on:change={(e) => {
																		const templateId = e.currentTarget.value;
																		if (templateId) {
																			applyFormTemplate(i, templateId);
																			e.currentTarget.value = '';
																		}
																	}}
																>
																	<option value="">テンプレートを選択してください</option>
																	{#each formTemplates as template}
																		<option value={template.id}>
																			{template.name}
																			{#if template.is_default}(デフォルト){/if}
																		</option>
																	{/each}
																</select>
																<p class="text-xs text-blue-700 mt-1">
																	※ 項目変更は
																	<a href="/dashboard/form-templates" target="_blank" class="text-blue-600 hover:underline font-medium">
																		テンプレート管理
																	</a>
																	から
																</p>
															{/if}
														</div>

														<!-- 現在のフォーム項目表示（読み取り専用） -->
														{#if !section.content.contactColumn.formFields}
															{section.content.contactColumn.formFields = [
																{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
																{ name: 'email', label: 'メールアドレス', type: 'email', required: true, placeholder: 'yamada@example.com' },
																{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true, placeholder: 'お問い合わせ内容をご記入ください' }
															]}
														{/if}

														<div class="space-y-1.5">
															<div class="text-xs font-medium text-blue-900 mb-1">現在の項目 ({section.content.contactColumn.formFields.length}個)</div>
															{#each section.content.contactColumn.formFields as field, fieldIndex}
																<div class="p-1.5 border border-blue-200 rounded bg-white">
																	<div class="flex items-center gap-1.5">
																		<span class="text-xs text-gray-500">#{fieldIndex + 1}</span>
																		<span class="flex-1 text-xs font-medium text-gray-900">{field.label}</span>
																		<span class="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{field.type}</span>
																		{#if field.required}
																			<span class="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">必須</span>
																		{/if}
																	</div>
																	{#if field.placeholder}
																		<div class="mt-0.5 text-xs text-gray-500">例: {field.placeholder}</div>
																	{/if}
																</div>
															{/each}
														</div>
													</div>

													<div class="mt-2">
														<label class="block text-xs font-medium text-blue-900 mb-1">送信ボタンテキスト</label>
														<input
															type="text"
															bind:value={section.content.contactColumn.submitButtonText}
															placeholder="送信する"
															class="w-full px-2 py-1 border rounded text-sm"
														/>
													</div>

													<!-- 自動返信メール設定 -->
													<div class="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
														<h4 class="text-sm font-semibold text-blue-900 mb-2">自動返信メール</h4>
														<div class="space-y-2">
															<label class="flex items-center gap-2">
																<input
																	type="checkbox"
																	bind:checked={section.content.contactColumn.autoReplyEnabled}
																	class="w-4 h-4 text-blue-600 rounded"
																/>
																<span class="text-sm text-gray-700">自動返信メールを送信する</span>
															</label>

															{#if section.content.contactColumn.autoReplyEnabled}
																<div>
																	<label class="block text-xs font-medium text-gray-700 mb-1">メール設定を選択</label>
																	<select
																		bind:value={section.content.contactColumn.autoReplyEmailSettingId}
																		class="w-full px-2 py-1.5 border rounded text-sm bg-white"
																	>
																		<option value="">選択してください</option>
																		{#each emailSettings as setting}
																			<option value={setting.id}>{setting.name}</option>
																		{/each}
																	</select>
																	{#if emailSettings.length === 0}
																		<p class="text-xs text-gray-500 mt-1">
																			メール設定がありません。
																			<a href="/dashboard/email-settings" target="_blank" class="text-blue-600 hover:underline">
																				メール設定を作成
																			</a>
																		</p>
																	{/if}
																</div>
															{/if}
														</div>
													</div>
												</div>

												<!-- レイアウト -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">カラム比率</h5>
													<select bind:value={section.content.layout.ratio} class="w-full px-2 py-1 border rounded text-sm">
														<option value="50-50">50% - 50%</option>
														<option value="60-40">60% - 40%</option>
														<option value="40-60">40% - 60%</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- Two Column Contact + Image Section -->
										{#if section.type === 'two_column_contact_image'}
											<div class="space-y-4">
												<!-- 問い合わせカラム -->
												<div class="p-3 bg-blue-50 rounded border-2 border-blue-200">
													<h5 class="text-xs font-semibold text-blue-900 mb-2">問い合わせカラム</h5>

													<!-- 専用ページモード -->
													<div class="mb-3 p-2 bg-white rounded border border-blue-200">
														<label class="flex items-center gap-2 cursor-pointer">
															<input
																type="checkbox"
																bind:checked={section.content.contactColumn.useDedicatedPage}
																class="w-4 h-4 text-blue-600 rounded"
															/>
															<span class="text-sm font-semibold text-blue-900">専用ページボタン表示</span>
														</label>
														{#if section.content.contactColumn.useDedicatedPage}
															<div class="mt-2">
																<label class="block text-xs font-medium text-blue-900 mb-1">ボタンテキスト</label>
																<input
																	type="text"
																	bind:value={section.content.contactColumn.dedicatedPageButtonText}
																	placeholder="お問い合わせはこちら"
																	class="w-full px-2 py-1 border rounded text-sm"
																/>
															</div>
														{/if}
													</div>

													<!-- フォーム項目 -->
													<div class="mb-2">
														<!-- テンプレート選択 -->
														<div class="mb-2 p-2 bg-white border border-blue-300 rounded">
															<label class="block text-xs font-medium text-blue-900 mb-1">テンプレートを選択</label>
															{#if loadingFormTemplates}
																<p class="text-xs text-gray-500">読み込み中...</p>
															{:else if formTemplates.length === 0}
																<p class="text-xs text-gray-600">
																	テンプレートがありません。
																	<a href="/dashboard/form-templates" target="_blank" class="text-blue-600 hover:underline">
																		テンプレートを作成
																	</a>
																</p>
															{:else}
																<select
																	class="w-full px-2 py-1.5 border border-blue-300 rounded text-xs bg-white"
																	on:change={(e) => {
																		const templateId = e.currentTarget.value;
																		if (templateId) {
																			applyFormTemplate(i, templateId);
																			e.currentTarget.value = '';
																		}
																	}}
																>
																	<option value="">テンプレートを選択してください</option>
																	{#each formTemplates as template}
																		<option value={template.id}>
																			{template.name}
																			{#if template.is_default}(デフォルト){/if}
																		</option>
																	{/each}
																</select>
																<p class="text-xs text-blue-700 mt-1">
																	※ 項目変更は
																	<a href="/dashboard/form-templates" target="_blank" class="text-blue-600 hover:underline font-medium">
																		テンプレート管理
																	</a>
																	から
																</p>
															{/if}
														</div>

														<!-- 現在のフォーム項目表示（読み取り専用） -->
														{#if !section.content.contactColumn.formFields}
															{section.content.contactColumn.formFields = [
																{ name: 'name', label: 'お名前', type: 'text', required: true, placeholder: '山田 太郎' },
																{ name: 'email', label: 'メールアドレス', type: 'email', required: true, placeholder: 'yamada@example.com' },
																{ name: 'message', label: 'お問い合わせ内容', type: 'textarea', required: true, placeholder: 'お問い合わせ内容をご記入ください' }
															]}
														{/if}

														<div class="space-y-1.5">
															<div class="text-xs font-medium text-blue-900 mb-1">現在の項目 ({section.content.contactColumn.formFields.length}個)</div>
															{#each section.content.contactColumn.formFields as field, fieldIndex}
																<div class="p-1.5 border border-blue-200 rounded bg-white">
																	<div class="flex items-center gap-1.5">
																		<span class="text-xs text-gray-500">#{fieldIndex + 1}</span>
																		<span class="flex-1 text-xs font-medium text-gray-900">{field.label}</span>
																		<span class="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{field.type}</span>
																		{#if field.required}
																			<span class="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">必須</span>
																		{/if}
																	</div>
																	{#if field.placeholder}
																		<div class="mt-0.5 text-xs text-gray-500">例: {field.placeholder}</div>
																	{/if}
																</div>
															{/each}
														</div>
													</div>

													<div class="mt-2">
														<label class="block text-xs font-medium text-blue-900 mb-1">送信ボタンテキスト</label>
														<input
															type="text"
															bind:value={section.content.contactColumn.submitButtonText}
															placeholder="送信する"
															class="w-full px-2 py-1 border rounded text-sm"
														/>
													</div>

													<!-- 自動返信メール設定 -->
													<div class="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
														<h4 class="text-sm font-semibold text-blue-900 mb-2">自動返信メール</h4>
														<div class="space-y-2">
															<label class="flex items-center gap-2">
																<input
																	type="checkbox"
																	bind:checked={section.content.contactColumn.autoReplyEnabled}
																	class="w-4 h-4 text-blue-600 rounded"
																/>
																<span class="text-sm text-gray-700">自動返信メールを送信する</span>
															</label>

															{#if section.content.contactColumn.autoReplyEnabled}
																<div>
																	<label class="block text-xs font-medium text-gray-700 mb-1">メール設定を選択</label>
																	<select
																		bind:value={section.content.contactColumn.autoReplyEmailSettingId}
																		class="w-full px-2 py-1.5 border rounded text-sm bg-white"
																	>
																		<option value="">選択してください</option>
																		{#each emailSettings as setting}
																			<option value={setting.id}>{setting.name}</option>
																		{/each}
																	</select>
																	{#if emailSettings.length === 0}
																		<p class="text-xs text-gray-500 mt-1">
																			メール設定がありません。
																			<a href="/dashboard/email-settings" target="_blank" class="text-blue-600 hover:underline">
																				メール設定を作成
																			</a>
																		</p>
																	{/if}
																</div>
															{/if}
														</div>
													</div>
												</div>

												<!-- 画像カラム -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">画像カラム</h5>
													<div class="space-y-2">
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像URL</label>
															<div class="flex gap-2">
																<input
																	type="text"
																	bind:value={section.content.imageColumn.imageUrl}
																	class="flex-1 px-2 py-1 border rounded text-sm"
																	placeholder="https://..."
																/>
																<button
																	on:click={() => openImagePicker(i, 'imageColumn.imageUrl')}
																	class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 whitespace-nowrap"
																>
																	画像を選択
																</button>
															</div>
														</div>
														<div>
															<label class="block text-xs font-medium text-gray-600 mb-1">画像の説明（Alt）</label>
															<input
																type="text"
																bind:value={section.content.imageColumn.imageAlt}
																class="w-full px-2 py-1 border rounded text-sm"
															/>
														</div>
													</div>
												</div>

												<!-- レイアウト -->
												<div class="p-3 bg-gray-50 rounded border border-gray-200">
													<h5 class="text-xs font-semibold text-gray-700 mb-2">カラム比率</h5>
													<select bind:value={section.content.layout.ratio} class="w-full px-2 py-1 border rounded text-sm">
														<option value="50-50">50% - 50%</option>
														<option value="60-40">60% - 40%</option>
														<option value="40-60">40% - 60%</option>
													</select>
												</div>
											</div>
										{/if}

										<!-- その他のセクションタイプ用のプレースホルダー -->
										{#if !['hero', 'features', 'cta', 'contact', 'gallery', 'two_column_text_image', 'two_column_image_text', 'two_column_text_video', 'two_column_features_image', 'two_column_text_contact', 'two_column_contact_image'].includes(section.type)}
											<p class="text-sm text-gray-500">このセクションタイプのコンテンツ編集は開発中です</p>
										{/if}
									</div>
								</div>
							{/if}
								</div>
							{/each}
						</div>
					{/if}

				</div>

				<!-- セクション追加ボタン -->
				<div class="space-y-4">
					<h3 class="text-md font-semibold text-gray-800">セクションを追加</h3>

					<!-- レイアウトタブ -->
					<div class="flex gap-2 border-b border-gray-200">
						<button
							on:click={() => (columnLayout = '1-column')}
							class="flex items-center gap-2 px-4 py-2 transition {columnLayout === '1-column'
								? 'text-pink-600 border-b-2 border-pink-600 font-semibold'
								: 'text-gray-600 hover:text-gray-900'}"
						>
							<FileText size={18} />
							<span>1カラム</span>
						</button>
						<button
							on:click={() => (columnLayout = '2-column')}
							class="flex items-center gap-2 px-4 py-2 transition {columnLayout === '2-column'
								? 'text-pink-600 border-b-2 border-pink-600 font-semibold'
								: 'text-gray-600 hover:text-gray-900'}"
						>
							<Columns2 size={18} />
							<span>2カラム</span>
						</button>
						<button
							on:click={() => (columnLayout = '3-column')}
							class="flex items-center gap-2 px-4 py-2 transition {columnLayout === '3-column'
								? 'text-pink-600 border-b-2 border-pink-600 font-semibold'
								: 'text-gray-600 hover:text-gray-900'}"
						>
							<Columns3 size={18} />
							<span>3カラム</span>
						</button>
						<button
							on:click={() => (columnLayout = 'contact')}
							class="flex items-center gap-2 px-4 py-2 transition {columnLayout === 'contact'
								? 'text-pink-600 border-b-2 border-pink-600 font-semibold'
								: 'text-gray-600 hover:text-gray-900'}"
						>
							<Mail size={18} />
							<span>問い合わせ</span>
						</button>
					</div>

					<!-- 1カラムセクションボタン -->
					{#if columnLayout === '1-column'}
					<div class="grid grid-cols-3 gap-3">
						<button
							on:click={() => addSection('hero')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-pink-200 text-pink-700 rounded-lg hover:bg-pink-50 transition"
						>
							<Sparkles size={24} class="mb-1" />
							<span class="text-sm font-semibold">ヒーロー</span>
						</button>
						<button
							on:click={() => addSection('features')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition"
						>
							<Grid3x3 size={24} class="mb-1" />
							<span class="text-sm font-semibold">機能・特徴</span>
						</button>
						<button
							on:click={() => addSection('cta')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition"
						>
							<Megaphone size={24} class="mb-1" />
							<span class="text-sm font-semibold">CTA</span>
						</button>
						<button
							on:click={() => addSection('pricing')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-50 transition"
						>
							<DollarSign size={24} class="mb-1" />
							<span class="text-sm font-semibold">料金</span>
						</button>
						<button
							on:click={() => addSection('testimonials')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition"
						>
							<MessageSquare size={24} class="mb-1" />
							<span class="text-sm font-semibold">お客様の声</span>
						</button>
						<button
							on:click={() => addSection('faq')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-orange-200 text-orange-700 rounded-lg hover:bg-orange-50 transition"
						>
							<HelpCircle size={24} class="mb-1" />
							<span class="text-sm font-semibold">FAQ</span>
						</button>
						<button
							on:click={() => addSection('team')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition"
						>
							<Users size={24} class="mb-1" />
							<span class="text-sm font-semibold">チーム</span>
						</button>
						<button
							on:click={() => addSection('stats')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-cyan-200 text-cyan-700 rounded-lg hover:bg-cyan-50 transition"
						>
							<BarChart3 size={24} class="mb-1" />
							<span class="text-sm font-semibold">実績</span>
						</button>
						<button
							on:click={() => addSection('gallery')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 transition"
						>
							<ImageIcon size={24} class="mb-1" />
							<span class="text-sm font-semibold">ギャラリー</span>
						</button>
						<button
							on:click={() => addSection('video')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 transition"
						>
							<VideoIcon size={24} class="mb-1" />
							<span class="text-sm font-semibold">動画</span>
						</button>
						<button
							on:click={() => addSection('newsletter')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-lime-200 text-lime-700 rounded-lg hover:bg-lime-50 transition"
						>
							<Newspaper size={24} class="mb-1" />
							<span class="text-sm font-semibold">ニュースレター</span>
						</button>
					</div>

					<!-- 2カラムセクションボタン -->
					{:else if columnLayout === '2-column'}
					<div class="grid grid-cols-2 gap-3">
						<button
							on:click={() => addSection('two_column_text_image')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition"
						>
							<Columns2 size={24} class="mb-1" />
							<span class="text-sm font-semibold">テキスト + 画像</span>
						</button>
						<button
							on:click={() => addSection('two_column_image_text')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition"
						>
							<Columns2 size={24} class="mb-1" />
							<span class="text-sm font-semibold">画像 + テキスト</span>
						</button>
						<button
							on:click={() => addSection('two_column_text_video')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition"
						>
							<Columns2 size={24} class="mb-1" />
							<span class="text-sm font-semibold">テキスト + 動画</span>
						</button>
						<button
							on:click={() => addSection('two_column_features_image')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition"
						>
							<Columns2 size={24} class="mb-1" />
							<span class="text-sm font-semibold">特徴 + 画像</span>
						</button>
						<button
							on:click={() => addSection('two_column_text_contact')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-cyan-200 text-cyan-700 rounded-lg hover:bg-cyan-50 transition"
						>
							<Columns2 size={24} class="mb-1" />
							<span class="text-sm font-semibold">テキスト + 問い合わせ</span>
						</button>
						<button
							on:click={() => addSection('two_column_contact_image')}
							class="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition"
						>
							<Columns2 size={24} class="mb-1" />
							<span class="text-sm font-semibold">問い合わせ + 画像</span>
						</button>
					</div>

					<!-- 3カラムセクションボタン（将来実装） -->
					{:else if columnLayout === '3-column'}
					<div class="text-center py-8 text-gray-500">
						<Columns3 size={48} class="mx-auto mb-2 text-gray-400" />
						<p class="text-sm">3カラムセクションは今後実装予定です</p>
					</div>

					<!-- 問い合わせセクションボタン -->
					{:else if columnLayout === 'contact'}
					<div class="space-y-4">
						<div class="grid grid-cols-2 gap-3">
							<button
								on:click={() => addSection('contact')}
								class="flex flex-col items-center justify-center px-4 py-6 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition"
							>
								<Mail size={32} class="mb-2" />
								<span class="text-sm font-semibold">お問い合わせ</span>
								<span class="text-xs text-gray-500 mt-1">1カラム</span>
							</button>
							<button
								on:click={() => addSection('two_column_text_contact')}
								class="flex flex-col items-center justify-center px-4 py-6 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition"
							>
								<div class="flex items-center gap-1 mb-2">
									<FileText size={24} />
									<Mail size={24} />
								</div>
								<span class="text-sm font-semibold">テキスト + 問い合わせ</span>
								<span class="text-xs text-gray-500 mt-1">2カラム</span>
							</button>
							<button
								on:click={() => addSection('two_column_contact_image')}
								class="flex flex-col items-center justify-center px-4 py-6 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition"
							>
								<div class="flex items-center gap-1 mb-2">
									<Mail size={24} />
									<ImageIcon size={24} />
								</div>
								<span class="text-sm font-semibold">問い合わせ + 画像</span>
								<span class="text-xs text-gray-500 mt-1">2カラム</span>
							</button>
						</div>
						<div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
							<p class="text-sm text-purple-800">
								<strong>ヒント:</strong> 問い合わせフォームは顧客とのコミュニケーションの重要なポイントです。適切な配置とデザインで、より多くのお問い合わせを獲得できます。
							</p>
						</div>
					</div>
					{/if}
				</div>

				<!-- Image Gallery -->
				<div class="space-y-4">
					<div class="bg-white border-2 border-gray-200 rounded-lg p-4">
						<ImageGallery landingPageId={lp?.id} {sections} />
					</div>
				</div>
			</div>
		</div>

		<!-- 右側: プレビュー -->
		<div class="w-1/2 overflow-hidden bg-gray-100 flex flex-col">
			<!-- タブヘッダー -->
			<div class="sticky top-0 bg-white border-b border-gray-200 z-10">
				<div class="flex">
					<button
						on:click={() => (leftPanelTab = 'preview')}
						class="flex-1 px-6 py-3 font-semibold transition {leftPanelTab === 'preview'
							? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex items-center justify-center gap-2">
							<Eye size={20} />
							<span>プレビュー</span>
						</div>
					</button>
					<button
						on:click={() => (leftPanelTab = 'source')}
						class="flex-1 px-6 py-3 font-semibold transition {leftPanelTab === 'source'
							? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex items-center justify-center gap-2">
							<Code size={20} />
							<span>ソースコード</span>
						</div>
					</button>
					<button
						on:click={() => (leftPanelTab = 'history')}
						class="flex-1 px-6 py-3 font-semibold transition {leftPanelTab === 'history'
							? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						<div class="flex items-center justify-center gap-2">
							<History size={20} />
							<span>履歴</span>
						</div>
					</button>
				</div>
			</div>

			<!-- タブコンテンツ -->
			<div class="flex-1 overflow-y-auto">
				{#if leftPanelTab === 'preview'}
					<!-- プレビュー -->
					<div class="bg-white min-h-full relative">
						<!-- 全幅プレビューボタン -->
						{#if sections.length > 0}
							<button
								on:click={() => (fullWidthPreview = true)}
								class="absolute top-4 right-4 z-20 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition shadow-lg flex items-center gap-2"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
								全幅プレビュー
							</button>
						{/if}

						{#if sections.length === 0}
							<div class="flex items-center justify-center h-96 text-gray-400">
								<div class="text-center">
									<div class="mb-4 flex justify-center"><Eye size={96} /></div>
									<p>セクションを追加するとプレビューが表示されます</p>
								</div>
							</div>
						{:else}
							{#each sections as section}
								<SectionRenderer {section} />
							{/each}
						{/if}
					</div>
				{:else if leftPanelTab === 'source'}
					<!-- ソースコード -->
					<div class="p-6 h-full bg-gray-900">
						<div class="mb-6">
							<h3 class="text-lg font-semibold text-white">ソースコード編集</h3>
							<p class="text-xs text-gray-400 mt-1">各セクションのcontentとstyleをJSON形式で編集できます</p>
						</div>

						{#if sections.length === 0}
							<div class="text-center py-12 text-gray-400">
								<div class="mb-2 flex justify-center text-gray-600"><Code size={64} /></div>
								<p>セクションがありません</p>
								<p class="text-sm">左側からセクションを追加してください</p>
							</div>
						{/if}

						<div class="space-y-4">
							{#each sections as section, i}
								<div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
									<!-- セクションヘッダー -->
									<button
										on:click={() => toggleSourceSection(i)}
										class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-750 transition"
									>
										<div class="flex items-center gap-3">
											<Code size={18} class="text-pink-400" />
											<div class="text-left">
												<div class="font-semibold text-white">セクション {i + 1}: {section.type}</div>
												<div class="text-xs text-gray-400">ID: {section.id}</div>
											</div>
										</div>
										<ChevronDown
											size={20}
											class="text-gray-400 transition-transform {expandedSourceSections.has(i) ? 'rotate-180' : ''}"
										/>
									</button>

									<!-- セクション編集エリア -->
									{#if expandedSourceSections.has(i)}
										<div class="border-t border-gray-700 p-4 space-y-4">
											<!-- 読み取り専用情報 -->
											<div class="bg-gray-900 rounded-lg p-3 border border-gray-700">
												<h4 class="text-xs font-semibold text-gray-400 mb-2">読み取り専用情報</h4>
												<div class="grid grid-cols-2 gap-2 text-xs font-mono">
													<div>
														<span class="text-gray-500">Type:</span>
														<span class="text-blue-400 ml-2">{section.type}</span>
													</div>
													<div>
														<span class="text-gray-500">Order:</span>
														<span class="text-blue-400 ml-2">{section.order || i}</span>
													</div>
													<div class="col-span-2">
														<span class="text-gray-500">ID:</span>
														<span class="text-blue-400 ml-2 break-all">{section.id}</span>
													</div>
												</div>
											</div>

											<!-- エラー表示 -->
											{#if sectionSourceErrors.has(i)}
												<div class="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
													<strong>エラー:</strong> {sectionSourceErrors.get(i)}
												</div>
											{/if}

											<!-- 編集可能エリア -->
											<div>
												<div class="flex items-center justify-between mb-3">
													<h4 class="text-xs font-semibold text-gray-400">編集可能エリア (content & style)</h4>
													<button
														on:click={() => saveSectionSource(i)}
														disabled={saving}
														class="px-3 py-1 bg-pink-600 text-white text-xs rounded font-semibold hover:bg-pink-700 transition disabled:opacity-50"
													>
														{saving ? '保存中...' : '保存'}
													</button>
												</div>
												<textarea
													bind:value={sectionSourceCodes[i]}
													class="w-full h-64 bg-gray-950 text-gray-300 font-mono text-xs p-3 rounded border border-gray-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none"
													spellcheck="false"
													placeholder="JSON形式でcontent及びstyleを入力..."
												></textarea>
											</div>

											<div class="text-xs text-gray-500">
												<p><strong>注意:</strong></p>
												<ul class="list-disc list-inside mt-1 space-y-1">
													<li>contentとstyleのみ編集可能です</li>
													<li>type, id, orderは変更できません</li>
													<li>正しいJSON形式で入力してください</li>
													<li>保存後、プレビュータブで確認できます</li>
												</ul>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<!-- 履歴 -->
					<div class="p-4 h-full">
						<HistoryPanel
							editHistory={data.editHistory}
							conversationHistory={data.conversationHistory}
						/>
					</div>
				{/if}
			</div>

		</div>
	</div>
</div>

<!-- トースト通知 -->
{#if showToast}
	<div
		class="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 {toastType === 'success'
			? 'bg-green-600 text-white'
			: toastType === 'error'
				? 'bg-red-600 text-white'
				: 'bg-blue-600 text-white'}"
	>
		{#if toastType === 'success'}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
		{:else if toastType === 'error'}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
		{:else}
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
		{/if}
		<span class="font-semibold">{toastMessage}</span>
	</div>
{/if}

{#if form?.message}
	<div
		class="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg {form.success
			? 'bg-green-100 text-green-800 border border-green-200'
			: 'bg-red-100 text-red-800 border border-red-200'}"
	>
		{form.message}
	</div>
{/if}

<!-- テンプレート保存モーダル -->
{#if showTemplateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold text-gray-800 mb-4">テンプレートとして保存</h2>

			<div class="space-y-4">
				<div>
					<label for="templateName" class="block text-sm font-medium text-gray-700 mb-1">
						テンプレート名 <span class="text-red-500">*</span>
					</label>
					<input
						id="templateName"
						type="text"
						bind:value={templateName}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						placeholder="例: 商品LP基本テンプレート"
					/>
				</div>

				<div>
					<label for="templateDescription" class="block text-sm font-medium text-gray-700 mb-1">
						説明
					</label>
					<textarea
						id="templateDescription"
						bind:value={templateDescription}
						rows="3"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						placeholder="このテンプレートの用途や特徴を入力"
					></textarea>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						on:click={() => (showTemplateModal = false)}
						class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
					>
						キャンセル
					</button>
					<button
						on:click={saveAsTemplate}
						disabled={savingTemplate}
						class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
					>
						{savingTemplate ? '保存中...' : '保存'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- 全幅プレビューモーダル -->
{#if fullWidthPreview}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white w-full h-full overflow-auto">
			<!-- ヘッダー -->
			<div class="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-800">全幅プレビュー（公開ページと同じ表示）</h2>
				<button
					on:click={() => (fullWidthPreview = false)}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
				>
					閉じる
				</button>
			</div>

			<!-- プレビュー内容 -->
			<div class="bg-white min-h-full">
				{#each sections as section}
					<SectionRenderer {section} />
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- 画像選択モーダル -->
<ImagePicker
	bind:show={showImagePicker}
	onSelect={handleImageSelect}
	landingPageId={lp?.id || ''}
/>