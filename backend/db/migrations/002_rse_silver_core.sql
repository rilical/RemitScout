DO $$ BEGIN
  CREATE TYPE stoplist_status AS ENUM ('active', 'paused', 'legal_hold');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE circuit_state AS ENUM ('open', 'half_open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ingestion_status AS ENUM ('success', 'failed', 'blocked', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('ok', 'failed', 'blocked', 'unavailable');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE method_profile AS ENUM ('standard_bank', 'standard_card', 'cash_pickup');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE SCHEMA IF NOT EXISTS gold_export;

CREATE TABLE IF NOT EXISTS silver.provider (
  provider_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  status stoplist_status NOT NULL DEFAULT 'active',
  rights_tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.corridor (
  corridor_id TEXT PRIMARY KEY,
  source_country TEXT NOT NULL,
  dest_country TEXT NOT NULL,
  source_currency TEXT NOT NULL,
  dest_currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS corridor_identity_unique_idx
  ON silver.corridor (source_country, dest_country, source_currency, dest_currency);

CREATE TABLE IF NOT EXISTS silver.ingestion_run (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL REFERENCES silver.provider(provider_id),
  collector_type TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status ingestion_status NOT NULL,
  proxy_country TEXT,
  error_code TEXT,
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.quote_record (
  quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL REFERENCES silver.provider(provider_id),
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  amount_bucket INT NOT NULL,
  payin TEXT NOT NULL,
  payout TEXT NOT NULL,
  send_amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL,
  fee_currency TEXT,
  total_debit_amount NUMERIC NOT NULL,
  receive_amount NUMERIC NOT NULL,
  implied_fx_rate NUMERIC NOT NULL,
  delivery_time_min_minutes INT,
  delivery_time_max_minutes INT,
  status quote_status NOT NULL DEFAULT 'ok',
  error_code TEXT,
  error_message TEXT,
  collected_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL,
  ingestion_run_id UUID NOT NULL REFERENCES silver.ingestion_run(run_id),
  bronze_object_key TEXT NOT NULL,
  parser_version TEXT,
  quality_flags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.latest_quote_by_provider (
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  amount_bucket INT NOT NULL,
  payin TEXT NOT NULL,
  payout TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES silver.provider(provider_id),
  collected_at TIMESTAMPTZ NOT NULL,
  send_amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL,
  total_debit_amount NUMERIC NOT NULL,
  receive_amount NUMERIC NOT NULL,
  implied_fx_rate NUMERIC NOT NULL,
  delivery_time_min_minutes INT,
  delivery_time_max_minutes INT,
  status quote_status NOT NULL DEFAULT 'ok',
  quality_flags JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS latest_quote_by_provider_unique_idx
  ON silver.latest_quote_by_provider (corridor_id, amount_bucket, payin, payout, provider_id);
CREATE INDEX IF NOT EXISTS latest_quote_by_provider_read_idx
  ON silver.latest_quote_by_provider (corridor_id, amount_bucket, payin, payout);

ALTER TABLE silver.rights_matrix
  ADD COLUMN IF NOT EXISTS collection_method TEXT,
  ADD COLUMN IF NOT EXISTS stoplist_status stoplist_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

UPDATE silver.rights_matrix
SET stoplist_status = 'active'
WHERE stoplist_status IS NULL;

CREATE TABLE IF NOT EXISTS silver.circuit_breaker (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  corridor_id TEXT,
  state circuit_state NOT NULL DEFAULT 'closed',
  reason TEXT,
  cooldown_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS circuit_breaker_provider_corridor_idx
  ON silver.circuit_breaker (provider_id, corridor_id);
CREATE INDEX IF NOT EXISTS circuit_breaker_state_idx
  ON silver.circuit_breaker (state);
CREATE INDEX IF NOT EXISTS circuit_breaker_provider_idx
  ON silver.circuit_breaker (provider_id);

-- Transitional Compatibility
-- Canonical tables: silver.provider, silver.corridor, silver.ingestion_run, silver.quote_record,
-- silver.latest_quote_by_provider.
-- Legacy tables: silver.providers, silver.corridors, silver.provider_quotes remain in use.
-- Current approach: dual-write in ingestion while endpoints migrate to canonical tables.
-- Follow-up: add compatibility views or deprecate legacy tables once runtime no longer uses them.

GRANT SELECT ON silver.provider, silver.corridor, silver.latest_quote_by_provider TO plane_a;
GRANT SELECT ON silver.provider, silver.corridor, silver.quote_record, silver.latest_quote_by_provider, silver.ingestion_run, silver.circuit_breaker TO plane_c;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.provider, silver.corridor, silver.ingestion_run, silver.quote_record, silver.latest_quote_by_provider, silver.circuit_breaker TO plane_b;

CREATE TABLE IF NOT EXISTS gold_export.cdp_daily (
  date DATE NOT NULL,
  corridor_id TEXT NOT NULL,
  amount_bucket INT NOT NULL,
  method_profile method_profile NOT NULL,
  rci_leader_bps NUMERIC,
  rci_median_bps NUMERIC,
  rci_p10_bps NUMERIC,
  rci_p90_bps NUMERIC,
  dispersion_bps NUMERIC,
  leader_edge_bps NUMERIC,
  volatility_7d NUMERIC,
  provider_count_binned INT,
  suppression_flag BOOLEAN NOT NULL DEFAULT FALSE,
  suppression_reason TEXT,
  methodology_version TEXT,
  pipeline_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, corridor_id, amount_bucket, method_profile)
);

CREATE INDEX IF NOT EXISTS cdp_daily_corridor_date_idx
  ON gold_export.cdp_daily (corridor_id, date);

GRANT USAGE ON SCHEMA gold_export TO plane_a, plane_c;
GRANT SELECT ON gold_export.cdp_daily TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.cdp_daily TO plane_c;
