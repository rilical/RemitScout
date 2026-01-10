ALTER TABLE silver.user_account
  ADD COLUMN IF NOT EXISTS app_role TEXT NOT NULL DEFAULT 'user'
    CHECK (app_role IN ('user', 'admin', 'super_admin'));

ALTER TABLE silver.user_account
  ADD COLUMN IF NOT EXISTS privacy_analytics_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS privacy_personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS privacy_updated_at TIMESTAMPTZ;
