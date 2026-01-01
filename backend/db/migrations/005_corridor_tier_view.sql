-- Corridor tier view for scheduling and B2B eligibility

CREATE OR REPLACE VIEW silver.corridor_tier AS
WITH corridors AS (
  SELECT DISTINCT corridor_id
  FROM silver.provider_corridor_capability
),
allowed_providers AS (
  SELECT provider_id
  FROM silver.rights_matrix
  WHERE allowed_b2b = true
    AND stoplist_status = 'active'
),
latest_by_provider AS (
  SELECT
    lqp.corridor_id,
    lqp.provider_id,
    EXTRACT(EPOCH FROM (now() - lqp.collected_at)) / 60.0 AS age_minutes
  FROM silver.latest_quote_by_provider lqp
  JOIN allowed_providers ap ON ap.provider_id = lqp.provider_id
  WHERE lqp.collected_at IS NOT NULL
),
provider_counts AS (
  SELECT corridor_id, COUNT(DISTINCT provider_id) AS provider_count
  FROM latest_by_provider
  GROUP BY corridor_id
),
freshness AS (
  SELECT
    corridor_id,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY age_minutes) AS freshness_p95_minutes
  FROM latest_by_provider
  GROUP BY corridor_id
),
attempts AS (
  SELECT
    qa.corridor_id,
    COUNT(*) AS attempts_total,
    SUM(CASE WHEN qa.success THEN 1 ELSE 0 END) AS attempts_success,
    SUM(
      CASE
        WHEN qa.error_type = 'block' OR qa.http_status IN (403, 429) THEN 1
        ELSE 0
      END
    ) AS attempts_block
  FROM silver.quote_attempt qa
  JOIN allowed_providers ap ON ap.provider_id = qa.provider_id
  WHERE qa.attempted_at >= now() - interval '24 hours'
  GROUP BY qa.corridor_id
),
rates AS (
  SELECT
    corridor_id,
    CASE
      WHEN attempts_total > 0 THEN attempts_success::numeric / attempts_total
      ELSE NULL
    END AS success_rate_24h,
    CASE
      WHEN attempts_total > 0 THEN attempts_block::numeric / attempts_total
      ELSE NULL
    END AS block_rate_24h
  FROM attempts
)
SELECT
  c.corridor_id,
  COALESCE(pc.provider_count, 0) AS provider_count,
  f.freshness_p95_minutes,
  r.success_rate_24h,
  r.block_rate_24h,
  CASE
    WHEN COALESCE(pc.provider_count, 0) >= 3
      AND COALESCE(r.success_rate_24h, 0) >= 0.95
      AND COALESCE(f.freshness_p95_minutes, 1e9) <= 30
      AND COALESCE(r.block_rate_24h, 1) <= 0.03
      THEN 'tier_1'
    WHEN COALESCE(pc.provider_count, 0) >= 1
      THEN 'tier_2'
    ELSE 'tier_3'
  END AS corridor_tier
FROM corridors c
LEFT JOIN provider_counts pc ON pc.corridor_id = c.corridor_id
LEFT JOIN freshness f ON f.corridor_id = c.corridor_id
LEFT JOIN rates r ON r.corridor_id = c.corridor_id;

GRANT SELECT ON silver.corridor_tier TO plane_b;
GRANT SELECT ON silver.corridor_tier TO plane_c;
