CREATE INDEX IF NOT EXISTS quote_record_smart_alerts_idx
  ON silver.quote_record (corridor_id, provider_id, collected_at DESC)
  WHERE status = 'ok'
    AND implied_fx_rate IS NOT NULL
    AND implied_fx_rate > 0;
