const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 496-524行目の色設定UIを置き換え（行番号は1ベース、配列は0ベース）
const before = lines.slice(0, 495); // 495行目まで（0-494のインデックス）
const after = lines.slice(524); // 525行目から（524のインデックスから）

const newColorUI = `\t\t\t\t\t\t\t\t\t<!-- 背景色 -->
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
\t\t\t\t\t\t\t\t\t</div>`;

const newContent = [...before, newColorUI, ...after].join('\n');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ 色設定UIを改善しました（カラーパレット正方形48px × 48px + カラーコード入力）');
