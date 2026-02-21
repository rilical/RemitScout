-- Account deletion requests with a grace period + cancel token.

CREATE TABLE IF NOT EXISTS public.system_account_deletion_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'cancelled', 'completed', 'expired')),
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  scheduled_for timestamptz NOT NULL,
  cancelled_at timestamptz NULL,
  completed_at timestamptz NULL,
  token_hash text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  requested_by uuid NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_account_deletion_request_user_status
  ON public.system_account_deletion_request(user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_account_deletion_request_pending_unique
  ON public.system_account_deletion_request(user_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_account_deletion_request_token_hash
  ON public.system_account_deletion_request(token_hash)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_system_account_deletion_request_scheduled_for
  ON public.system_account_deletion_request(scheduled_for)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_account_deletion_request TO plane_a;
