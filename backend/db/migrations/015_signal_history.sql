CREATE TABLE IF NOT EXISTS gold.signal_history (
  signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  current_rate DOUBLE PRECISION NOT NULL,
  avg_24h DOUBLE PRECISION NULL,
  stddev_24h DOUBLE PRECISION NULL,
  z_score DOUBLE PRECISION NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signal_history_provider_idx
  ON gold.signal_history (provider_id);

CREATE INDEX IF NOT EXISTS signal_history_corridor_idx
  ON gold.signal_history (corridor_id);

CREATE INDEX IF NOT EXISTS signal_history_detected_at_idx
  ON gold.signal_history (detected_at);

GRANT SELECT, INSERT ON gold.signal_history TO plane_b;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold.signal_history TO plane_c;
