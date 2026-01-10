CREATE TABLE IF NOT EXISTS silver.telemetry_marketing_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  event_source_url TEXT,
  anon_session_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  provider_id TEXT,
  corridor_id TEXT,
  conversion_value NUMERIC,
  conversion_currency TEXT,
  source TEXT,
  page_path TEXT,
  utm JSONB,
  fbclid TEXT,
  fbc TEXT,
  fbp TEXT,
  client_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS telemetry_marketing_event_id_uidx
  ON silver.telemetry_marketing_event (event_id);

CREATE INDEX IF NOT EXISTS telemetry_marketing_event_name_ts_idx
  ON silver.telemetry_marketing_event (event_name, event_time DESC);

CREATE INDEX IF NOT EXISTS telemetry_marketing_event_provider_ts_idx
  ON silver.telemetry_marketing_event (provider_id, event_time DESC);

CREATE INDEX IF NOT EXISTS telemetry_marketing_event_corridor_ts_idx
  ON silver.telemetry_marketing_event (corridor_id, event_time DESC);

CREATE INDEX IF NOT EXISTS telemetry_marketing_event_user_ts_idx
  ON silver.telemetry_marketing_event (user_id, event_time DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_marketing_event TO plane_a;
