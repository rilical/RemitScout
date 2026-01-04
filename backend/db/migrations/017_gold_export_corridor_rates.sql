-- Gold export corridor rates table for B2B publishing

CREATE TABLE IF NOT EXISTS gold_export.corridor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_id TEXT NOT NULL,
  timestamp_bucket TIMESTAMPTZ NOT NULL,
  provider_count INTEGER NOT NULL,
  avg_rate NUMERIC(18, 6) NOT NULL,
  min_rate NUMERIC(18, 6) NOT NULL,
  max_rate NUMERIC(18, 6) NOT NULL,
  top_provider_share NUMERIC(5, 2),
  top_two_share NUMERIC(5, 2),
  contributor_count INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(corridor_id, timestamp_bucket)
);

CREATE INDEX idx_gold_export_corridor_rates_corridor_time 
  ON gold_export.corridor_rates(corridor_id, timestamp_bucket DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.corridor_rates TO plane_c;



