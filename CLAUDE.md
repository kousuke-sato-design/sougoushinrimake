# MAツール要件定義書

## プロジェクト概要
BtoB企業向けMAツール。LP作成（AI生成対応）、顧客管理、メール配信機能を提供。

## 技術スタック
- **フロントエンド**: SvelteKit + TypeScript + Tailwind CSS
- **バックエンド**: Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **AI**: Gemini 2.5 API (LP自動生成、コード編集アシスタント、画像解析)

---

## 主要機能

### 1. LP作成・編集 (`/dashboard/landing-pages`)

#### LP編集画面の構成
**2カラムレイアウト:**
- **左側**: セクション一覧とAIアシスタント
- **右側**: 3タブUI（プレビュー / ソースコード / 履歴）

#### 右側タブの機能詳細

**① プレビュータブ**
- リアルタイムプレビュー表示
- セクションのレンダリング結果を確認

**② ソースコードタブ** ⭐ **NEW**
- セクション毎に個別編集可能
- **編集可能**: `content`と`style`のみ（JSON形式）
- **読み取り専用**: `id`, `type`, `order`（構造保護）
- **安全機能**:
  - セクション構造の破壊を防止
  - JSON検証とエラー表示
  - 個別保存（1セクションずつ）
  - セクション追加・削除・並び替えは左側UIのみ

**③ 履歴タブ**
- 編集履歴表示
- AI会話履歴表示

#### LPタイプ（3種類）
1. **トップページ**: ヒーロー、特徴、実績、CTA、フッター
2. **商品LP**: ヒーロー、問題提起、解決策、お客様の声、FAQ、フォーム、フッター
3. **ホワイトペーパー**: ヒーロー、目次、ダウンロードフォーム、メリット、関連資料、フッター

#### セクションタイプ
**1カラム**: hero, features, cta, contact, pricing, testimonials, faq, team, stats, gallery, video, newsletter

**2カラム**: two_column_text_image, two_column_image_text, two_column_text_video, two_column_features_image, two_column_text_contact, two_column_contact_image

#### データ構造
```typescript
// landing_pages テーブル
{
  id: string,
  user_id: string,
  site_id: string,
  title: string,
  lp_type: 'product_lp' | 'benefit_page' | 'whitepaper',
  status: 'draft' | 'published' | 'archived',
  slug: string,
  content: {
    sections: Section[]
  }
}

// Section構造
{
  id: string,           // 読み取り専用
  type: string,         // 読み取り専用
  order: number,        // 読み取り専用
  content: object,      // 編集可能
  style?: {             // 編集可能
    backgroundColor?: string,
    textColor?: string,
    padding?: string,
    ...
  }
}
```

#### ソースコード編集の安全設計
```typescript
// セクション毎の保存処理
async function saveSectionSource(index: number) {
  const parsed = JSON.parse(sectionSourceCodes[index]);

  // バリデーション
  if (!parsed.content) throw Error('contentは必須');
  if (parsed.style && typeof parsed.style !== 'object') throw Error('styleはオブジェクト形式');

  // 構造的な部分は保持し、contentとstyleのみ更新
  sections[index] = {
    ...sections[index],      // id, type, orderを保持
    content: parsed.content,
    style: parsed.style || sections[index].style
  };

  await saveContent();
}
```

---

### 2. AI機能（Gemini 2.5）

#### AIアシスタント（左側パネル）
- 自然言語でセクション追加・編集指示
- 会話履歴の保存・管理
- ストリーミングレスポンス対応

#### AI LP自動生成
1. ロゴ画像解析（ブランドカラー抽出、業種推定）
2. コンテンツ生成（キャッチコピー、見出し、本文）
3. デザイン生成（Tailwind CSS、レスポンシブ対応）

---

### 3. 顧客管理 (`/dashboard/customers`)
- テーブル表示: 企業名、担当者、メール、電話、ステータス
- CRUD操作、CSV インポート/エクスポート
- LPフォームから自動登録（`source_lp_id`記録）

---

### 4. メール送信 (`/dashboard/email`)
- 送信先選択（個別/セグメント）
- リッチテキストエディタ
- パーソナライゼーション変数: `{{name}}`, `{{company_name}}`, `{{email}}`
- Resend API統合（無料枠3,000通/月）

---

### 5. 設定

#### 企業情報設定 (`/dashboard/settings/company`)
- ロゴアップロード、ブランドカラー設定

#### API設定 (`/dashboard/ai-api`)
- Gemini APIキー管理（複数登録可能）
- アクティブキー切り替え
- モデル選択: `gemini-1.5-flash-latest`, `gemini-1.5-pro-latest`

---

## データベーススキーマ（Supabase）

### 主要テーブル
1. `sites` - サイト/プロジェクト管理
2. `landing_pages` - LP情報（content: JSONBにsections配列）
3. `lp_templates` - LPテンプレート
4. `customers` - 顧客情報（source_lp_id, custom_fields追加済み）
5. `email_campaigns` - メールキャンペーン
6. `email_logs` - メール送信ログ
7. `company_profiles` - 企業プロフィール
8. `user_api_keys` - APIキー管理
9. `ai_generation_logs` - AI生成履歴
10. `lp_edit_history` - LP編集履歴
11. `ai_conversation_history` - AI会話履歴
12. **`form_templates`** ⭐ - フォームテンプレート（fields: JSONB配列）
13. **`imap_accounts`** ⭐ - IMAP/SMTP設定（Gmail対応）
14. **`email_settings`** ⭐ - メールテンプレート（imap_account_id参照）

**共通仕様:**
- 全テーブルにRLS有効化（user_idでアクセス制御）
- `updated_at`自動更新トリガー
- Storage: `logos`, `images`バケット（PNG, JPG, SVG, WEBP, 最大5MB）

---

## 認証・ルーティング

### 認証フロー
```
/ → 未ログイン: ログインフォーム / ログイン済み: /dashboard
/dashboard/* → 認証必須（hooks.server.ts）
/WEBTHQ/{site_slug}/{lp_slug} → 公開LP（認証不要）
```

---

## 開発優先順位

### ✅ 完了済み
- 認証（ログイン/ログアウト）
- ダッシュボードレイアウト
- LP作成・編集（セクションベース）
- **セクション別ソースコード編集** ⭐
- AIアシスタント（会話型）
- API設定（複数APIキー管理）
- 顧客管理（CRUD）
- 画像ギャラリー（Supabase Storage統合、2カラムセクション画像も表示）
- 編集履歴・AI会話履歴
- **問い合わせフォーム機能**:
  - インライン/専用ページ切り替え
  - 2カラム問い合わせセクション（テキスト+問い合わせ、問い合わせ+画像）
  - ボタンリンククイック選択（Hero/CTA/2カラムから問い合わせへ自動リンク）
- **フォームテンプレート機能** ⭐ **NEW**:
  - テンプレート管理ページ（`/dashboard/form-templates`）
  - プリセット（基本/ビジネス/資料DL）
  - LP編集でテンプレート選択のみ（手動編集削除）
  - 自動保存機能
- **IMAP/メール設定**:
  - IMAP設定管理（Gmail対応、アプリパスワード）
  - メールテンプレート管理
  - 自動返信メール設定（問い合わせセクションと連携）

### 🚧 実装中
- **次のステップ**: フォーム送信API実装
  - `/api/submit-form` エンドポイント作成
  - 顧客データ保存（customersテーブル）
  - 自動返信メール送信（IMAP経由）
- CSV インポート/エクスポート
- LP公開ページ最適化

### 📋 未実装
- アナリティクス統合
- メールトラッキング（開封率、クリック率）
- A/Bテスト
- SEO/OGP最適化

---

## セキュリティ要件
- RLS全テーブル適用（必須）
- APIキーの暗号化保存
- XSS/CSRF対策
- CORS設定（公開LP用）

---

## パフォーマンス要件
- ページロード < 3秒
- 画像最適化（WebP、遅延ロード）
- コードスプリッティング
- レスポンシブ対応（モバイル/タブレット/デスクトップ）

---

## Gemini API仕様

### 推奨モデル
- `gemini-1.5-flash-latest`: 高速、一般的な生成（推奨）
- `gemini-1.5-pro-latest`: 高性能、複雑なコード生成

### コスト目安
- 1LP生成 ≈ 2,000-3,000トークン
- 月100LP生成 ≈ $1-2

### 実装
- Edge Functions経由のみ（フロントエンドに非露出）
- ユーザーAPIキー使用（アプリケーション側で負担なし）
- ストリーミングレスポンス対応

---

## 注意事項

### ソースコード編集の安全ルール
1. **編集可能**: `content`と`style`のみ
2. **読み取り専用**: `id`, `type`, `order`
3. **セクション操作**: 追加・削除・並び替えは左側UIのみ
4. **バリデーション**: JSON形式チェック、必須フィールド検証
5. **個別保存**: セクション毎に保存（他のセクションに影響しない）

### データ整合性
- セクション構造の破壊を防止
- 編集中のエラーはそのセクションのみに限定
- 左側UI（直感的編集）と右側ソースコード（詳細編集）の同期

---

## 開発期間目安
- MVP: 2〜3週間 ✅
- AI機能: 1〜2週間 ✅
- 機能拡張: 1〜2週間 🚧
- **合計: 4〜7週間**

---

## Claude Code作業履歴記録ルール ⭐ **重要**

### 自動記録の仕組み

Claude Codeで作業する際は、**必ず**以下のルールに従って作業履歴を記録すること:

#### 1. 作業セッション開始時（必須）
```javascript
import { startWorkSession } from '$lib/utils/workSession';

// 作業開始時に必ず実行
await startWorkSession();
```

#### 2. ソースコード変更時（必須）
- ソースコードを変更した場合、**必ず**簡潔な日本語で作業内容を記録
- 変更したファイルのパスも記録

```javascript
import { recordWorkDescription } from '$lib/utils/workSession';

// ファイル変更後に実行
await recordWorkDescription(
  "問い合わせフォームの専用タブを追加し、セクション挿入UIを改善",
  [
    "src/routes/dashboard/landing-pages/[id]/edit/+page.svelte",
    "src/lib/components/WorkHistory.svelte"
  ]
);
```

#### 3. 作業セッション終了時（必須）
```javascript
import { endWorkSession } from '$lib/utils/workSession';

// 作業終了時に必ず実行
await endWorkSession("本日の作業完了");
```

### 記録すべき情報

1. **作業日付**: 自動記録
2. **作業時間**: 開始〜終了時刻から自動計算
3. **作業内容**: 日本語で簡潔に記述（例: 「セクション追加機能を実装」「バグ修正」）
4. **変更ファイル**: 変更したファイルのパスリスト

### 作業履歴の確認方法

- サイドバーの「作業履歴」メニューから確認
- 日付ごとにグループ化され、合計作業時間も表示される

### 注意事項

- **ソースコード変更がない場合は記録不要**
- 単なる閲覧、検索、ファイル読み込みは記録しない
- 実際にファイルを編集・作成・削除した場合のみ記録
- 作業内容は具体的かつ簡潔に（例: 「○○機能を追加」「○○のバグを修正」）

### データベーススキーマ

```sql
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_date DATE,           -- 作業日
  start_time TIMESTAMPTZ,      -- 開始時刻
  end_time TIMESTAMPTZ,        -- 終了時刻
  duration_minutes INTEGER,    -- 作業時間（分）
  description TEXT,            -- 作業内容
  changes JSONB               -- 変更ファイルリスト
);
```
