-- Hot corridors + dynamic tiering (B2B priority logic)

CREATE TABLE IF NOT EXISTS silver.hot_corridors (
  corridor_id TEXT PRIMARY KEY REFERENCES silver.corridor(corridor_id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.hot_corridors TO plane_b;
GRANT SELECT ON silver.hot_corridors TO plane_a;
GRANT SELECT ON silver.hot_corridors TO plane_c;

-- Replace corridor_tier view to reflect hot corridors + provider coverage.
CREATE OR REPLACE VIEW silver.corridor_tier AS
WITH provider_counts AS (
  SELECT
    corridor_id,
    COUNT(DISTINCT provider_id) AS provider_count
  FROM silver.provider_corridor_capability
  WHERE is_supported = true
  GROUP BY corridor_id
)
SELECT
  c.corridor_id,
  pc.provider_count,
  NULL::double precision AS freshness_p95_minutes,
  NULL::numeric AS success_rate_24h,
  NULL::numeric AS block_rate_24h,
  CASE
    WHEN hc.corridor_id IS NOT NULL AND COALESCE(pc.provider_count, 0) >= 3 THEN 'tier_1'
    WHEN hc.corridor_id IS NULL AND COALESCE(pc.provider_count, 0) >= 1 THEN 'tier_2'
    ELSE 'tier_3'
  END AS corridor_tier
FROM silver.corridor c
LEFT JOIN provider_counts pc ON pc.corridor_id = c.corridor_id
LEFT JOIN silver.hot_corridors hc ON hc.corridor_id = c.corridor_id;

GRANT SELECT ON silver.corridor_tier TO plane_b;
GRANT SELECT ON silver.corridor_tier TO plane_c;
GRANT SELECT ON silver.corridor_tier TO plane_a;

-- Replace corridor_priority table with a dynamic view derived from corridor_tier.
DROP VIEW IF EXISTS silver.corridor_priority;
DROP TABLE IF EXISTS silver.corridor_priority;

CREATE VIEW silver.corridor_priority AS
SELECT
  ct.corridor_id,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 'tier_1_alpha'
    WHEN ct.corridor_tier = 'tier_2' THEN 'tier_2_reference'
    ELSE 'tier_3_discovery'
  END AS priority_tier,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 1
    WHEN ct.corridor_tier = 'tier_2' THEN 120
    ELSE 1440
  END AS freshness_slo_minutes,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 60
    WHEN ct.corridor_tier = 'tier_2' THEN 7200
    ELSE 86400
  END AS scrape_interval_seconds,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 'RESIDENTIAL_PREMIUM'
    WHEN ct.corridor_tier = 'tier_2' THEN 'DATACENTER_ROTATING'
    ELSE 'NONE'
  END AS proxy_tier,
  NOW() AS updated_at
FROM silver.corridor_tier ct;

GRANT SELECT ON silver.corridor_priority TO plane_a, plane_b, plane_c;
