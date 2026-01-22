CREATE TABLE IF NOT EXISTS silver.b2b_observation_snapshot (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  provider_count INTEGER NOT NULL DEFAULT 0,
  volatility_score NUMERIC,
  suggested_tier TEXT NOT NULL,
  observation_run_id UUID REFERENCES silver.b2b_sweep_run(run_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS b2b_observation_snapshot_at_idx
  ON silver.b2b_observation_snapshot (snapshot_at DESC);

CREATE INDEX IF NOT EXISTS b2b_observation_snapshot_corridor_idx
  ON silver.b2b_observation_snapshot (corridor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.b2b_observation_snapshot TO plane_b;
