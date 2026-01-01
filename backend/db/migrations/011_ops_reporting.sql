-- Ops reporting tables (RPM overrides + freshness SLO)

CREATE TABLE IF NOT EXISTS silver.provider_rate_config (
  provider_id TEXT PRIMARY KEY,
  rpm INTEGER NOT NULL,
  per_corridor_rpm INTEGER NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS silver.freshness_slo_report (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  amount_bucket INTEGER NOT NULL,
  payin_method TEXT NOT NULL,
  payout_method TEXT NOT NULL,
  age_minutes DOUBLE PRECISION NULL,
  slo_minutes INTEGER NULL,
  is_stale BOOLEAN NOT NULL DEFAULT false,
  observed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS freshness_slo_report_provider_idx
  ON silver.freshness_slo_report (provider_id);

CREATE INDEX IF NOT EXISTS freshness_slo_report_corridor_idx
  ON silver.freshness_slo_report (corridor_id);

CREATE INDEX IF NOT EXISTS freshness_slo_report_observed_at_idx
  ON silver.freshness_slo_report (observed_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.provider_rate_config TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.freshness_slo_report TO plane_b;
