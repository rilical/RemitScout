CREATE TABLE IF NOT EXISTS silver.user_account (
  user_id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS silver.user_plan (
  user_id UUID PRIMARY KEY REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('free', 'plus', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_plan_plan_code_status_idx
  ON silver.user_plan (plan_code, status);

CREATE TABLE IF NOT EXISTS silver.plan_usage_counter (
  user_id UUID NOT NULL REFERENCES silver.user_account(user_id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  window_start DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, scope, window_start)
);

CREATE INDEX IF NOT EXISTS plan_usage_counter_user_scope_window_idx
  ON silver.plan_usage_counter (user_id, scope, window_start);

CREATE TABLE IF NOT EXISTS silver.billing_webhook_event (
  event_id TEXT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  type TEXT,
  payload_hash TEXT,
  payload_json JSONB
);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.user_account, silver.user_plan, silver.plan_usage_counter, silver.billing_webhook_event TO plane_a;
