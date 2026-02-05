CREATE TABLE IF NOT EXISTS gold.provider_weight_snapshot (
  corridor_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  method_profile method_profile,
  weight DOUBLE PRECISION NOT NULL,
  model_version TEXT NOT NULL,
  window_days INT NOT NULL,
  quote_count INT NOT NULL,
  provider_count INT NOT NULL,
  weight_confidence DOUBLE PRECISION NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (corridor_id, provider_id, model_version, method_profile)
);

CREATE INDEX IF NOT EXISTS provider_weight_snapshot_corridor_model_idx
  ON gold.provider_weight_snapshot (corridor_id, model_version);

CREATE INDEX IF NOT EXISTS provider_weight_snapshot_provider_idx
  ON gold.provider_weight_snapshot (provider_id);

GRANT SELECT ON gold.provider_weight_snapshot TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold.provider_weight_snapshot TO plane_c;

ALTER TABLE gold_export.cdp_daily
  ADD COLUMN IF NOT EXISTS weight_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS weight_window_days INT,
  ADD COLUMN IF NOT EXISTS methodology_version TEXT;
