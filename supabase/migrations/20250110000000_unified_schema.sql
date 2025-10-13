-- ============================================
-- MAツール 統合データベーススキーマ
-- 全11テーブルを1つのマイグレーションに統合
-- ============================================

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 共通関数: 更新日時自動更新
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- テーブル定義
-- ============================================

-- 1. sites (サイト/プロジェクト管理)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sites" ON sites;
CREATE POLICY "Users can view own sites" ON sites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sites" ON sites;
CREATE POLICY "Users can insert own sites" ON sites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sites" ON sites;
CREATE POLICY "Users can update own sites" ON sites FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sites" ON sites;
CREATE POLICY "Users can delete own sites" ON sites FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view sites for public access" ON sites;
CREATE POLICY "Anyone can view sites for public access" ON sites FOR SELECT USING (true);

DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. landing_pages (LP情報)
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lp_type TEXT NOT NULL CHECK (lp_type IN ('top_page', 'product_lp', 'whitepaper', 'benefit_page')),
  content JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb,
  description TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_site_id ON landing_pages(site_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_lp_type ON landing_pages(lp_type);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own landing pages" ON landing_pages;
CREATE POLICY "Users can view own landing pages" ON landing_pages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own landing pages" ON landing_pages;
CREATE POLICY "Users can insert own landing pages" ON landing_pages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own landing pages" ON landing_pages;
CREATE POLICY "Users can update own landing pages" ON landing_pages FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own landing pages" ON landing_pages;
CREATE POLICY "Users can delete own landing pages" ON landing_pages FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view published landing pages" ON landing_pages;
CREATE POLICY "Anyone can view published landing pages" ON landing_pages FOR SELECT USING (status = 'published');

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. lp_templates (LPテンプレート)
CREATE TABLE IF NOT EXISTS lp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top_page', 'product_lp', 'whitepaper', 'benefit_page')),
  description TEXT,
  thumbnail_url TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_templates_type ON lp_templates(type);
CREATE INDEX IF NOT EXISTS idx_lp_templates_is_default ON lp_templates(is_default);

-- 4. customers (顧客情報)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'negotiation', 'customer', 'lost')),
  source_lp_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_source_lp_id ON customers(source_lp_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own customers" ON customers;
CREATE POLICY "Users can manage own customers" ON customers FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. email_campaigns (メールキャンペーン)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaigns" ON email_campaigns;
CREATE POLICY "Users can manage own campaigns" ON email_campaigns FOR ALL USING (auth.uid() = user_id);

-- 6. email_logs (メール送信ログ)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs of own campaigns" ON email_logs;
CREATE POLICY "Users can view logs of own campaigns" ON email_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM email_campaigns
    WHERE email_campaigns.id = email_logs.campaign_id
    AND email_campaigns.user_id = auth.uid()
  )
);

-- 7. company_profiles (企業プロフィール)
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON company_profiles;
CREATE POLICY "Users can manage own profile" ON company_profiles FOR ALL USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. user_api_keys (ユーザーAPIキー管理)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT DEFAULT 'gemini-1.5-flash-latest',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_is_active ON user_api_keys(user_id, is_active);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own API keys" ON user_api_keys;
CREATE POLICY "Users can view own API keys" ON user_api_keys FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own API keys" ON user_api_keys;
CREATE POLICY "Users can insert own API keys" ON user_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON user_api_keys;
CREATE POLICY "Users can update own API keys" ON user_api_keys FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON user_api_keys;
CREATE POLICY "Users can delete own API keys" ON user_api_keys FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. ai_generation_logs (AI生成履歴)
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lp_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('full_generation', 'code_edit')),
  user_prompt TEXT NOT NULL,
  generated_content TEXT,
  tokens_used INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_lp_id ON ai_generation_logs(lp_id);

ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generation logs" ON ai_generation_logs;
CREATE POLICY "Users can view own generation logs" ON ai_generation_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generation logs" ON ai_generation_logs;
CREATE POLICY "Users can insert own generation logs" ON ai_generation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. lp_edit_history (LP編集履歴)
CREATE TABLE IF NOT EXISTS lp_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'add_section', 'update_section', 'delete_section', 'reorder')),
  section_id TEXT,
  section_type TEXT,
  content_before JSONB,
  content_after JSONB,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_edit_history_landing_page_id ON lp_edit_history(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_lp_edit_history_created_at ON lp_edit_history(created_at DESC);

ALTER TABLE lp_edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own LP edit history" ON lp_edit_history;
CREATE POLICY "Users can view their own LP edit history" ON lp_edit_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own LP edit history" ON lp_edit_history;
CREATE POLICY "Users can insert their own LP edit history" ON lp_edit_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. ai_conversation_history (AI会話履歴)
CREATE TABLE IF NOT EXISTS ai_conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sections_generated JSONB,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_landing_page_id ON ai_conversation_history(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_history_created_at ON ai_conversation_history(created_at DESC);

ALTER TABLE ai_conversation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI conversations" ON ai_conversation_history;
CREATE POLICY "Users can view their own AI conversations" ON ai_conversation_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI conversations" ON ai_conversation_history;
CREATE POLICY "Users can insert their own AI conversations" ON ai_conversation_history FOR INSERT WITH CHECK (auth.uid() = user_id);
