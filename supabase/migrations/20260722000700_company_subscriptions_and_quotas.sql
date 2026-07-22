-- Add subscription plan, active quotas, and features to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'Pilot Promo',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS job_slots_quota INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS assessment_slots_quota INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS employee_quota INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS whatsapp_support_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dedicated_account_manager BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
