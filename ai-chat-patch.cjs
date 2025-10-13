const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Botアイコンをインポートに追加
content = content.replace(
  /import \{\n\t\tSparkles,/,
  'import {\n\t\tBot,\n\t\tSparkles,'
);

// 2. AI Chatセクションの構造を変更
const oldAISection = `\t\t\t<!-- AI Chat Interface -->
\t\t\t\t<div class="bg-white rounded-lg border-2 border-gray-200">
\t\t\t\t\t<!-- APIキー選択ドロップダウン -->`;

const newAISection = `\t\t\t<!-- AI Chat Interface -->
\t\t\t\t<div class="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
\t\t\t\t\t<!-- AIチャットヘッダー（折りたたみ可能） -->
\t\t\t\t\t<button
\t\t\t\t\t\ton:click={() => (aiChatExpanded = !aiChatExpanded)}
\t\t\t\t\t\tclass="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-200"
\t\t\t\t\t>
\t\t\t\t\t\t<div class="flex items-center gap-3">
\t\t\t\t\t\t\t<span class="text-pink-600">
\t\t\t\t\t\t\t\t<Bot size={20} />
\t\t\t\t\t\t\t</span>
\t\t\t\t\t\t\t<div class="text-left">
\t\t\t\t\t\t\t\t<span class="font-semibold text-gray-800">AI アシスタント</span>
\t\t\t\t\t\t\t\t<p class="text-xs text-gray-500 mt-0.5">会話しながらセクションを作成</p>
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<ChevronDown
\t\t\t\t\t\t\tsize={20}
\t\t\t\t\t\t\tclass="text-gray-400 transition-transform {aiChatExpanded ? 'rotate-180' : ''}"
\t\t\t\t\t\t/>
\t\t\t\t\t</button>

\t\t\t\t\t{#if aiChatExpanded}
\t\t\t\t\t<!-- APIキー選択ドロップダウン -->`;

content = content.replace(oldAISection, newAISection);

// 3. AIチャットの終わりに {/if} を追加
const oldAIEnd = `\t\t\t\t</div>

\t\t\t\t<!-- テンプレートとして保存 -->`;

const newAIEnd = `\t\t\t\t\t{/if}
\t\t\t\t</div>

\t\t\t\t<!-- テンプレートとして保存 -->`;

content = content.replace(oldAIEnd, newAIEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AIチャットに折りたたみ機能を追加しました');
