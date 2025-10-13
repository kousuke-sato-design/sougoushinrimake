const fs = require('fs');
const filePath = 'src/lib/components/sections/SectionRenderer.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// スタイルセクションのレンダリングを追加（3箇所）

// 1. 画像左レイアウト内（customの前に追加）
const imageLeftCustom = `\t\t\t\t\t\t{:else if section.type === 'custom'}
\t\t\t\t\t\t\t<div class="py-16">
\t\t\t\t\t\t\t\t{@html section.content.html}
\t\t\t\t\t\t\t</div>`;

const imageLeftStyleAndCustom = `\t\t\t\t\t\t{:else if section.type === 'style'}
\t\t\t\t\t\t\t<div class="py-16">
\t\t\t\t\t\t\t\t{#if section.content.title}
\t\t\t\t\t\t\t\t\t<h2 class="text-3xl md:text-4xl font-bold mb-4">{section.content.title}</h2>
\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t\t{#if section.content.description}
\t\t\t\t\t\t\t\t\t<p class="text-lg opacity-90">{section.content.description}</p>
\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t</div>
\t\t\t\t\t\t{:else if section.type === 'custom'}
\t\t\t\t\t\t\t<div class="py-16">
\t\t\t\t\t\t\t\t{@html section.content.html}
\t\t\t\t\t\t\t</div>`;

// 最初の出現箇所を置換（画像左レイアウト内）
content = content.replace(imageLeftCustom, imageLeftStyleAndCustom);

// 2. 画像右レイアウト内（customの前に追加）- 2回目の出現箇所
const occurrences = content.split(imageLeftCustom);
if (occurrences.length > 1) {
  // 最初の部分 + 置換 + 2番目の出現箇所を置換 + 残り
  content = occurrences[0] + imageLeftStyleAndCustom + imageLeftStyleAndCustom + occurrences.slice(2).join(imageLeftCustom);
}

// 3. 通常レイアウト内（customの前に追加）
const normalCustom = `\t\t{:else if section.type === 'custom'}
\t\t\t<div class="py-16">
\t\t\t\t{@html section.content.html}
\t\t\t</div>`;

const normalStyleAndCustom = `\t\t{:else if section.type === 'style'}
\t\t\t<div class="py-16 px-4">
\t\t\t\t<div class="container mx-auto">
\t\t\t\t\t{#if section.content.title}
\t\t\t\t\t\t<h2 class="text-3xl md:text-4xl font-bold mb-4">{section.content.title}</h2>
\t\t\t\t\t{/if}
\t\t\t\t\t{#if section.content.description}
\t\t\t\t\t\t<p class="text-lg opacity-90">{section.content.description}</p>
\t\t\t\t\t{/if}
\t\t\t\t</div>
\t\t\t</div>
\t\t{:else if section.type === 'custom'}
\t\t\t<div class="py-16">
\t\t\t\t{@html section.content.html}
\t\t\t</div>`;

content = content.replace(normalCustom, normalStyleAndCustom);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ SectionRendererにスタイルセクションのレンダリングを追加しました');
