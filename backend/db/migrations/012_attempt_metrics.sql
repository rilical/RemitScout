-- Collector attempt metrics for effective RPM calculation

CREATE TABLE IF NOT EXISTS silver.collector_attempt_metrics (
  provider_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  avg_attempt_seconds DOUBLE PRECISION NOT NULL,
  sample_count INTEGER NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, locale)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.collector_attempt_metrics TO plane_b;
