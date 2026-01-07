-- Provider aggregate FX rates (separate from OANDA mid-market)

ALTER TABLE gold.fx_rates
  ADD COLUMN IF NOT EXISTS provider_agg_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS provider_agg_provider_count INTEGER,
  ADD COLUMN IF NOT EXISTS provider_agg_sample_count INTEGER,
  ADD COLUMN IF NOT EXISTS provider_agg_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN gold.fx_rates.provider_agg_rate IS 'Weighted provider aggregate rate (non-OANDA)';
COMMENT ON COLUMN gold.fx_rates.provider_agg_provider_count IS 'Distinct providers in aggregate';
COMMENT ON COLUMN gold.fx_rates.provider_agg_sample_count IS 'Quote samples in aggregate';
COMMENT ON COLUMN gold.fx_rates.provider_agg_updated_at IS 'Last provider aggregate update time';
