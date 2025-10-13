const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// 現在の色設定UIを改善版に置き換える
const oldColorUI = `\t\t\t\t\t\t\t\t<!-- 基本スタイル設定（色のみ） -->
\t\t\t\t\t\t\t\t<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
\t\t\t\t\t\t\t\t\t<div class="flex items-center gap-2 mb-2">
\t\t\t\t\t\t\t\t\t\t<Palette size={18} class="text-pink-600" />
\t\t\t\t\t\t\t\t\t\t<h4 class="font-semibold text-sm">色設定</h4>
\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t<!-- 背景色 -->
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">背景色</label>
\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\ttype="color"
\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.backgroundColor || '#ffffff'}
\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\tsection.style.backgroundColor = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\tclass="h-10 w-full rounded border border-gray-300"
\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t<!-- テキスト色 -->
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">テキスト色</label>
\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\ttype="color"
\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.textColor || '#000000'}
\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\tsection.style.textColor = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\tclass="h-10 w-full rounded border border-gray-300"
\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>`;

const newColorUI = `\t\t\t\t\t\t\t\t<!-- 基本スタイル設定（色のみ） -->
\t\t\t\t\t\t\t\t<div class="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
\t\t\t\t\t\t\t\t\t<div class="flex items-center gap-2 mb-2">
\t\t\t\t\t\t\t\t\t\t<Palette size={18} class="text-pink-600" />
\t\t\t\t\t\t\t\t\t\t<h4 class="font-semibold text-sm">色設定</h4>
\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t<!-- 背景色 -->
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">背景色</label>
\t\t\t\t\t\t\t\t\t\t<div class="flex items-center gap-2">
\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\ttype="color"
\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.backgroundColor || '#ffffff'}
\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.backgroundColor = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\tclass="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\ttype="text"
\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.backgroundColor || '#ffffff'}
\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\tconst value = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t\tif (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.backgroundColor = value;
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\tplaceholder="#ffffff"
\t\t\t\t\t\t\t\t\t\t\t\tclass="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono uppercase"
\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t<!-- テキスト色 -->
\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">テキスト色</label>
\t\t\t\t\t\t\t\t\t\t<div class="flex items-center gap-2">
\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\ttype="color"
\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.textColor || '#000000'}
\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.textColor = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\tclass="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\ttype="text"
\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.textColor || '#000000'}
\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\tconst value = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t\tif (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.textColor = value;
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\tplaceholder="#000000"
\t\t\t\t\t\t\t\t\t\t\t\tclass="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono uppercase"
\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t</div>`;

content = content.replace(oldColorUI, newColorUI);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 色設定UIを改善しました（カラーパレット正方形 + カラーコード入力対応）');
