CREATE TABLE IF NOT EXISTS silver.b2b_sweep_schedule (
  provider_id TEXT NOT NULL,
  priority_tier TEXT NOT NULL,
  interval_seconds INTEGER NOT NULL,
  next_due_at TIMESTAMPTZ NOT NULL,
  last_enqueued_at TIMESTAMPTZ NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_id, priority_tier)
);

CREATE INDEX IF NOT EXISTS b2b_sweep_schedule_due_idx
  ON silver.b2b_sweep_schedule (enabled, next_due_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.b2b_sweep_schedule TO plane_b;
