const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 502-532行目のセクション一覧部分を拡張版に置き換える
const lines = content.split('\n');

// 502行目から532行目までを削除して新しいコンテンツを挿入
const before = lines.slice(0, 501); // 501行目まで
const after = lines.slice(532); // 533行目から

const newSectionUI = `\t\t\t\t\t{#each sections as section, i}
\t\t\t\t\t\t<div class="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
\t\t\t\t\t\t\t<!-- セクションヘッダー -->
\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\ton:click={() => toggleSection(i)}
\t\t\t\t\t\t\t\tclass="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t<span class="font-semibold text-gray-800">{section.type}セクション</span>
\t\t\t\t\t\t\t\t<ChevronDown
\t\t\t\t\t\t\t\t\tsize={20}
\t\t\t\t\t\t\t\t\tclass="text-gray-400 transition-transform {expandedSections.has(i) ? 'rotate-180' : ''}"
\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t</button>

\t\t\t\t\t\t\t<!-- セクション編集エリア（展開時のみ） -->
\t\t\t\t\t\t\t{#if expandedSections.has(i)}
\t\t\t\t\t\t\t\t<div class="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
\t\t\t\t\t\t\t\t\t<!-- アクションボタン -->
\t\t\t\t\t\t\t\t\t<div class="flex items-center justify-between">
\t\t\t\t\t\t\t\t\t\t<div class="flex gap-2">
\t\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\t\ton:click={() => moveSection(i, 'up')}
\t\t\t\t\t\t\t\t\t\t\t\tdisabled={i === 0}
\t\t\t\t\t\t\t\t\t\t\t\tclass="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-30"
\t\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t\t↑ 上へ
\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\t\ton:click={() => moveSection(i, 'down')}
\t\t\t\t\t\t\t\t\t\t\t\tdisabled={i === sections.length - 1}
\t\t\t\t\t\t\t\t\t\t\t\tclass="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-30"
\t\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t\t↓ 下へ
\t\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t<button
\t\t\t\t\t\t\t\t\t\t\ton:click={() => removeSection(i)}
\t\t\t\t\t\t\t\t\t\t\tclass="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t削除
\t\t\t\t\t\t\t\t\t\t</button>
\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t<!-- スタイル設定 -->
\t\t\t\t\t\t\t\t\t<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
\t\t\t\t\t\t\t\t\t\t<div class="flex items-center gap-2 mb-2">
\t\t\t\t\t\t\t\t\t\t\t<Palette size={18} class="text-pink-600" />
\t\t\t\t\t\t\t\t\t\t\t<h4 class="font-semibold text-sm">スタイル設定</h4>
\t\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t\t<!-- 背景色 -->
\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">背景色</label>
\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\ttype="color"
\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.backgroundColor || '#ffffff'}
\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.backgroundColor = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\tclass="h-10 w-full rounded border border-gray-300"
\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t\t<!-- テキスト色 -->
\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">テキスト色</label>
\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\ttype="color"
\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.textColor || '#000000'}
\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.textColor = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\tclass="h-10 w-full rounded border border-gray-300"
\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t</div>
\t\t\t\t\t{/each}`;

const newLines = [...before, newSectionUI, ...after];

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ セクションUIを更新しました');
