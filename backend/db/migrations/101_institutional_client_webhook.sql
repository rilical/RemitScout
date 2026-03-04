-- Migration: 100_institutional_client_webhook
-- Purpose: Add webhook_url and webhook_secret columns to institutional_client
--          so B2B clients can receive push notifications on export completion.

ALTER TABLE public.institutional_client
  ADD COLUMN IF NOT EXISTS webhook_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT DEFAULT NULL;

COMMENT ON COLUMN public.institutional_client.webhook_url IS 'HTTPS endpoint for export completion webhook delivery';
COMMENT ON COLUMN public.institutional_client.webhook_secret IS 'HMAC-SHA256 secret for signing webhook payloads';
