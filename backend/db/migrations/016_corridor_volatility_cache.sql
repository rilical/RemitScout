CREATE TABLE IF NOT EXISTS silver.corridor_volatility_cache (
  corridor_id TEXT PRIMARY KEY,
  volatility_score NUMERIC NOT NULL,
  sample_count INTEGER NOT NULL,
  mean_rate NUMERIC NOT NULL,
  stddev_rate NUMERIC NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS corridor_volatility_cache_calculated_at_idx
  ON silver.corridor_volatility_cache (calculated_at DESC);

GRANT SELECT, INSERT, UPDATE ON silver.corridor_volatility_cache TO plane_b;
GRANT SELECT ON silver.corridor_volatility_cache TO plane_a;
GRANT SELECT ON silver.corridor_volatility_cache TO plane_c;

CREATE INDEX IF NOT EXISTS quote_record_volatility_idx
  ON silver.quote_record (corridor_id, collected_at DESC, status)
  WHERE status = 'ok' AND implied_fx_rate > 0;

