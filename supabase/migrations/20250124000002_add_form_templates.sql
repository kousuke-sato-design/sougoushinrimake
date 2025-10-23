-- フォームテンプレートテーブル
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- テンプレート名（例: "基本お問い合わせ"）
  description TEXT, -- 説明
  fields JSONB NOT NULL DEFAULT '[]', -- フォーム項目の配列
  is_default BOOLEAN DEFAULT false, -- デフォルトテンプレートか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view their own form templates"
  ON form_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own form templates"
  ON form_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form templates"
  ON form_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own form templates"
  ON form_templates FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX idx_form_templates_user_id ON form_templates(user_id);
CREATE INDEX idx_form_templates_is_default ON form_templates(is_default);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_form_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_templates_updated_at
  BEFORE UPDATE ON form_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_form_templates_updated_at();

-- デフォルトテンプレートを挿入する関数（オプション）
COMMENT ON TABLE form_templates IS 'フォームテンプレート管理';
COMMENT ON COLUMN form_templates.fields IS 'フォーム項目の配列（JSONB）';
COMMENT ON COLUMN form_templates.is_default IS 'デフォルトテンプレート（ユーザーごとに1つのみ推奨）';
