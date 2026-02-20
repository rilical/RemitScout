ALTER TABLE silver.user_session
  ADD COLUMN IF NOT EXISTS ip_hash TEXT;

ALTER TABLE silver.telemetry_marketing_event
  ADD COLUMN IF NOT EXISTS client_ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_user_session_ip_hash
  ON silver.user_session (ip_hash)
  WHERE ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS telemetry_marketing_event_client_ip_hash_idx
  ON silver.telemetry_marketing_event (client_ip_hash)
  WHERE client_ip_hash IS NOT NULL;

COMMENT ON COLUMN silver.user_session.session_id IS 'Rotating non-persistent session identifier derived from source session signals';
COMMENT ON COLUMN silver.user_session.ip_address IS 'Truncated source IP address for coarse network analytics (IPv4 /24, IPv6 /64)';
COMMENT ON COLUMN silver.user_session.ip_hash IS 'Deterministic salted hash of the truncated IP address';
COMMENT ON COLUMN silver.user_session.user_agent IS 'Generalized browser family only (no raw user-agent string)';

COMMENT ON COLUMN silver.telemetry_marketing_event.client_ip IS 'Truncated source IP address for coarse network analytics (IPv4 /24, IPv6 /64)';
COMMENT ON COLUMN silver.telemetry_marketing_event.client_ip_hash IS 'Deterministic salted hash of the truncated client IP address';
COMMENT ON COLUMN silver.telemetry_marketing_event.user_agent IS 'Generalized browser family only (no raw user-agent string)';
