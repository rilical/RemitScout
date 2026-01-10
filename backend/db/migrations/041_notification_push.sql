CREATE TABLE IF NOT EXISTS silver.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  rate_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_summary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  market_updates_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  product_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  promotional_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS silver.notification_device (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  token TEXT,
  endpoint TEXT,
  subscription_json JSONB,
  device_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  CONSTRAINT notification_device_identifier_check CHECK (token IS NOT NULL OR endpoint IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_device_unique_token_idx
  ON silver.notification_device (user_id, platform, token)
  WHERE token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notification_device_unique_endpoint_idx
  ON silver.notification_device (user_id, platform, endpoint)
  WHERE endpoint IS NOT NULL;

CREATE INDEX IF NOT EXISTS notification_device_user_id_idx
  ON silver.notification_device (user_id);

CREATE TABLE IF NOT EXISTS silver.notification_opt_in_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  platform TEXT,
  opt_in BOOLEAN NOT NULL,
  source TEXT NOT NULL DEFAULT 'user_action',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_opt_in_user_idx
  ON silver.notification_opt_in_event (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_opt_in_channel_idx
  ON silver.notification_opt_in_event (channel, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.notification_settings, silver.notification_device, silver.notification_opt_in_event TO plane_a;
