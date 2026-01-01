ALTER TABLE silver.quote_record
  ADD COLUMN IF NOT EXISTS promotional_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS base_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS promotional_cap_amount NUMERIC;

ALTER TABLE silver.latest_quote_by_provider
  ADD COLUMN IF NOT EXISTS promotional_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS base_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS promotional_cap_amount NUMERIC;
