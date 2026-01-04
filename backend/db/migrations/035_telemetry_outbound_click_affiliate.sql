ALTER TABLE silver.telemetry_outbound_click
  ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN;

CREATE INDEX IF NOT EXISTS telemetry_outbound_click_affiliate_ts_idx
  ON silver.telemetry_outbound_click (is_affiliate, ts DESC);
