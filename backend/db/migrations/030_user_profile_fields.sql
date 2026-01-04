ALTER TABLE silver.user_account
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE silver.user_account
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
