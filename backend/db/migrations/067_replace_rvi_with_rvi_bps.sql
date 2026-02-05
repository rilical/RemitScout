-- Replace raw RVI with normalized RVI in basis points (pre-alpha break)
ALTER TABLE gold_export.cdp_daily
  DROP COLUMN IF EXISTS rvi_value;

ALTER TABLE gold_export.cdp_daily
  ADD COLUMN IF NOT EXISTS rvi_bps DOUBLE PRECISION;
