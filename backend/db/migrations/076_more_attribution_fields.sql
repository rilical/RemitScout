-- Add additional paid-growth attribution fields (TikTok/LinkedIn click IDs).
-- These are optional and should be treated as "best-effort" metadata.

ALTER TABLE silver.telemetry_session
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id TEXT;

ALTER TABLE silver.telemetry_search_event
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id TEXT;

ALTER TABLE silver.telemetry_outbound_click
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id TEXT;

ALTER TABLE silver.telemetry_affiliate_conversion
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id TEXT;

ALTER TABLE silver.telemetry_provider_visit
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id TEXT;

ALTER TABLE silver.telemetry_marketing_event
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS msclkid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id TEXT;

