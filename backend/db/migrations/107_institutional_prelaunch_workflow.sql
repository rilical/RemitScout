-- Migration: 107_institutional_prelaunch_workflow
-- Purpose: Support suspended prelaunch institutional onboarding metadata.

ALTER TABLE public.institutional_client
  ADD COLUMN IF NOT EXISTS internal_owner_email TEXT,
  ADD COLUMN IF NOT EXISTS compliance_notes TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prelaunch_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.institutional_client.internal_owner_email IS
  'Internal owner responsible for getting the client through prelaunch readiness.';

COMMENT ON COLUMN public.institutional_client.compliance_notes IS
  'Compliance and onboarding notes captured before live activation.';

COMMENT ON COLUMN public.institutional_client.onboarding_checklist IS
  'Operator-owned prelaunch readiness checklist for the institutional client.';

COMMENT ON COLUMN public.institutional_client.prelaunch_config IS
  'Non-live configuration captured before the launch gate opens (webhook draft, export intent, etc.).';
