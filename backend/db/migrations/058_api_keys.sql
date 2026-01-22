CREATE TABLE IF NOT EXISTS silver.api_key (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS api_key_hash_idx
  ON silver.api_key (key_hash);

CREATE INDEX IF NOT EXISTS api_key_user_idx
  ON silver.api_key (user_id, revoked_at, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.api_key TO plane_a;
