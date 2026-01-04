ALTER TABLE silver.recent_searches
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  ALTER TABLE silver.recent_searches
    ADD CONSTRAINT recent_searches_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES silver.user_account(user_id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS recent_searches_user_id_created_at_idx
  ON silver.recent_searches (user_id, created_at DESC);
