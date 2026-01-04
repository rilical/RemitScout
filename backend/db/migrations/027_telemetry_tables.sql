-- Telemetry tables for search, click, and session analytics

CREATE TABLE IF NOT EXISTS silver.telemetry_search_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anon_session_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  corridor_id TEXT NOT NULL,
  amount_bucket INT NOT NULL,
  payin TEXT NOT NULL,
  payout TEXT NOT NULL,
  utm JSONB,
  page_path TEXT
);

CREATE INDEX IF NOT EXISTS telemetry_search_event_user_ts_idx
  ON silver.telemetry_search_event (user_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_search_event_corridor_ts_idx
  ON silver.telemetry_search_event (corridor_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_search_event_session_ts_idx
  ON silver.telemetry_search_event (anon_session_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_search_event_ts_idx
  ON silver.telemetry_search_event (ts DESC);

CREATE TABLE IF NOT EXISTS silver.telemetry_outbound_click (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anon_session_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  provider_id TEXT NOT NULL,
  corridor_id TEXT,
  target_url TEXT NOT NULL,
  page_path TEXT,
  utm JSONB
);

CREATE INDEX IF NOT EXISTS telemetry_outbound_click_user_ts_idx
  ON silver.telemetry_outbound_click (user_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_outbound_click_provider_ts_idx
  ON silver.telemetry_outbound_click (provider_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_outbound_click_corridor_ts_idx
  ON silver.telemetry_outbound_click (corridor_id, ts DESC);

CREATE INDEX IF NOT EXISTS telemetry_outbound_click_session_ts_idx
  ON silver.telemetry_outbound_click (anon_session_id, ts DESC);

CREATE TABLE IF NOT EXISTS silver.telemetry_session (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  anon_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engagement_count INT NOT NULL DEFAULT 0,
  first_page TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS telemetry_session_user_last_activity_idx
  ON silver.telemetry_session (user_id, last_activity DESC);

CREATE INDEX IF NOT EXISTS telemetry_session_anon_last_activity_idx
  ON silver.telemetry_session (anon_id, last_activity DESC);

CREATE INDEX IF NOT EXISTS telemetry_session_created_at_idx
  ON silver.telemetry_session (created_at DESC);

CREATE TABLE IF NOT EXISTS silver.telemetry_provider_visit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  corridor_id TEXT,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  visit_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_transfer BOOLEAN,
  returned_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS telemetry_provider_visit_provider_ts_idx
  ON silver.telemetry_provider_visit (provider_id, visit_timestamp DESC);

CREATE INDEX IF NOT EXISTS telemetry_provider_visit_user_ts_idx
  ON silver.telemetry_provider_visit (user_id, visit_timestamp DESC);

CREATE INDEX IF NOT EXISTS telemetry_provider_visit_session_ts_idx
  ON silver.telemetry_provider_visit (session_id, visit_timestamp DESC);

CREATE TABLE IF NOT EXISTS silver.telemetry_analytics_aggregate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  time_bucket TIMESTAMPTZ NOT NULL,
  dimensions JSONB,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telemetry_analytics_metric_time_idx
  ON silver.telemetry_analytics_aggregate (metric_name, time_bucket DESC);

CREATE INDEX IF NOT EXISTS telemetry_analytics_computed_idx
  ON silver.telemetry_analytics_aggregate (computed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_search_event TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_outbound_click TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_session TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_provider_visit TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.telemetry_analytics_aggregate TO plane_a;
