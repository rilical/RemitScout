-- Discovery scan tables for provider corridor/delivery/promo auditing

BEGIN;

-- silver.discovery_scan — top-level scan record per provider
CREATE TABLE IF NOT EXISTS silver.discovery_scan (
  id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id                 TEXT NOT NULL,
  scan_type                   TEXT NOT NULL DEFAULT 'full' CHECK (scan_type IN (
    'full', 'corridors_only', 'promos_only'
  )),
  status                      TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'partial'
  )),
  corridors_discovered        INTEGER DEFAULT 0,
  delivery_methods_discovered INTEGER DEFAULT 0,
  promotions_detected         INTEGER DEFAULT 0,
  errors_count                INTEGER DEFAULT 0,
  result_json                 JSONB,
  diff_json                   JSONB,
  duration_ms                 INTEGER,
  triggered_by                TEXT CHECK (triggered_by IN (
    'schedule', 'agent', 'manual'
  )),
  correlation_id              TEXT,
  started_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_scan_provider
  ON silver.discovery_scan (provider_id);

CREATE INDEX IF NOT EXISTS idx_discovery_scan_started
  ON silver.discovery_scan (started_at DESC);

-- silver.discovery_corridor — per-corridor findings from a scan
CREATE TABLE IF NOT EXISTS silver.discovery_corridor (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scan_id               BIGINT NOT NULL REFERENCES silver.discovery_scan(id) ON DELETE CASCADE,
  provider_id           TEXT NOT NULL,
  corridor_id           TEXT NOT NULL,
  source_country        TEXT NOT NULL,
  destination_country   TEXT NOT NULL,
  source_currency       TEXT NOT NULL,
  destination_currency  TEXT NOT NULL,
  payin_methods         TEXT[],
  payout_methods        TEXT[],
  is_new                BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_corridor_scan
  ON silver.discovery_corridor (scan_id);

CREATE INDEX IF NOT EXISTS idx_discovery_corridor_provider_corridor
  ON silver.discovery_corridor (provider_id, corridor_id);

-- silver.discovery_promotion — per-promo findings from a scan
CREATE TABLE IF NOT EXISTS silver.discovery_promotion (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scan_id                 BIGINT NOT NULL REFERENCES silver.discovery_scan(id) ON DELETE CASCADE,
  provider_id             TEXT NOT NULL,
  corridor_id             TEXT,
  promo_type              TEXT NOT NULL,
  raw_text                TEXT,
  strikethrough_detected  BOOLEAN DEFAULT FALSE,
  original_value          TEXT,
  promo_value             TEXT,
  expires_at              TIMESTAMPTZ,
  banner_selector         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_promotion_scan
  ON silver.discovery_promotion (scan_id);

COMMIT;
