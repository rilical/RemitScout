-- Runtime feature flags with immutable audit history.

CREATE TABLE IF NOT EXISTS public.system_feature_flag (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  audience_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_feature_flag_updated_at
  ON public.system_feature_flag(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.system_feature_flag_audit (
  id bigserial PRIMARY KEY,
  flag_key text NOT NULL REFERENCES public.system_feature_flag(key) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  previous_enabled boolean NULL,
  next_enabled boolean NULL,
  previous_audience_rules jsonb NULL,
  next_audience_rules jsonb NULL,
  previous_metadata jsonb NULL,
  next_metadata jsonb NULL,
  changed_by uuid NULL,
  changed_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_feature_flag_audit_flag_key
  ON public.system_feature_flag_audit(flag_key, changed_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_feature_flag_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'system_feature_flag_audit is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_feature_flag_audit_update
  ON public.system_feature_flag_audit;
CREATE TRIGGER trg_prevent_feature_flag_audit_update
BEFORE UPDATE ON public.system_feature_flag_audit
FOR EACH ROW
EXECUTE FUNCTION public.prevent_feature_flag_audit_mutation();

DROP TRIGGER IF EXISTS trg_prevent_feature_flag_audit_delete
  ON public.system_feature_flag_audit;
CREATE TRIGGER trg_prevent_feature_flag_audit_delete
BEFORE DELETE ON public.system_feature_flag_audit
FOR EACH ROW
EXECUTE FUNCTION public.prevent_feature_flag_audit_mutation();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_feature_flag TO plane_a;
GRANT SELECT, INSERT ON public.system_feature_flag_audit TO plane_a;
GRANT USAGE, SELECT ON SEQUENCE public.system_feature_flag_audit_id_seq TO plane_a;
