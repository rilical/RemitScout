-- Admin refresh-token storage for Plane A-issued admin sessions.
-- Supports token-family rotation and replay detection.

CREATE TABLE IF NOT EXISTS public.admin_refresh_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_family_id uuid NOT NULL,
  parent_token_id uuid NULL REFERENCES public.admin_refresh_token(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz NULL,
  rotated_at timestamptz NULL,
  revoked_at timestamptz NULL,
  revoke_reason text NULL,
  session_jti text NULL,
  created_ip_hash text NULL,
  user_agent text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT admin_refresh_token_expires_after_issue CHECK (expires_at > issued_at)
);

CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_user_id
  ON public.admin_refresh_token(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_family_id
  ON public.admin_refresh_token(token_family_id);

CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_active_expires
  ON public.admin_refresh_token(expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_refresh_token_active_jti
  ON public.admin_refresh_token(session_jti)
  WHERE revoked_at IS NULL;
