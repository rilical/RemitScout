-- Manual corridor tiers for fixed subscription access

CREATE TABLE IF NOT EXISTS silver.corridor_tier_manual (
  corridor_id TEXT PRIMARY KEY REFERENCES silver.corridor(corridor_id),
  corridor_tier TEXT NOT NULL CHECK (corridor_tier IN ('tier_1', 'tier_2', 'tier_3')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW silver.corridor_tier AS
SELECT
  c.corridor_id,
  NULL::bigint AS provider_count,
  NULL::double precision AS freshness_p95_minutes,
  NULL::numeric AS success_rate_24h,
  NULL::numeric AS block_rate_24h,
  COALESCE(m.corridor_tier, 'tier_3') AS corridor_tier
FROM silver.corridor c
LEFT JOIN silver.corridor_tier_manual m ON m.corridor_id = c.corridor_id;

GRANT SELECT ON silver.corridor_tier TO plane_b;
GRANT SELECT ON silver.corridor_tier TO plane_c;
GRANT SELECT ON silver.corridor_tier TO plane_a;

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.corridor_tier_manual TO plane_b;
GRANT SELECT ON silver.corridor_tier_manual TO plane_a;
GRANT SELECT ON silver.corridor_tier_manual TO plane_c;
