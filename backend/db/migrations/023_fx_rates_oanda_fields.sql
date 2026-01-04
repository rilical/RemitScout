-- Add OANDA-specific fields to fx_rates table for better rate tracking
ALTER TABLE gold.fx_rates
  ADD COLUMN IF NOT EXISTS bid NUMERIC,
  ADD COLUMN IF NOT EXISTS ask NUMERIC,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'OANDA',
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Update last_updated to match updated_at on insert/update
CREATE OR REPLACE FUNCTION gold.sync_fx_rate_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = COALESCE(NEW.last_updated, NOW());
  NEW.updated_at = COALESCE(NEW.updated_at, NOW());
  IF NEW.last_updated IS NOT NULL AND NEW.updated_at IS NULL THEN
    NEW.updated_at = NEW.last_updated;
  ELSIF NEW.updated_at IS NOT NULL AND NEW.last_updated IS NULL THEN
    NEW.last_updated = NEW.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_fx_rate_timestamps_trigger ON gold.fx_rates;
CREATE TRIGGER sync_fx_rate_timestamps_trigger
  BEFORE INSERT OR UPDATE ON gold.fx_rates
  FOR EACH ROW
  EXECUTE FUNCTION gold.sync_fx_rate_timestamps();

-- Add index for faster lookups by source and last_updated
CREATE INDEX IF NOT EXISTS fx_rates_source_idx ON gold.fx_rates (source);
CREATE INDEX IF NOT EXISTS fx_rates_last_updated_idx ON gold.fx_rates (last_updated DESC);

COMMENT ON COLUMN gold.fx_rates.bid IS 'Bid price from OANDA';
COMMENT ON COLUMN gold.fx_rates.ask IS 'Ask price from OANDA';
COMMENT ON COLUMN gold.fx_rates.source IS 'Source of the exchange rate (OANDA, OANDA_AUTH, XE, etc.)';
COMMENT ON COLUMN gold.fx_rates.last_updated IS 'When the rate was last updated from the source';

GRANT SELECT, INSERT, UPDATE ON gold.fx_rates TO plane_a;
GRANT SELECT, INSERT, UPDATE ON gold.fx_rates TO plane_b;

