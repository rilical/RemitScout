-- Comparison history table for user comparisons

CREATE TABLE IF NOT EXISTS silver.comparison_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comparison_history_user_created_at_idx
  ON silver.comparison_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS comparison_history_user_corridor_idx
  ON silver.comparison_history (user_id, from_country, to_country);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.comparison_history TO plane_a;
