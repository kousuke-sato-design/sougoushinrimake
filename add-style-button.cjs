const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// ニュースレターボタンの後にスタイルボタンを追加
const newsletterButton = `\t\t\t\t\t<button
\t\t\t\t\t\ton:click={() => addSection('newsletter')}
\t\t\t\t\t\tclass="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-lime-200 text-lime-700 rounded-lg hover:bg-lime-50 transition"
\t\t\t\t\t>
\t\t\t\t\t\t<Newspaper size={24} class="mb-1" />
\t\t\t\t\t\t<span class="text-sm font-semibold">ニュースレター</span>
\t\t\t\t\t</button>`;

const styleButton = `\t\t\t\t\t<button
\t\t\t\t\t\ton:click={() => addSection('style')}
\t\t\t\t\t\tclass="flex flex-col items-center justify-center px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
\t\t\t\t\t>
\t\t\t\t\t\t<Settings size={24} class="mb-1" />
\t\t\t\t\t\t<span class="text-sm font-semibold">スタイル</span>
\t\t\t\t\t</button>`;

const replacement = newsletterButton + '\n' + styleButton;

content = content.replace(newsletterButton, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ スタイルセクションボタンを追加しました');
