-- Sprint 3 provider integration tables

CREATE TABLE IF NOT EXISTS silver.provider_code_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  canonical_code TEXT NOT NULL,
  corridor_id TEXT NULL,
  confidence TEXT NOT NULL DEFAULT 'observed',
  notes TEXT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_code_map_unique_idx
  ON silver.provider_code_map (provider_id, domain, provider_code, corridor_id);

CREATE INDEX IF NOT EXISTS provider_code_map_provider_idx
  ON silver.provider_code_map (provider_id);

CREATE INDEX IF NOT EXISTS provider_code_map_corridor_idx
  ON silver.provider_code_map (corridor_id);

CREATE TABLE IF NOT EXISTS silver.provider_endpoint_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  endpoint_name TEXT NOT NULL,
  http_method TEXT NOT NULL,
  url_template TEXT NOT NULL,
  headers_template_json JSONB NULL,
  body_template_json JSONB NULL,
  requires_cookie BOOLEAN NOT NULL DEFAULT false,
  requires_csrf BOOLEAN NOT NULL DEFAULT false,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_endpoint_registry_unique_idx
  ON silver.provider_endpoint_registry (provider_id, endpoint_name);

CREATE INDEX IF NOT EXISTS provider_endpoint_registry_provider_idx
  ON silver.provider_endpoint_registry (provider_id);

CREATE TABLE IF NOT EXISTS silver.provider_corridor_capability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  payin_methods TEXT[] NULL,
  payout_methods TEXT[] NULL,
  is_supported BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'observed',
  last_verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_corridor_capability_unique_idx
  ON silver.provider_corridor_capability (provider_id, corridor_id);

CREATE INDEX IF NOT EXISTS provider_corridor_capability_provider_idx
  ON silver.provider_corridor_capability (provider_id);

CREATE INDEX IF NOT EXISTS provider_corridor_capability_corridor_idx
  ON silver.provider_corridor_capability (corridor_id);

CREATE TABLE IF NOT EXISTS silver.quote_attempt (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  amount_bucket INTEGER NOT NULL,
  payin_method TEXT NULL,
  payout_method TEXT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL,
  error_type TEXT NULL,
  http_status INTEGER NULL,
  error_message TEXT NULL,
  bronze_object_key TEXT NULL,
  request_fingerprint TEXT NULL
);

CREATE INDEX IF NOT EXISTS quote_attempt_provider_idx
  ON silver.quote_attempt (provider_id);

CREATE INDEX IF NOT EXISTS quote_attempt_corridor_idx
  ON silver.quote_attempt (corridor_id);

CREATE INDEX IF NOT EXISTS quote_attempt_attempted_at_idx
  ON silver.quote_attempt (attempted_at);

CREATE TABLE IF NOT EXISTS silver.ops_alert_event (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NULL,
  corridor_id TEXT NULL,
  amount_bucket INTEGER NULL,
  proxy_country TEXT NULL,
  http_status INTEGER NULL,
  block_reason TEXT NULL,
  bronze_object_key TEXT NULL,
  request_id TEXT NULL,
  payload JSONB NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ops_alert_event_provider_idx
  ON silver.ops_alert_event (provider_id);

CREATE INDEX IF NOT EXISTS ops_alert_event_corridor_idx
  ON silver.ops_alert_event (corridor_id);

CREATE INDEX IF NOT EXISTS ops_alert_event_created_at_idx
  ON silver.ops_alert_event (created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.provider_code_map TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.provider_endpoint_registry TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.provider_corridor_capability TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.quote_attempt TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.ops_alert_event TO plane_b;

GRANT SELECT ON silver.provider_corridor_capability TO plane_c;
GRANT SELECT ON silver.quote_attempt TO plane_c;
