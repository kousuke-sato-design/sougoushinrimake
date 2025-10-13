const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// スタイルセクション用の編集UIを追加（contact sectionの後、プレースホルダーの前）
const placeholder = `\t\t\t\t\t\t\t\t\t<!-- その他のセクションタイプ用のプレースホルダー -->
\t\t\t\t\t\t\t\t\t{#if !['hero', 'features', 'cta', 'contact'].includes(section.type)}
\t\t\t\t\t\t\t\t\t\t<p class="text-sm text-gray-500">このセクションタイプのコンテンツ編集は開発中です</p>
\t\t\t\t\t\t\t\t\t{/if}`;

const styleEditUI = `\t\t\t\t\t\t\t\t\t<!-- Style Section -->
\t\t\t\t\t\t\t\t\t{#if section.type === 'style'}
\t\t\t\t\t\t\t\t\t\t<div class="space-y-3">
\t\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
\t\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\t\ttype="text"
\t\t\t\t\t\t\t\t\t\t\t\t\tbind:value={section.content.title}
\t\t\t\t\t\t\t\t\t\t\t\t\tclass="w-full px-3 py-2 border border-gray-300 rounded text-sm"
\t\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">説明文</label>
\t\t\t\t\t\t\t\t\t\t\t\t<textarea
\t\t\t\t\t\t\t\t\t\t\t\t\tbind:value={section.content.description}
\t\t\t\t\t\t\t\t\t\t\t\t\trows="3"
\t\t\t\t\t\t\t\t\t\t\t\t\tclass="w-full px-3 py-2 border border-gray-300 rounded text-sm"
\t\t\t\t\t\t\t\t\t\t\t\t></textarea>
\t\t\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t\t\t<!-- 背景画像設定 -->
\t\t\t\t\t\t\t\t\t\t\t<div class="border-t border-gray-200 pt-3">
\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">背景画像</label>
\t\t\t\t\t\t\t\t\t\t\t\t<ImageUploader
\t\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.backgroundImage || ''}
\t\t\t\t\t\t\t\t\t\t\t\t\tonUpload={(url) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.backgroundImage = url;
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t\t{#if section.style?.backgroundImage}
\t\t\t\t\t\t\t\t\t\t\t\t\t<div class="mt-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-1">背景画像の透明度</label>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<input
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\ttype="range"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tmin="0"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tmax="1"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tstep="0.1"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.style?.backgroundImageOpacity || 1}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\ton:input={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.style) section.style = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.style.backgroundImageOpacity = parseFloat(e.target.value);
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tclass="w-full"
\t\t\t\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<span class="text-xs text-gray-500">{Math.round((section.style?.backgroundImageOpacity || 1) * 100)}%</span>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t\t\t\t\t</div>

\t\t\t\t\t\t\t\t\t\t\t<!-- 2カラム画像レイアウト -->
\t\t\t\t\t\t\t\t\t\t\t<div class="border-t border-gray-200 pt-3">
\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">レイアウトタイプ</label>
\t\t\t\t\t\t\t\t\t\t\t\t<select
\t\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.images?.layout || ''}
\t\t\t\t\t\t\t\t\t\t\t\t\ton:change={(e) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.images) section.images = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.images.layout = e.target.value;
\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\tclass="w-full px-3 py-2 border border-gray-300 rounded text-sm"
\t\t\t\t\t\t\t\t\t\t\t\t>
\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="">レイアウトなし</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="image-left">画像左・テキスト右</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="image-right">画像右・テキスト左</option>
\t\t\t\t\t\t\t\t\t\t\t\t\t<option value="two-column">2カラム画像</option>
\t\t\t\t\t\t\t\t\t\t\t\t</select>

\t\t\t\t\t\t\t\t\t\t\t\t{#if section.images?.layout === 'image-left' || section.images?.layout === 'image-right'}
\t\t\t\t\t\t\t\t\t\t\t\t\t<div class="mt-3">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t{section.images.layout === 'image-left' ? '左側の画像' : '右側の画像'}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</label>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<ImageUploader
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.images?.layout === 'image-left' ? (section.images?.leftImage || '') : (section.images?.rightImage || '')}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tonUpload={(url) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.images) section.images = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (section.images.layout === 'image-left') {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.images.leftImage = url;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.images.rightImage = url;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t{/if}

\t\t\t\t\t\t\t\t\t\t\t\t{#if section.images?.layout === 'two-column'}
\t\t\t\t\t\t\t\t\t\t\t\t\t<div class="mt-3 space-y-3">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">左側の画像</label>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<ImageUploader
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.images?.leftImage || ''}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tonUpload={(url) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.images) section.images = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.images.leftImage = url;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t<div>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<label class="block text-xs font-medium text-gray-700 mb-2">右側の画像</label>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t<ImageUploader
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tvalue={section.images?.rightImage || ''}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tonUpload={(url) => {
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tif (!section.images) section.images = {};
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsection.images.rightImage = url;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tsections = sections;
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t}}
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t/>
\t\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t\t\t\t{/if}

\t\t\t\t\t\t\t\t\t<!-- その他のセクションタイプ用のプレースホルダー -->
\t\t\t\t\t\t\t\t\t{#if !['hero', 'features', 'cta', 'contact', 'style'].includes(section.type)}
\t\t\t\t\t\t\t\t\t\t<p class="text-sm text-gray-500">このセクションタイプのコンテンツ編集は開発中です</p>
\t\t\t\t\t\t\t\t\t{/if}`;

content = content.replace(placeholder, styleEditUI);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ スタイルセクション編集UIを追加しました（背景画像、2カラムレイアウト対応）');
