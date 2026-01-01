-- Queue for B2C live refresh requests (Plane A enqueues, Plane B processes).

CREATE TABLE IF NOT EXISTS silver.quote_refresh_request (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  amount_bucket INT NOT NULL,
  payin_method TEXT NOT NULL,
  payout_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INT NOT NULL DEFAULT 1,
  locked_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS quote_refresh_request_unique_idx
  ON silver.quote_refresh_request (provider_id, corridor_id, amount_bucket, payin_method, payout_method);

CREATE INDEX IF NOT EXISTS quote_refresh_request_status_idx
  ON silver.quote_refresh_request (status, last_requested_at);

GRANT SELECT, INSERT, UPDATE ON silver.quote_refresh_request TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.quote_refresh_request TO plane_b;
