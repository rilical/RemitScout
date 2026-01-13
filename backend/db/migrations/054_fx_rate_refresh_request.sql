-- Queue for FX rate refresh requests (Plane A enqueues, Plane B processes).

CREATE TABLE IF NOT EXISTS silver.fx_rate_refresh_request (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INT NOT NULL DEFAULT 1,
  retry_count INT NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS fx_rate_refresh_request_unique_idx
  ON silver.fx_rate_refresh_request (base_currency, quote_currency);

CREATE INDEX IF NOT EXISTS fx_rate_refresh_request_status_idx
  ON silver.fx_rate_refresh_request (status, last_requested_at);

GRANT SELECT, INSERT, UPDATE ON silver.fx_rate_refresh_request TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.fx_rate_refresh_request TO plane_b;
