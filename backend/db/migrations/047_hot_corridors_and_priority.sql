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

CREATE TABLE IF NOT EXISTS silver.corridor_tier_snapshot (
  corridor_id TEXT NOT NULL REFERENCES silver.corridor(corridor_id),
  tier_version TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  provider_count INTEGER NOT NULL DEFAULT 0,
  corridor_tier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (corridor_id, tier_version, effective_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.corridor_tier_snapshot TO plane_b;
GRANT SELECT ON silver.corridor_tier_snapshot TO plane_a;
GRANT SELECT ON silver.corridor_tier_snapshot TO plane_c;

-- Seed initial tier snapshot if none exists.
WITH snapshot_meta AS (
  SELECT
    NOW() AS effective_at,
    to_char(NOW(), 'YYYYMMDDHH24MISS') AS tier_version
),
provider_counts AS (
  SELECT
    pcc.corridor_id,
    COUNT(DISTINCT pcc.provider_id) AS provider_count
  FROM silver.provider_corridor_capability pcc
  JOIN silver.rights_matrix rm
    ON rm.provider_id = pcc.provider_id
  WHERE pcc.is_supported = true
    AND COALESCE(rm.allowed_collect, false) = true
    AND COALESCE(rm.allowed_b2b, false) = true
    AND COALESCE(rm.stoplist_status, 'paused') = 'active'
  GROUP BY pcc.corridor_id
),
seed AS (
  SELECT
    c.corridor_id,
    COALESCE(pc.provider_count, 0) AS provider_count,
    CASE
      WHEN COALESCE(pc.provider_count, 0) >= 3 THEN 'tier_2'
      ELSE 'tier_3'
    END AS corridor_tier
  FROM silver.corridor c
  LEFT JOIN provider_counts pc ON pc.corridor_id = c.corridor_id
)
INSERT INTO silver.corridor_tier_snapshot (
  corridor_id,
  tier_version,
  effective_at,
  provider_count,
  corridor_tier
)
SELECT
  s.corridor_id,
  m.tier_version,
  m.effective_at,
  s.provider_count,
  s.corridor_tier
FROM seed s
CROSS JOIN snapshot_meta m
WHERE NOT EXISTS (
  SELECT 1
  FROM silver.corridor_tier_snapshot
);

-- Replace corridor_tier view to reflect the latest tier snapshot (tier-1 disabled).
CREATE OR REPLACE VIEW silver.corridor_tier AS
WITH latest_snapshot AS (
  SELECT DISTINCT ON (corridor_id)
    corridor_id,
    provider_count,
    corridor_tier
  FROM silver.corridor_tier_snapshot
  ORDER BY corridor_id, effective_at DESC, tier_version DESC
)
SELECT
  corridor_id,
  provider_count::bigint AS provider_count,
  NULL::double precision AS freshness_p95_minutes,
  NULL::numeric AS success_rate_24h,
  NULL::numeric AS block_rate_24h,
  corridor_tier
FROM latest_snapshot;

GRANT SELECT ON silver.corridor_tier TO plane_b;
GRANT SELECT ON silver.corridor_tier TO plane_c;
GRANT SELECT ON silver.corridor_tier TO plane_a;

-- Replace corridor_priority table with a dynamic view derived from corridor_tier.
DO $$
BEGIN
  BEGIN
    EXECUTE 'DROP VIEW IF EXISTS silver.corridor_priority';
  EXCEPTION WHEN wrong_object_type THEN
    NULL;
  END;
  BEGIN
    EXECUTE 'DROP TABLE IF EXISTS silver.corridor_priority';
  EXCEPTION WHEN wrong_object_type THEN
    NULL;
  END;
END $$;

CREATE VIEW silver.corridor_priority AS
SELECT
  ct.corridor_id,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 'tier_1_alpha'
    WHEN ct.corridor_tier = 'tier_2' THEN 'tier_2_reference'
    ELSE 'tier_3_discovery'
  END AS priority_tier,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 2
    WHEN ct.corridor_tier = 'tier_2' THEN 240
    ELSE 1440
  END AS freshness_slo_minutes,
  CASE
    WHEN ct.corridor_tier = 'tier_1' THEN 120
    WHEN ct.corridor_tier = 'tier_2' THEN 14400
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
