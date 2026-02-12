ALTER TABLE gold.webhook_subscriptions
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

UPDATE gold.webhook_subscriptions
SET webhook_secret = encode(gen_random_bytes(32), 'hex')
WHERE webhook_secret IS NULL OR length(trim(webhook_secret)) = 0;

ALTER TABLE gold.webhook_subscriptions
  ALTER COLUMN webhook_secret SET DEFAULT encode(gen_random_bytes(32), 'hex');

ALTER TABLE gold.webhook_subscriptions
  ALTER COLUMN webhook_secret SET NOT NULL;
