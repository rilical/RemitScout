-- Historical FX rate storage for OANDA (and other sources)

CREATE TABLE IF NOT EXISTS gold.fx_rate_history (
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  bid NUMERIC,
  ask NUMERIC,
  rate_date DATE NOT NULL,
  source TEXT DEFAULT 'OANDA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (base_currency, quote_currency, rate_date)
);

CREATE INDEX IF NOT EXISTS fx_rate_history_pair_date_idx
  ON gold.fx_rate_history (base_currency, quote_currency, rate_date DESC);

CREATE INDEX IF NOT EXISTS fx_rate_history_date_idx
  ON gold.fx_rate_history (rate_date DESC);

GRANT SELECT, INSERT, UPDATE ON gold.fx_rate_history TO plane_a;
GRANT SELECT, INSERT, UPDATE ON gold.fx_rate_history TO plane_b;
