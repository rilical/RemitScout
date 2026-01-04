CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  CREATE TYPE silver.newsletter_status AS ENUM ('pending', 'active', 'unsubscribed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS silver.newsletter_subscriber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  status silver.newsletter_status NOT NULL DEFAULT 'pending',
  verify_token_hash TEXT NOT NULL,
  unsubscribe_token_hash TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  verify_token_expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscriber_email_key
  ON silver.newsletter_subscriber (email);

CREATE INDEX IF NOT EXISTS newsletter_subscriber_status_created_at_idx
  ON silver.newsletter_subscriber (status, created_at DESC);

CREATE INDEX IF NOT EXISTS newsletter_subscriber_verify_token_idx
  ON silver.newsletter_subscriber (verify_token_hash);

CREATE INDEX IF NOT EXISTS newsletter_subscriber_unsubscribe_token_idx
  ON silver.newsletter_subscriber (unsubscribe_token_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.newsletter_subscriber TO plane_a;
