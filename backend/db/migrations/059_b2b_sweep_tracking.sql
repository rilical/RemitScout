DO $$
BEGIN
  CREATE TYPE sweep_run_status AS ENUM ('planned', 'running', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE sweep_task_status AS ENUM ('pending', 'processing', 'success', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS silver.b2b_sweep_run (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority_tier TEXT NOT NULL,
  cadence_minutes INTEGER NOT NULL,
  target_minutes INTEGER NOT NULL,
  observation_mode BOOLEAN NOT NULL DEFAULT false,
  status sweep_run_status NOT NULL DEFAULT 'planned',
  corridors_total INTEGER NOT NULL DEFAULT 0,
  providers_total INTEGER NOT NULL DEFAULT 0,
  enqueued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS b2b_sweep_run_tier_idx
  ON silver.b2b_sweep_run (priority_tier, created_at DESC);

CREATE INDEX IF NOT EXISTS b2b_sweep_run_status_idx
  ON silver.b2b_sweep_run (status, created_at DESC);

CREATE TABLE IF NOT EXISTS silver.b2b_sweep_task (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES silver.b2b_sweep_run(run_id) ON DELETE CASCADE,
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  provider_id TEXT NOT NULL REFERENCES silver.provider(provider_id),
  collector_type TEXT NOT NULL,
  priority_tier TEXT NOT NULL,
  amount_bucket INT NOT NULL,
  payin_method TEXT NOT NULL,
  payout_method TEXT NOT NULL,
  status sweep_task_status NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  enqueued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, provider_id, corridor_id, amount_bucket, payin_method, payout_method)
);

CREATE INDEX IF NOT EXISTS b2b_sweep_task_run_idx
  ON silver.b2b_sweep_task (run_id);

CREATE INDEX IF NOT EXISTS b2b_sweep_task_status_idx
  ON silver.b2b_sweep_task (status);

CREATE INDEX IF NOT EXISTS b2b_sweep_task_provider_corridor_idx
  ON silver.b2b_sweep_task (provider_id, corridor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.b2b_sweep_run TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.b2b_sweep_task TO plane_b;
