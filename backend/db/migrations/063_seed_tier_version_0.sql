-- Seed tier version 0 as the baseline snapshot for the 2-tier macro-only model.
-- This preserves historical continuity for backtesting.

-- Clear any existing v0 snapshot (idempotent)
DELETE FROM silver.corridor_tier_snapshot WHERE tier_version = '0';

-- Insert v0 snapshot using code-based tier assignment rules:
-- - US-origin corridors = tier_1
-- - All others = tier_2
-- Only include corridors that exist in the corridor table.
INSERT INTO silver.corridor_tier_snapshot (
  corridor_id,
  tier_version,
  effective_at,
  provider_count,
  corridor_tier
)
SELECT
  c.corridor_id,
  '0' AS tier_version,
  NOW() AS effective_at,
  COALESCE(pc.provider_count, 0) AS provider_count,
  CASE
    WHEN c.corridor_id LIKE 'US-%' THEN 'tier_1'
    ELSE 'tier_2'
  END AS corridor_tier
FROM silver.corridor c
LEFT JOIN (
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
) pc ON pc.corridor_id = c.corridor_id
ON CONFLICT (corridor_id, tier_version, effective_at) DO NOTHING;

-- Log the seed count
DO $$
DECLARE
  v0_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v0_count
  FROM silver.corridor_tier_snapshot
  WHERE tier_version = '0';
  RAISE NOTICE 'Seeded tier version 0 with % corridors', v0_count;
END $$;
