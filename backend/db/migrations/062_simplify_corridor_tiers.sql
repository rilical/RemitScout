-- Simplify corridor tiers: Remove tier_3, keep only tier_1 and tier_2

-- Update constraint to only allow tier_1 and tier_2
ALTER TABLE silver.corridor_tier_manual 
DROP CONSTRAINT IF EXISTS corridor_tier_manual_corridor_tier_check;

ALTER TABLE silver.corridor_tier_manual 
ADD CONSTRAINT corridor_tier_manual_corridor_tier_check 
CHECK (corridor_tier IN ('tier_1', 'tier_2'));

-- Migrate any existing tier_3 rows to tier_2
UPDATE silver.corridor_tier_manual 
SET corridor_tier = 'tier_2', 
    reason = COALESCE(reason, '') || ' [migrated from tier_3]',
    updated_at = NOW()
WHERE corridor_tier = 'tier_3';

-- Update the corridor_tier view to only reference tier_1 and tier_2
CREATE OR REPLACE VIEW silver.corridor_tier AS
SELECT
  c.corridor_id,
  NULL::bigint AS provider_count,
  NULL::double precision AS freshness_p95_minutes,
  NULL::numeric AS success_rate_24h,
  NULL::numeric AS block_rate_24h,
  COALESCE(m.corridor_tier, 'tier_2') AS corridor_tier
FROM silver.corridor c
LEFT JOIN silver.corridor_tier_manual m ON m.corridor_id = c.corridor_id;
