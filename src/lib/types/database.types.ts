// Supabase Database Types
// これらの型は後でSupabase CLIで自動生成することもできます

export type LandingPageType = 'top_page' | 'product_lp' | 'whitepaper';
export type LandingPageStatus = 'draft' | 'published';
export type CustomerStatus = 'lead' | 'negotiation' | 'customer' | 'lost';
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type EmailLogStatus = 'sent' | 'delivered' | 'bounced' | 'failed';
export type ApiStatus = 'active' | 'inactive' | 'error';
export type AiRequestType = 'full_generation' | 'code_edit';

export interface LandingPage {
	id: string;
	user_id: string;
	title: string;
	type: LandingPageType;
	html_content: string;
	css_content: string | null;
	js_content: string | null;
	logo_url: string | null;
	status: LandingPageStatus;
	slug: string;
	created_at: string;
	updated_at: string;
}

export interface Customer {
	id: string;
	user_id: string;
	company_name: string;
	contact_name: string;
	email: string;
	phone: string | null;
	position: string | null;
	industry: string | null;
	status: CustomerStatus;
	source_lp_id: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
	last_contact_at: string | null;
}

export interface EmailCampaign {
	id: string;
	user_id: string;
	subject: string;
	body: string;
	recipient_count: number;
	sent_at: string | null;
	scheduled_at: string | null;
	status: EmailCampaignStatus;
	created_at: string;
}

export interface EmailLog {
	id: string;
	campaign_id: string;
	customer_id: string;
	sent_at: string;
	opened_at: string | null;
	clicked_at: string | null;
	status: EmailLogStatus;
}

export interface CompanyProfile {
	id: string;
	user_id: string;
	company_name: string;
	logo_url: string | null;
	address: string | null;
	phone: string | null;
	email: string | null;
	website: string | null;
	primary_color: string;
	secondary_color: string;
	created_at: string;
	updated_at: string;
}

export interface ApiSettings {
	id: string;
	user_id: string;
	gemini_api_key: string;
	api_status: ApiStatus;
	last_tested_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface AiGenerationLog {
	id: string;
	user_id: string;
	lp_id: string | null;
	request_type: AiRequestType;
	user_prompt: string;
	generated_content: string | null;
	tokens_used: number | null;
	success: boolean;
	error_message: string | null;
	created_at: string;
}
