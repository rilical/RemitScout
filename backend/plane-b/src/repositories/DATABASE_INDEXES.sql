-- Database indexes for Plane B repository performance optimization

-- Quote Refresh Repository Indexes
-- Index on (status, last_requested_at) for efficient claimPendingRequests queries
CREATE INDEX IF NOT EXISTS idx_quote_refresh_status_last_requested
  ON silver.quote_refresh_request(status, last_requested_at DESC);

-- Index on (status, processed_at) for retryFailedRequests queries
CREATE INDEX IF NOT EXISTS idx_quote_refresh_status_processed
  ON silver.quote_refresh_request(status, processed_at)
  WHERE processed_at IS NOT NULL;

-- Pulse Cache Repository Indexes
-- Index on (collected_at, status) for Pulse queries
CREATE INDEX IF NOT EXISTS idx_latest_quote_collected_status
  ON silver.latest_quote_by_provider(collected_at DESC, status)
  WHERE status = 'ok';

-- Composite index for corridor queries with status filter
CREATE INDEX IF NOT EXISTS idx_latest_quote_corridor_collected_status
  ON silver.latest_quote_by_provider(corridor_id, collected_at DESC, status)
  WHERE status = 'ok';

-- FX Rate Repository Indexes
-- Index on (base_currency, quote_currency) for rate lookups
CREATE INDEX IF NOT EXISTS idx_fx_rates_currency_pair
  ON gold.fx_rates(base_currency, quote_currency);

-- Index on updated_at for rate change detection
CREATE INDEX IF NOT EXISTS idx_fx_rates_updated
  ON gold.fx_rates(updated_at DESC);

-- Pulse Cache Table Index
-- Index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_pulse_cache_key
  ON gold.pulse_cache(key);

-- Index on updated_at for cache invalidation
CREATE INDEX IF NOT EXISTS idx_pulse_cache_updated
  ON gold.pulse_cache(updated_at DESC);


