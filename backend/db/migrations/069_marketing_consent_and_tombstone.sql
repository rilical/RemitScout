ALTER TABLE silver.user_account
  ADD COLUMN IF NOT EXISTS privacy_marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE silver.user_account
  ALTER COLUMN privacy_analytics_enabled SET DEFAULT FALSE,
  ALTER COLUMN privacy_personalization_enabled SET DEFAULT FALSE;

UPDATE silver.user_account
SET privacy_analytics_enabled = FALSE,
    privacy_personalization_enabled = FALSE,
    privacy_marketing_enabled = FALSE
WHERE privacy_updated_at IS NULL;

CREATE TABLE IF NOT EXISTS silver.account_deletion_tombstone (
  user_id UUID PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT ON silver.account_deletion_tombstone TO plane_a;

