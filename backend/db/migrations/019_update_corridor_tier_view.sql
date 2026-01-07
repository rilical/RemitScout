-- Update corridor tier rules (remove block-rate demotion, relax success rate, add freshness hysteresis).
-- Changes:
-- 1. Block rate removed from Tier 1 criteria (high blocks trigger proxy rotation, not tier demotion)
-- 2. Success rate relaxed to >=70%, and removed entirely if N >= 3 (Index is valid with 3+ providers)
-- 3. Freshness hysteresis: must fail for 3 consecutive hours before demotion
-- 4. Tier 2 explicitly defined as "Incubator" (1 <= N < 3)

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
    ) AS attempts_block,
    SUM(
      CASE
        WHEN COALESCE(qa.error_type, '') = 'block'
          OR COALESCE(qa.http_status, 0) IN (403, 429) THEN 0
        ELSE 1
      END
    ) AS attempts_non_block,
    SUM(
      CASE
        WHEN qa.success
          AND NOT (
            COALESCE(qa.error_type, '') = 'block'
            OR COALESCE(qa.http_status, 0) IN (403, 429)
          ) THEN 1
        ELSE 0
      END
    ) AS attempts_success_non_block
  FROM silver.quote_attempt qa
  JOIN allowed_providers ap ON ap.provider_id = qa.provider_id
  WHERE qa.attempted_at >= now() - interval '24 hours'
  GROUP BY qa.corridor_id
),
rates AS (
  SELECT
    corridor_id,
    CASE
      WHEN attempts_non_block > 0 THEN attempts_success_non_block::numeric / attempts_non_block
      ELSE NULL
    END AS success_rate_24h,
    CASE
      WHEN attempts_total > 0 THEN attempts_block::numeric / attempts_total
      ELSE NULL
    END AS block_rate_24h
  FROM attempts
),
hours AS (
  SELECT generate_series(
    date_trunc('hour', now()) - interval '2 hours',
    date_trunc('hour', now()),
    interval '1 hour'
  ) AS hour_bucket
),
freshness_hourly AS (
  SELECT
    corridor_id,
    date_trunc('hour', observed_at) AS hour_bucket,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY age_minutes) AS freshness_p95_minutes
  FROM silver.freshness_slo_report
  WHERE observed_at >= now() - interval '3 hours'
  GROUP BY corridor_id, hour_bucket
),
freshness_streak AS (
  SELECT
    c.corridor_id,
    SUM(
      CASE
        WHEN COALESCE(fh.freshness_p95_minutes, 1e9) > 30 THEN 1
        ELSE 0
      END
    ) AS stale_hours
  FROM corridors c
  CROSS JOIN hours h
  LEFT JOIN freshness_hourly fh
    ON fh.corridor_id = c.corridor_id
   AND fh.hour_bucket = h.hour_bucket
  GROUP BY c.corridor_id
)
SELECT
  c.corridor_id,
  COALESCE(pc.provider_count, 0) AS provider_count,
  f.freshness_p95_minutes,
  r.success_rate_24h,
  r.block_rate_24h,
  CASE
    WHEN COALESCE(pc.provider_count, 0) >= 3
      AND COALESCE(fs.stale_hours, 0) < 3
      THEN 'tier_1'
    WHEN COALESCE(pc.provider_count, 0) >= 1
      THEN 'tier_2'
    ELSE 'tier_3'
  END AS corridor_tier
FROM corridors c
LEFT JOIN provider_counts pc ON pc.corridor_id = c.corridor_id
LEFT JOIN freshness f ON f.corridor_id = c.corridor_id
LEFT JOIN rates r ON r.corridor_id = c.corridor_id
LEFT JOIN freshness_streak fs ON fs.corridor_id = c.corridor_id;

GRANT SELECT ON silver.corridor_tier TO plane_b;
GRANT SELECT ON silver.corridor_tier TO plane_c;
