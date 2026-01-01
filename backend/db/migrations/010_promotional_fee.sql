ALTER TABLE silver.quote_record
  ADD COLUMN IF NOT EXISTS promotional_fee_amount NUMERIC;

ALTER TABLE silver.latest_quote_by_provider
  ADD COLUMN IF NOT EXISTS promotional_fee_amount NUMERIC;
