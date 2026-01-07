-- Smart alert scoring tables and alert rule expansion

CREATE TABLE IF NOT EXISTS silver.rate_snapshots (
  id BIGSERIAL PRIMARY KEY,
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  collected_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (corridor_id, collected_at)
);

CREATE TABLE IF NOT EXISTS silver.rates (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id BIGINT NOT NULL REFERENCES silver.rate_snapshots(id) ON DELETE CASCADE,
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  provider_name TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS rates_snapshot_provider_idx
  ON silver.rates (snapshot_id, provider_name);
CREATE INDEX IF NOT EXISTS rates_corridor_provider_time_idx
  ON silver.rates (corridor_id, provider_name, created_at DESC);
CREATE INDEX IF NOT EXISTS rates_snapshot_corridor_idx
  ON silver.rates (snapshot_id, corridor_id);
CREATE INDEX IF NOT EXISTS rate_snapshots_corridor_time_idx
  ON silver.rate_snapshots (corridor_id, collected_at DESC);

CREATE TABLE IF NOT EXISTS silver.corridor_signals (
  corridor_id TEXT PRIMARY KEY REFERENCES silver.corridor(corridor_id),
  snapshot_id BIGINT NOT NULL REFERENCES silver.rate_snapshots(id),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  send_score INT NOT NULL,
  best_rate DOUBLE PRECISION,
  best_provider TEXT,
  spread_pct DOUBLE PRECISION,
  z_rate DOUBLE PRECISION,
  z_spread DOUBLE PRECISION,
  rate_score INT,
  risk_penalty INT,
  alert_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  algorithm_version INT NOT NULL DEFAULT 1
);

DO $$
DECLARE
  constraint_name TEXT;
  metric_col SMALLINT;
BEGIN
  SELECT attnum
    INTO metric_col
    FROM pg_attribute
   WHERE attrelid = 'silver.alert_rule'::regclass
     AND attname = 'metric'
     AND NOT attisdropped;

  IF metric_col IS NOT NULL THEN
    SELECT conname
      INTO constraint_name
      FROM pg_constraint
     WHERE conrelid = 'silver.alert_rule'::regclass
       AND contype = 'c'
       AND metric_col = ANY (conkey)
     LIMIT 1;
  END IF;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE silver.alert_rule DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conrelid = 'silver.alert_rule'::regclass
       AND conname = 'alert_rule_metric_check'
  ) THEN
    ALTER TABLE silver.alert_rule
      ADD CONSTRAINT alert_rule_metric_check
      CHECK (metric IN ('rate', 'recipientGets', 'totalCost', 'fee', 'index', 'midMarketRate', 'sendScore'));
  END IF;
END $$;

GRANT SELECT ON silver.rate_snapshots, silver.rates, silver.corridor_signals TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.rate_snapshots, silver.rates, silver.corridor_signals TO plane_b;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'rate_snapshots_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.rate_snapshots_id_seq TO plane_b;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'rates_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.rates_id_seq TO plane_b;
  END IF;
END $$;
