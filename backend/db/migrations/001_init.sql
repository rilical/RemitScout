CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE IF NOT EXISTS bronze.provider_raw (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  corridor TEXT NOT NULL,
  payload JSONB NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  reliability NUMERIC,
  methods TEXT[] NOT NULL DEFAULT '{}',
  best_for TEXT,
  homepage_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.corridors (
  id TEXT PRIMARY KEY,
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  send_currency TEXT NOT NULL,
  recv_currency TEXT NOT NULL,
  label TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.provider_quotes (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES silver.providers(id),
  corridor_id TEXT NOT NULL REFERENCES silver.corridors(id),
  fee NUMERIC NOT NULL,
  margin_pct NUMERIC NOT NULL,
  fx_rate NUMERIC NOT NULL,
  delivery TEXT NOT NULL,
  methods TEXT[] NOT NULL,
  reliability NUMERIC NOT NULL,
  best_for TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, corridor_id)
);

CREATE TABLE IF NOT EXISTS silver.recent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  best_provider_name TEXT,
  best_provider_recipient NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.clicks (
  id BIGSERIAL PRIMARY KEY,
  provider_id TEXT,
  corridor_id TEXT,
  amount NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.newsletter_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.rights_matrix (
  provider_id TEXT PRIMARY KEY,
  allowed_collect BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_b2c BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_b2b BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gold.fx_rates (
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (base_currency, quote_currency)
);

CREATE TABLE IF NOT EXISTS gold.fx_provider_rates (
  provider_name TEXT NOT NULL,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  markup_bps INTEGER,
  speed TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider_name, base_currency, quote_currency)
);

CREATE TABLE IF NOT EXISTS gold.popular_corridors (
  route TEXT PRIMARY KEY,
  count_24h INTEGER NOT NULL,
  top_provider TEXT,
  fee_range TEXT,
  speed_range TEXT,
  best_for TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gold.pulse_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'plane_a') THEN
    CREATE ROLE plane_a LOGIN PASSWORD 'plane_a';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'plane_b') THEN
    CREATE ROLE plane_b LOGIN PASSWORD 'plane_b';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'plane_c') THEN
    CREATE ROLE plane_c LOGIN PASSWORD 'plane_c';
  END IF;
END $$;

REVOKE ALL ON SCHEMA bronze FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA bronze FROM PUBLIC;

GRANT USAGE ON SCHEMA silver, gold TO plane_a;
GRANT SELECT ON ALL TABLES IN SCHEMA silver, gold TO plane_a;
GRANT INSERT ON silver.recent_searches, silver.clicks, silver.newsletter_subscriptions TO plane_a;

GRANT USAGE ON SCHEMA gold TO plane_c;
GRANT SELECT ON ALL TABLES IN SCHEMA gold TO plane_c;

GRANT USAGE ON SCHEMA bronze, silver, gold TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bronze, silver, gold TO plane_b;

ALTER DEFAULT PRIVILEGES IN SCHEMA silver GRANT SELECT ON TABLES TO plane_a, plane_c, plane_b;
ALTER DEFAULT PRIVILEGES IN SCHEMA silver GRANT INSERT ON TABLES TO plane_a, plane_b;
ALTER DEFAULT PRIVILEGES IN SCHEMA gold GRANT SELECT ON TABLES TO plane_a, plane_c, plane_b;
ALTER DEFAULT PRIVILEGES IN SCHEMA bronze GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO plane_b;
