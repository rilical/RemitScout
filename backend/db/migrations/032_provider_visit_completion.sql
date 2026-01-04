ALTER TABLE silver.telemetry_provider_visit
  ADD COLUMN IF NOT EXISTS anon_session_id TEXT,
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS page_path TEXT,
  ADD COLUMN IF NOT EXISTS utm JSONB,
  ADD COLUMN IF NOT EXISTS quoted_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS quoted_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS transfer_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS transfer_date DATE,
  ADD COLUMN IF NOT EXISTS actual_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS actual_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS rate_difference_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS feedback_rating INT,
  ADD COLUMN IF NOT EXISTS feedback_notes TEXT,
  ADD COLUMN IF NOT EXISTS feedback_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS telemetry_provider_visit_anon_session_idx
  ON silver.telemetry_provider_visit (anon_session_id, visit_timestamp DESC)
  WHERE anon_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS telemetry_provider_visit_pending_idx
  ON silver.telemetry_provider_visit (user_id, visit_timestamp DESC)
  WHERE user_id IS NOT NULL AND completed_transfer IS NULL;

CREATE INDEX IF NOT EXISTS telemetry_provider_visit_completed_idx
  ON silver.telemetry_provider_visit (completed_transfer)
  WHERE completed_transfer IS NOT NULL;
