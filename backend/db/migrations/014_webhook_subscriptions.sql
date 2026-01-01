CREATE TABLE IF NOT EXISTS gold.webhook_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  corridor_filter TEXT[] DEFAULT '{}',
  provider_filter TEXT[] DEFAULT '{}',
  z_score_threshold NUMERIC NOT NULL DEFAULT 2.0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_subscriptions_client_idx
  ON gold.webhook_subscriptions (client_id);

CREATE INDEX IF NOT EXISTS webhook_subscriptions_active_idx
  ON gold.webhook_subscriptions (active);

GRANT SELECT, INSERT, UPDATE, DELETE ON gold.webhook_subscriptions TO plane_c;
GRANT SELECT ON gold.webhook_subscriptions TO plane_b;
