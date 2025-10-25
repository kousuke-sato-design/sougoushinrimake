<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';
	import {
		LayoutDashboard,
		Globe,
		FileText,
		Users,
		Mail,
		Bot,
		Settings,
		Server,
		ClipboardList,
		Clock
	} from 'lucide-svelte';

	export let data: LayoutData;

	async function signOut() {
		// ログアウト処理は別のAPIエンドポイントで実装
		await fetch('/api/auth/signout', { method: 'POST' });
		await invalidateAll();
	}

	const menuItems = [
		{ href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
		{ href: '/dashboard/sites', label: 'サイト一覧', icon: Globe },
		{ href: '/dashboard/landing-pages', label: 'LP一覧', icon: FileText },
		{ href: '/dashboard/customers', label: '顧客リスト', icon: Users },
		{ href: '/dashboard/work-history', label: '作業履歴', icon: Clock },
		{ href: '/dashboard/form-templates', label: 'フォームテンプレート', icon: ClipboardList },
		{ href: '/dashboard/imap-settings', label: 'IMAP設定', icon: Server },
		{ href: '/dashboard/email-settings', label: 'メール設定', icon: Mail },
		{ href: '/dashboard/ai-api', label: 'AI API', icon: Bot },
		{ href: '/dashboard/settings', label: '設定', icon: Settings }
	];
</script>

<div class="min-h-screen bg-gray-100 flex">
	<!-- サイドバー -->
	<aside class="w-64 bg-white shadow-md flex flex-col">
		<!-- ロゴエリア -->
		<div class="p-6 border-b">
			<h1 class="text-2xl font-bold text-blue-600">WEBTHQ</h1>
			<p class="text-sm text-gray-600 mt-1">Marketing Automation</p>
		</div>

		<!-- ナビゲーションメニュー -->
		<nav class="flex-1 p-4 space-y-2">
			{#each menuItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-4 py-3 rounded-lg transition {$page.url.pathname ===
					item.href
						? 'bg-blue-50 text-blue-600 font-medium'
						: 'text-gray-700 hover:bg-gray-50'}"
				>
					<svelte:component this={item.icon} size={20} class="text-blue-600" />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- ユーザー情報とログアウト -->
		<div class="p-4 border-t">
			<div class="mb-3 text-sm text-gray-600">
				<p class="font-medium">{data.session?.user?.email || 'ユーザー'}</p>
			</div>
			<button
				on:click={signOut}
				class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
			>
				ログアウト
			</button>
		</div>
	</aside>

	<!-- メインコンテンツエリア -->
	<main class="flex-1 p-8 overflow-auto">
		<slot />
	</main>
</div>
