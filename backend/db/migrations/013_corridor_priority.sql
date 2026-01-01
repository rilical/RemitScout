-- Corridor priority routing (tier -> proxy class)

CREATE TABLE IF NOT EXISTS silver.corridor_priority (
  corridor_id TEXT PRIMARY KEY,
  priority_tier TEXT NOT NULL CHECK (priority_tier IN ('tier_1_alpha', 'tier_2_reference', 'tier_3_discovery')),
  freshness_slo_minutes INTEGER NOT NULL,
  scrape_interval_seconds INTEGER NOT NULL,
  proxy_tier TEXT NOT NULL CHECK (proxy_tier IN ('RESIDENTIAL_PREMIUM', 'DATACENTER_ROTATING', 'NONE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS corridor_priority_tier_idx
  ON silver.corridor_priority (priority_tier);

CREATE INDEX IF NOT EXISTS corridor_priority_proxy_idx
  ON silver.corridor_priority (proxy_tier);

INSERT INTO silver.corridor_priority (
  corridor_id,
  priority_tier,
  freshness_slo_minutes,
  scrape_interval_seconds,
  proxy_tier
)
SELECT
  corridor_id,
  CASE
    WHEN corridor_tier = 'tier_1' THEN 'tier_1_alpha'
    WHEN corridor_tier = 'tier_2' THEN 'tier_2_reference'
    ELSE 'tier_3_discovery'
  END,
  CASE
    WHEN corridor_tier = 'tier_1' THEN 1
    WHEN corridor_tier = 'tier_2' THEN 60
    ELSE 1440
  END,
  CASE
    WHEN corridor_tier = 'tier_1' THEN 60
    WHEN corridor_tier = 'tier_2' THEN 3600
    ELSE 86400
  END,
  CASE
    WHEN corridor_tier = 'tier_1' THEN 'RESIDENTIAL_PREMIUM'
    WHEN corridor_tier = 'tier_2' THEN 'DATACENTER_ROTATING'
    ELSE 'NONE'
  END
FROM silver.corridor_tier
ON CONFLICT (corridor_id) DO UPDATE SET
  priority_tier = EXCLUDED.priority_tier,
  freshness_slo_minutes = EXCLUDED.freshness_slo_minutes,
  scrape_interval_seconds = EXCLUDED.scrape_interval_seconds,
  proxy_tier = EXCLUDED.proxy_tier,
  updated_at = NOW();

GRANT SELECT ON silver.corridor_priority TO plane_a, plane_b, plane_c;
