-- Migration: 081_pulse_watchlist
-- Purpose: Pinned corridor watchlist for Enterprise Pulse users (up to 50 corridors).

CREATE TABLE IF NOT EXISTS silver.pulse_pinned_corridor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  corridor_id TEXT NOT NULL,
  label TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pulse_pinned_corridor_user_corridor_uidx
  ON silver.pulse_pinned_corridor (user_id, corridor_id);

CREATE INDEX IF NOT EXISTS pulse_pinned_corridor_user_id_idx
  ON silver.pulse_pinned_corridor (user_id);

-- Enforce max 50 pinned corridors per user via application layer (not DB constraint).

-- Also add report_schedule to institutional_client for scheduled reports feature.
ALTER TABLE public.institutional_client
  ADD COLUMN IF NOT EXISTS report_schedule TEXT NOT NULL DEFAULT 'none'
  CHECK (report_schedule IN ('weekly', 'monthly', 'none'));

GRANT SELECT, INSERT, DELETE ON silver.pulse_pinned_corridor TO plane_a;
GRANT SELECT ON silver.pulse_pinned_corridor TO plane_b, plane_c;
