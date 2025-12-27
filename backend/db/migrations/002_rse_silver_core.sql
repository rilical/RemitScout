CREATE TYPE IF NOT EXISTS stoplist_status AS ENUM ('active', 'paused', 'legal_hold');
CREATE TYPE IF NOT EXISTS circuit_state AS ENUM ('open', 'half_open', 'closed');
CREATE TYPE IF NOT EXISTS ingestion_status AS ENUM ('success', 'failed', 'blocked', 'skipped');

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
  send_currency TEXT NOT NULL,
  receive_currency TEXT NOT NULL,
  send_country TEXT,
  receive_country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  send_amount NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL,
  fee_currency TEXT,
  receive_amount NUMERIC NOT NULL,
  implied_fx_rate NUMERIC NOT NULL,
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
  receive_amount NUMERIC NOT NULL,
  implied_fx_rate NUMERIC NOT NULL,
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
-- Existing tables: silver.providers, silver.corridors, silver.provider_quotes remain in use.
-- New tables: silver.provider, silver.corridor, silver.ingestion_run, silver.quote_record,
-- silver.latest_quote_by_provider.
-- If runtime still references old names, keep old tables or add views in a follow-up migration.
