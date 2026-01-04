-- Export job tracking for user data exports

DO $$ BEGIN
  CREATE TYPE export_job_type AS ENUM (
    'history_csv',
    'history_pdf',
    'watchlist_csv',
    'watchlist_pdf',
    'alerts_csv',
    'alerts_pdf',
    'all_csv',
    'all_pdf',
    'gdpr_export'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE export_job_status AS ENUM (
    'queued',
    'running',
    'done',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS silver.export_job (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  job_type export_job_type NOT NULL,
  params JSONB,
  status export_job_status NOT NULL DEFAULT 'queued',
  s3_key TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX IF NOT EXISTS export_job_user_created_at_idx
  ON silver.export_job (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS export_job_status_created_at_idx
  ON silver.export_job (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.export_job TO plane_a;
