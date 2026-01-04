CREATE TABLE IF NOT EXISTS silver.user_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  anon_id TEXT,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT user_or_anon_check CHECK (
    (user_id IS NOT NULL) OR (anon_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_session_user_id
  ON silver.user_session(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_session_anon_id
  ON silver.user_session(anon_id)
  WHERE anon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_session_session_id
  ON silver.user_session(session_id);

CREATE INDEX IF NOT EXISTS idx_user_session_last_activity
  ON silver.user_session(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_session_active
  ON silver.user_session(is_active)
  WHERE is_active = TRUE;

COMMENT ON TABLE silver.user_session IS 'Tracks user sessions for authenticated users and guests';
COMMENT ON COLUMN silver.user_session.session_id IS 'Unique session identifier (Supabase session ID or generated UUID)';
COMMENT ON COLUMN silver.user_session.user_id IS 'Authenticated user ID (nullable for guest sessions)';
COMMENT ON COLUMN silver.user_session.anon_id IS 'Anonymous session ID for guests (nullable for authenticated users)';
COMMENT ON COLUMN silver.user_session.ip_address IS 'IP address of the session';
COMMENT ON COLUMN silver.user_session.user_agent IS 'User agent string';
COMMENT ON COLUMN silver.user_session.device_type IS 'Detected device type (mobile, desktop, tablet)';
COMMENT ON COLUMN silver.user_session.location IS 'Geolocation (country/region) if available';
COMMENT ON COLUMN silver.user_session.last_activity IS 'Last activity timestamp';
COMMENT ON COLUMN silver.user_session.expires_at IS 'Session expiration timestamp';
COMMENT ON COLUMN silver.user_session.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN silver.user_session.metadata IS 'Additional session metadata';

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.user_session TO plane_a;
