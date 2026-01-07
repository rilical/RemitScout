-- Watchlist items table for Plane A
-- Supports all WatchTarget types via JSONB target_payload
CREATE TABLE IF NOT EXISTS silver.watchlist_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'guest')),
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  guest_id UUID,
  target_type TEXT NOT NULL,
  target_payload JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT watchlist_item_owner_check CHECK (
    (owner_type = 'user' AND user_id IS NOT NULL AND guest_id IS NULL) OR
    (owner_type = 'guest' AND guest_id IS NOT NULL AND user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS watchlist_item_user_id_created_at_idx 
  ON silver.watchlist_item (user_id, created_at DESC) 
  WHERE deleted_at IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS watchlist_item_guest_id_created_at_idx 
  ON silver.watchlist_item (guest_id, created_at DESC) 
  WHERE deleted_at IS NULL AND guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS watchlist_item_target_payload_gin_idx 
  ON silver.watchlist_item USING GIN (target_payload) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS watchlist_item_user_id_deleted_at_idx 
  ON silver.watchlist_item (user_id, deleted_at) 
  WHERE user_id IS NOT NULL;

-- Grant permissions to plane_a
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.watchlist_item TO plane_a;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'watchlist_item_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.watchlist_item_id_seq TO plane_a;
  END IF;
END $$;

