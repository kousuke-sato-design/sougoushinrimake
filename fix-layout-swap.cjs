const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the 2-column layout
const layoutStart = content.indexOf('<!-- メインコンテンツ: 2カラムレイアウト -->');
const layoutEnd = content.indexOf('</div>\n</div>\n\n{#if form?.message}');

if (layoutStart !== -1 && layoutEnd !== -1) {
  const beforeLayout = content.substring(0, layoutStart);
  const afterLayout = content.substring(layoutEnd);

  // Extract the current left side content (editing UI)
  const leftSideStart = content.indexOf('<div class="p-6 space-y-6">', layoutStart);
  const leftSideEnd = content.indexOf('\t\t</div>\n\t</div>\n\n\t\t<!-- 右側', leftSideStart);
  const leftContent = content.substring(leftSideStart, leftSideEnd);

  // Extract the current right side content (preview/history)
  const rightSideStart = content.indexOf('<!-- タブヘッダー -->', layoutStart);
  const rightSideEnd = content.indexOf('\t\t</div>\n\t</div>\n</div>', rightSideStart);
  const rightContent = content.substring(rightSideStart, rightSideEnd);

  // Build the new swapped layout
  const newLayout = `<!-- メインコンテンツ: 2カラムレイアウト -->
\t<div class="flex h-[calc(100vh-120px)]">
\t\t<!-- 左側: プレビュー/履歴 -->
\t\t<div class="w-1/2 overflow-hidden bg-gray-100 flex flex-col border-r border-gray-200">
\t\t\t${rightContent}
\t\t</div>

\t\t<!-- 右側: 編集UI -->
\t\t<div class="w-1/2 overflow-y-auto bg-white">
\t\t\t${leftContent}
\t\t</div>
\t</div>
</div>`;

  content = beforeLayout + newLayout + afterLayout;

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ レイアウトの左右を正しく入れ替えました');
} else {
  console.log('❌ レイアウトセクションが見つかりませんでした');
}
