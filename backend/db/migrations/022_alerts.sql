-- Alert system tables for Plane A
-- Supports exchange rate alerts and other metrics

-- Alert rules (definition)
CREATE TABLE IF NOT EXISTS silver.alert_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_item_id UUID NOT NULL REFERENCES silver.watchlist_item(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('rate', 'recipientGets', 'totalCost', 'fee', 'index', 'midMarketRate')),
  comparator TEXT NOT NULL CHECK (comparator IN ('gt', 'gte', 'lt', 'lte', 'crosses_above', 'crosses_below')),
  threshold NUMERIC NOT NULL,
  currency TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('realtime', 'hourly', 'daily')) DEFAULT 'daily',
  cooldown_minutes INTEGER NOT NULL DEFAULT 360,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT alert_rule_watchlist_item_fk FOREIGN KEY (watchlist_item_id) REFERENCES silver.watchlist_item(id) ON DELETE CASCADE
);

-- Alert state (runtime state, concurrency-safe)
CREATE TABLE IF NOT EXISTS silver.alert_state (
  alert_id UUID PRIMARY KEY REFERENCES silver.alert_rule(id) ON DELETE CASCADE,
  last_evaluated_at TIMESTAMPTZ,
  last_value NUMERIC,
  in_alarm BOOLEAN NOT NULL DEFAULT FALSE,
  last_triggered_at TIMESTAMPTZ,
  last_notified_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- Alert events (history)
CREATE TABLE IF NOT EXISTS silver.alert_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES silver.alert_rule(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value NUMERIC NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  notification_status TEXT NOT NULL CHECK (notification_status IN ('queued', 'sent', 'failed')) DEFAULT 'queued',
  provider_safe BOOLEAN NOT NULL DEFAULT TRUE
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS silver.notification_pref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'guest')),
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  guest_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')) DEFAULT 'email',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  daily_send_hour INTEGER NOT NULL DEFAULT 9 CHECK (daily_send_hour >= 0 AND daily_send_hour < 24),
  digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_pref_owner_check CHECK (
    (owner_type = 'user' AND user_id IS NOT NULL AND guest_id IS NULL) OR
    (owner_type = 'guest' AND guest_id IS NOT NULL AND user_id IS NULL)
  )
);

-- Email suppression list (SES bounce/complaint safety)
CREATE TABLE IF NOT EXISTS silver.email_suppression (
  email_hash TEXT PRIMARY KEY,
  reason TEXT NOT NULL CHECK (reason IN ('bounce', 'complaint', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS alert_rule_watchlist_item_id_idx ON silver.alert_rule(watchlist_item_id);
CREATE INDEX IF NOT EXISTS alert_rule_enabled_frequency_idx ON silver.alert_rule(enabled, frequency) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS alert_event_alert_id_triggered_at_idx ON silver.alert_event(alert_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS alert_event_triggered_at_idx ON silver.alert_event(triggered_at DESC);
CREATE INDEX IF NOT EXISTS alert_event_notification_status_idx ON silver.alert_event(notification_status) WHERE notification_status = 'queued';
CREATE INDEX IF NOT EXISTS notification_pref_user_id_idx ON silver.notification_pref(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_pref_guest_id_idx ON silver.notification_pref(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_pref_unsubscribed_idx ON silver.notification_pref(unsubscribed) WHERE unsubscribed = FALSE;

-- Grant permissions to plane_a
GRANT SELECT, INSERT, UPDATE, DELETE ON silver.alert_rule, silver.alert_state, silver.alert_event, silver.notification_pref, silver.email_suppression TO plane_a;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'alert_rule_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.alert_rule_id_seq TO plane_a;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'alert_event_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.alert_event_id_seq TO plane_a;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'S'
       AND c.relname = 'notification_pref_id_seq'
       AND n.nspname = 'silver'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE silver.notification_pref_id_seq TO plane_a;
  END IF;
END $$;

