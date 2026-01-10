CREATE TABLE IF NOT EXISTS silver.telemetry_affiliate_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anon_session_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  provider_id TEXT NOT NULL,
  corridor_id TEXT,
  conversion_value NUMERIC,
  conversion_currency TEXT,
  offer_id TEXT,
  source TEXT,
  page_path TEXT,
  utm JSONB
);

CREATE INDEX IF NOT EXISTS telemetry_affiliate_conversion_user_ts_idx
  ON silver.telemetry_affiliate_conversion (user_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_affiliate_conversion_provider_ts_idx
  ON silver.telemetry_affiliate_conversion (provider_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_affiliate_conversion_corridor_ts_idx
  ON silver.telemetry_affiliate_conversion (corridor_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_affiliate_conversion_session_ts_idx
  ON silver.telemetry_affiliate_conversion (anon_session_id, ts DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_affiliate_conversion TO plane_a;
