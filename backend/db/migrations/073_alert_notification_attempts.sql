-- Record alert notification send attempts for admin observation / debugging.
-- Content and PII storage is controlled at runtime via env flags in Plane A.

CREATE TABLE IF NOT EXISTS silver.alert_notification_attempt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES silver.alert_rule(id) ON DELETE SET NULL,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  provider TEXT NOT NULL,
  to_email_hash TEXT,
  to_email TEXT,
  subject TEXT,
  text_body TEXT,
  html_body TEXT,
  status TEXT NOT NULL CHECK (status IN ('skipped', 'sent', 'failed')),
  skip_reason TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alert_notification_attempt_created_at_idx
  ON silver.alert_notification_attempt (created_at DESC);

CREATE INDEX IF NOT EXISTS alert_notification_attempt_alert_id_idx
  ON silver.alert_notification_attempt (alert_id, created_at DESC);

CREATE INDEX IF NOT EXISTS alert_notification_attempt_user_id_idx
  ON silver.alert_notification_attempt (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.alert_notification_attempt TO plane_a;

