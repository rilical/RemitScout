-- Remit-Scout Observer SQL Pack (RDS Query Editor v2)
-- Scope: dev/staging/prod read-only observation
-- Use these one-by-one in AWS Query Editor and export CSV when needed.

-- 1) Latest quote ingestion evidence (Silver)
SELECT
  provider_slug,
  corridor_id,
  amount_bucket,
  payin_method,
  payout_method,
  send_amount,
  receive_amount,
  implied_fx_rate,
  collected_at,
  created_at
FROM silver.quote_record
ORDER BY created_at DESC
LIMIT 200;

-- 2) Ingestion worker run status (Silver)
SELECT
  id,
  status,
  started_at,
  finished_at,
  error
FROM silver.ingestion_run
ORDER BY started_at DESC
LIMIT 100;

-- 3) Latest Gold indices (TEER/RCI/RVI)
SELECT
  date,
  corridor_id,
  amount_bucket,
  method_profile,
  teer_rate,
  rci_ratio,
  rvi_bps,
  provider_count,
  suppression_flag,
  suppression_reason,
  created_at
FROM gold_export.cdp_daily
ORDER BY created_at DESC
LIMIT 200;

-- 4) Gold freshness checkpoint
SELECT
  MAX(date) AS latest_date,
  NOW()::date AS checked_date
FROM gold_export.cdp_daily
WHERE amount_bucket = 500;

-- 5) Suppression reason distribution (latest Gold date)
SELECT
  suppression_reason,
  COUNT(*) AS rows
FROM gold_export.cdp_daily
WHERE date = (SELECT MAX(date) FROM gold_export.cdp_daily)
GROUP BY suppression_reason
ORDER BY rows DESC;

-- 6) Provider count floor (latest Gold date)
SELECT
  corridor_id,
  provider_count,
  suppression_flag,
  suppression_reason
FROM gold_export.cdp_daily
WHERE date = (SELECT MAX(date) FROM gold_export.cdp_daily)
ORDER BY provider_count ASC, corridor_id ASC
LIMIT 50;

-- 7) Alert evaluation outcomes (Silver)
SELECT
  id,
  alert_id,
  triggered_at,
  value,
  notification_status,
  message
FROM silver.alert_event
ORDER BY triggered_at DESC
LIMIT 200;

-- 8) B2B sweep runtime status
SELECT
  priority_tier,
  status,
  cadence_minutes,
  target_minutes,
  observation_mode,
  enqueued_at,
  started_at,
  finished_at,
  created_at
FROM silver.b2b_sweep_run
ORDER BY created_at DESC
LIMIT 100;

-- 9) B2B schedule pressure / drift clues
SELECT
  priority_tier,
  provider_slug,
  corridor_id,
  interval_seconds,
  next_due_at,
  last_enqueued_at,
  enabled
FROM silver.b2b_sweep_schedule
ORDER BY next_due_at ASC NULLS FIRST
LIMIT 200;

-- 10) Alert notification send attempts (admin audit; optional)
-- Requires migration 073 and env `ALERTS_NOTIFICATION_AUDIT=1` for Plane A to write rows.
SELECT
  id,
  alert_id,
  user_id,
  channel,
  provider,
  status,
  skip_reason,
  error,
  subject,
  to_email,
  to_email_hash,
  created_at
FROM silver.alert_notification_attempt
ORDER BY created_at DESC
LIMIT 200;
