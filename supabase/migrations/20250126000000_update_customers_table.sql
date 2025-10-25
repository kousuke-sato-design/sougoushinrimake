-- customersテーブルを更新してフォーム送信に対応
-- 1. custom_fields列を追加 (JSONB型) - カスタムフィールドを保存
-- 2. company_nameのNOT NULL制約を削除 - 必須ではないフォームに対応
-- 3. contact_nameのNOT NULL制約を削除 - emailのみ必須に変更

ALTER TABLE customers
ALTER COLUMN company_name DROP NOT NULL,
ALTER COLUMN contact_name DROP NOT NULL;

-- custom_fields列を追加
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
