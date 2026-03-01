-- Migration 091: Partner Entitlements, API Keys, and Factor Normalization
-- Creates tables for B2B partner management and external factor ingestion.

BEGIN;

-- silver.partner_entitlement — B2B partner access entitlements
CREATE TABLE IF NOT EXISTS silver.partner_entitlement (
  entitlement_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      TEXT NOT NULL,
  partner_name    TEXT NOT NULL,
  plan            TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'plus', 'enterprise')),
  corridors       TEXT[] NOT NULL DEFAULT '{}',
  indices_access  BOOLEAN NOT NULL DEFAULT FALSE,
  quotes_access   BOOLEAN NOT NULL DEFAULT FALSE,
  exports_access  BOOLEAN NOT NULL DEFAULT FALSE,
  api_rate_limit  INTEGER NOT NULL DEFAULT 60,
  daily_quota     INTEGER NOT NULL DEFAULT 1000,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_entitlement_partner
  ON silver.partner_entitlement (partner_id)
  WHERE enabled = TRUE;

-- silver.partner_api_key — B2B partner API keys
CREATE TABLE IF NOT EXISTS silver.partner_api_key (
  key_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      TEXT NOT NULL,
  key_hash        TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  label           TEXT NOT NULL DEFAULT 'default',
  scopes          TEXT[] NOT NULL DEFAULT '{}',
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_partner_api_key_partner
  ON silver.partner_api_key (partner_id, enabled);

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_api_key_hash
  ON silver.partner_api_key (key_hash);

CREATE INDEX IF NOT EXISTS idx_partner_api_key_prefix
  ON silver.partner_api_key (key_prefix);

-- gold_export.factor — external signals enriching gold index computation
CREATE TABLE IF NOT EXISTS gold_export.factor (
  factor_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN (
    'fx_mid_market', 'fx_card_network', 'fx_interbank',
    'economic_indicator', 'regulatory', 'volume_proxy',
    'geopolitical', 'infrastructure'
  )),
  corridor_id     TEXT,
  currency_pair   TEXT,
  value           NUMERIC NOT NULL,
  previous_value  NUMERIC,
  unit            TEXT NOT NULL,
  confidence      TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN (
    'authoritative', 'high', 'medium', 'low', 'estimated'
  )),
  observed_at     TIMESTAMPTZ NOT NULL,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_source     TEXT NOT NULL,
  schema_version  INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_factor_name_observed
  ON gold_export.factor (name, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_factor_corridor
  ON gold_export.factor (corridor_id, observed_at DESC)
  WHERE corridor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_factor_source
  ON gold_export.factor (source, observed_at DESC);

-- gold_export.triangulated_index — triangulated corridor index values
CREATE TABLE IF NOT EXISTS gold_export.triangulated_index (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id     TEXT NOT NULL,
  amount_bucket   NUMERIC NOT NULL,
  method_profile  TEXT NOT NULL,
  date            DATE NOT NULL,
  leg1_corridor   TEXT NOT NULL,
  leg2_corridor   TEXT NOT NULL,
  leg1_teer       NUMERIC,
  leg2_teer       NUMERIC,
  triangulated_teer NUMERIC,
  triangulated_rci  NUMERIC,
  stress_score    NUMERIC,
  confidence      TEXT NOT NULL DEFAULT 'low',
  methodology_version TEXT NOT NULL DEFAULT 'triangulation_v1',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_triangulated_index_unique
  ON gold_export.triangulated_index (corridor_id, amount_bucket, method_profile, date);

CREATE INDEX IF NOT EXISTS idx_triangulated_index_date
  ON gold_export.triangulated_index (corridor_id, date DESC);

COMMIT;
