-- Add provider column to user_api_keys table to support multiple AI providers (Gemini, Claude)
ALTER TABLE user_api_keys ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'gemini' CHECK (provider IN ('gemini', 'claude'));

-- Create index for provider column
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(user_id, provider);

-- Update existing records to have 'gemini' as provider
UPDATE user_api_keys SET provider = 'gemini' WHERE provider IS NULL;
