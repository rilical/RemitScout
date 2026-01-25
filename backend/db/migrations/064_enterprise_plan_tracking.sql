-- Migration: 064_enterprise_plan_tracking
-- Description: Add columns to track manual enterprise plan grants

ALTER TABLE silver.user_plan
  ADD COLUMN IF NOT EXISTS enterprise_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enterprise_granted_by UUID,
  ADD COLUMN IF NOT EXISTS enterprise_notes TEXT;

COMMENT ON COLUMN silver.user_plan.enterprise_granted_at IS 'Timestamp when enterprise access was manually granted by admin';
COMMENT ON COLUMN silver.user_plan.enterprise_granted_by IS 'User ID of the admin who granted enterprise access';
COMMENT ON COLUMN silver.user_plan.enterprise_notes IS 'Optional notes about the enterprise grant (company name, deal terms, etc.)';

CREATE INDEX IF NOT EXISTS idx_user_plan_enterprise_granted
  ON silver.user_plan (enterprise_granted_at)
  WHERE enterprise_granted_at IS NOT NULL;
