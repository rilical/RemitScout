-- EDV Residual Monitoring (P5)
-- Tracks TEER vs mid-market residuals per corridor for unknown-unknown detection.
-- Research source: EDV doc + Validation Agenda (E1)

CREATE TABLE IF NOT EXISTS gold_export.edv_residual_log (
  date                DATE          NOT NULL,
  corridor_id         TEXT          NOT NULL,
  amount_bucket       INT           NOT NULL DEFAULT 500,
  method_profile      method_profile NOT NULL DEFAULT 'standard_bank',
  teer_rate           NUMERIC,
  mid_market_rate     NUMERIC,
  residual_bps        NUMERIC,           -- (TEER - mid_market) / mid_market * 10000
  residual_7d_avg_bps NUMERIC,           -- Rolling 7-day average residual
  residual_7d_std_bps NUMERIC,           -- Rolling 7-day stddev of residual
  is_persistent       BOOLEAN DEFAULT FALSE,  -- True if |residual| > 2*stddev for 3+ consecutive days
  persistence_days    INT DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (date, corridor_id, amount_bucket, method_profile)
);

CREATE INDEX IF NOT EXISTS edv_residual_corridor_date_idx
  ON gold_export.edv_residual_log (corridor_id, date);

-- Match existing gold_export grant pattern (see 002_rse_silver_core.sql:181-183)
GRANT SELECT ON gold_export.edv_residual_log TO plane_a;
GRANT SELECT, INSERT, UPDATE, DELETE ON gold_export.edv_residual_log TO plane_c;

COMMENT ON TABLE gold_export.edv_residual_log IS
  'Tracks TEER vs mid-market residuals per corridor for unknown-unknown detection (EDV research doc, Validation Agenda E1)';
