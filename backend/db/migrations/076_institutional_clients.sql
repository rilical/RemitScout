-- Migration: 076_institutional_clients
-- Purpose: Institutional (B2B) client API keys, corridor allowlists, and usage logging.

CREATE TABLE IF NOT EXISTS public.institutional_client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_prefix TEXT NOT NULL CHECK (client_prefix <> '' AND position('/' in client_prefix) = 0),
  api_key_hash TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('trial', 'standard', 'premium')),
  corridors_allowed TEXT[] NULL,
  rate_limit_rpm INT NOT NULL CHECK (rate_limit_rpm >= 0),
  rate_limit_daily INT NOT NULL CHECK (rate_limit_daily >= 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'revoked')),
  nda_signed_at TIMESTAMPTZ NULL,
  contract_start DATE NULL,
  contract_end DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS institutional_client_api_key_hash_uidx
  ON public.institutional_client (api_key_hash);

CREATE UNIQUE INDEX IF NOT EXISTS institutional_client_client_prefix_uidx
  ON public.institutional_client (client_prefix);

CREATE INDEX IF NOT EXISTS institutional_client_status_idx
  ON public.institutional_client (status);

CREATE INDEX IF NOT EXISTS institutional_client_contract_end_idx
  ON public.institutional_client (contract_end);

CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.institutional_client(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  corridor_id TEXT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time_ms INT NULL,
  status_code INT NULL
);

CREATE INDEX IF NOT EXISTS api_usage_log_client_ts_idx
  ON public.api_usage_log (client_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS api_usage_log_client_endpoint_ts_idx
  ON public.api_usage_log (client_id, endpoint, timestamp DESC);

-- Explicit grants (do not rely on default public schema permissions).
GRANT USAGE ON SCHEMA public TO plane_a, plane_b, plane_c;
GRANT SELECT ON public.institutional_client TO plane_a, plane_b, plane_c;
GRANT SELECT, INSERT ON public.api_usage_log TO plane_a;
