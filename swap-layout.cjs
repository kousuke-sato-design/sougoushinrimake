const fs = require('fs');
const filePath = 'src/routes/dashboard/landing-pages/[id]/edit/+page.svelte';
let content = fs.readFileSync(filePath, 'utf8');

// メインコンテンツの2カラムレイアウトを探して入れ替える
// 左側と右側のコメントとクラスを変更

// 左側のコメントとクラスを入れ替え
content = content.replace(
  /<!-- 左側: 編集UI -->\n\t\t<div class="w-1\/2 overflow-y-auto border-r border-gray-200 bg-white">/,
  '<!-- 左側: プレビュー\/履歴 -->\n\t\t<div class="w-1/2 overflow-hidden bg-gray-100 flex flex-col border-r border-gray-200">'
);

// 右側のコメントとクラスを入れ替え
content = content.replace(
  /<!-- 右側: プレビュー\/履歴タブ -->\n\t\t<div class="w-1\/2 overflow-hidden bg-gray-100 flex flex-col">/,
  '<!-- 右側: 編集UI -->\n\t\t<div class="w-1/2 overflow-y-auto bg-white">'
);

// 変数名も変更（rightPanelTab -> leftPanelTab）
content = content.replace(/rightPanelTab/g, 'leftPanelTab');

// セクション一覧のdivタグを調整（p-6 space-y-6を持つ部分）
// 元の左側の構造をもっと汎用的にマッチングする

// 実際に2つのセクションを入れ替えるには、特定の開始・終了マーカーを使用
// 左側の開始: <!-- 左側
// 左側の終了: </div>\n\n\t\t<!-- 右側
// 右側の開始: <!-- 右側
// 右側の終了: </div>\n\t</div>\n</div>

// より簡単な方法として、全体のレイアウト部分を抽出して順番を入れ替える
const layoutStart = content.indexOf('<!-- メインコンテンツ: 2カラムレイアウト -->');
const layoutEnd = content.indexOf('</div>\n</div>\n\n{#if form?.message}');

if (layoutStart !== -1 && layoutEnd !== -1) {
  const layoutSection = content.substring(layoutStart, layoutEnd);

  // 左側のdivブロックを抽出（開始から最初の閉じdivペアまで）
  const leftSideMatch = layoutSection.match(/(<!-- 左側:.*?-->\n\t\t<div class=".*?">)([\s\S]*?)(\n\t\t<\/div>\n\n\t\t<!-- 右側)/);

  // 右側のdivブロックを抽出
  const rightSideMatch = layoutSection.match(/(<!-- 右側:.*?-->\n\t\t<div class=".*?">)([\s\S]*?)(\n\t\t<\/div>\n\t<\/div>)/);

  if (leftSideMatch && rightSideMatch) {
    // 左側と右側のコンテンツを入れ替え
    const newLeftStart = '<!-- 左側: プレビュー/履歴 -->\n\t\t<div class="w-1/2 overflow-hidden bg-gray-100 flex flex-col border-r border-gray-200">';
    const newRightStart = '<!-- 右側: 編集UI -->\n\t\t<div class="w-1/2 overflow-y-auto bg-white">\n\t\t\t<div class="p-6 space-y-6">';

    const leftContent = leftSideMatch[2];
    const rightContent = rightSideMatch[2];

    // 新しいレイアウトを構築
    const newLayout = `<!-- メインコンテンツ: 2カラムレイアウト -->
\t<div class="flex h-[calc(100vh-120px)]">
\t\t${newLeftStart}
${rightContent}
\t\t</div>

\t\t${newRightStart}
${leftContent}
\t\t\t</div>
\t\t</div>
\t</div>`;

    content = content.substring(0, layoutStart) + newLayout + content.substring(layoutEnd);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('左右のレイアウトを入れ替えました');
