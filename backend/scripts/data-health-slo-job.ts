import type { Pool } from 'pg'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { createShutdownHandler } from '../shared/shutdown'
import { recordSLOValue } from '../shared/slo-tracker'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { HEALTH_CORRIDORS } from '../shared/health-corridors'

const logger = createLogger('script.data-health-slo-job')
initTracing('data-health-slo-job')

const TIER_1_FILTER = "('tier_1','tier_1_alpha')"
const TIER_2_FILTER = "('tier_2')"

const healthCorridors = Array.from(
  new Set(
    Object.values(HEALTH_CORRIDORS).flat(),
  ),
)

const INDICES_METHOD_PROFILES = [
  'standard_bank',
  'standard_card',
  'cash_pickup',
  'mobile_wallet',
  'airtime_topup',
  'card_delivery',
  'home_delivery',
] as const

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const querySingle = async <T extends Record<string, unknown>>(
  pool: Pool,
  sql: string,
  params: unknown[],
  field: keyof T,
): Promise<number | null> => {
  const result = await query<T>(sql, params, pool)
  return toNumber(result.rows[0]?.[field])
}

const fetchFreshnessP95 = async (pool: Pool, filter: string): Promise<number | null> => {
  return querySingle<{ p95_seconds: number | null }>(
    pool,
    `SELECT percentile_cont(0.95) WITHIN GROUP (
       ORDER BY EXTRACT(EPOCH FROM (NOW() - lqp.collected_at))
     )::double precision AS p95_seconds
     FROM silver.latest_quote_by_provider lqp
     JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
     WHERE lqp.status = 'ok'
       AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
       AND cp.priority_tier IN ${filter}`,
    [],
    'p95_seconds',
  )
}

const fetchQuoteSuccessRate = async (pool: Pool, filter: string): Promise<number | null> => {
  return querySingle<{ avg_success_rate: number | null }>(
    pool,
    `SELECT AVG(success_rate)::double precision AS avg_success_rate
     FROM (
       SELECT
         COUNT(*) FILTER (WHERE qa.success = true)::double precision / NULLIF(COUNT(*), 0) AS success_rate
       FROM silver.quote_attempt qa
       JOIN silver.corridor_priority cp ON cp.corridor_id = qa.corridor_id
       WHERE qa.attempted_at >= NOW() - INTERVAL '1 hour'
         AND cp.priority_tier IN ${filter}
       GROUP BY qa.corridor_id, qa.provider_id
     ) AS rates`,
    [],
    'avg_success_rate',
  )
}

const fetchProviderCoverageMin = async (pool: Pool, filter: string): Promise<number | null> => {
  return querySingle<{ min_provider_count: number | null }>(
    pool,
    `SELECT MIN(provider_count)::double precision AS min_provider_count
     FROM (
       SELECT
         lqp.corridor_id,
         lqp.amount_bucket,
         COUNT(DISTINCT lqp.provider_id) AS provider_count
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
       WHERE lqp.status = 'ok'
         AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
         AND cp.priority_tier IN ${filter}
       GROUP BY lqp.corridor_id, lqp.amount_bucket
     ) AS coverage`,
    [],
    'min_provider_count',
  )
}

const fetchIndicesReadiness = async (
  pool: Pool,
  corridors: string[],
  amountBucket: number,
  methodProfile: string,
): Promise<{
  total: number
  available: number
  suppressed: number
  minProviderCount: number | null
  weightConfidenceP10: number | null
  latestDate: string | null
}> => {
  const result = await query<{
    total: number | null
    available: number | null
    suppressed: number | null
    min_provider_count: number | null
    weight_confidence_p10: number | null
    latest_date: string | null
  }>(
    `WITH latest AS (
       SELECT DISTINCT ON (corridor_id)
         corridor_id,
         date,
         suppression_flag,
         provider_count,
         weight_confidence
       FROM gold_export.cdp_daily
       WHERE corridor_id = ANY($1::text[])
         AND amount_bucket = $2
         AND method_profile = $3::method_profile
       ORDER BY corridor_id, date DESC
     )
     SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE suppression_flag IS FALSE)::int AS available,
       COUNT(*) FILTER (WHERE suppression_flag IS TRUE)::int AS suppressed,
       MIN(provider_count)::int AS min_provider_count,
       percentile_cont(0.1) WITHIN GROUP (ORDER BY weight_confidence)::double precision
         AS weight_confidence_p10,
       MAX(date)::text AS latest_date
     FROM latest`,
    [corridors, amountBucket, methodProfile],
    pool,
  )

  const row = result.rows[0]
  return {
    total: Number(row?.total ?? 0),
    available: Number(row?.available ?? 0),
    suppressed: Number(row?.suppressed ?? 0),
    minProviderCount: toNumber(row?.min_provider_count),
    weightConfidenceP10: toNumber(row?.weight_confidence_p10),
    latestDate: row?.latest_date ?? null,
  }
}

export const runDataHealthSloJob = async (): Promise<void> => {
  const silverPool = createPool(config.db.planeBUrl)
  const goldPool = createPool(config.db.planeCUrl)

  const { isShutdownRequested } = createShutdownHandler({
    timeoutMs: 30000,
    logger,
    onShutdown: async () => {
      await silverPool.end().catch(() => undefined)
      await goldPool.end().catch(() => undefined)
    },
  })

  const startTime = Date.now()
  let success = false
  try {
    const freshnessTier1 = await fetchFreshnessP95(silverPool, TIER_1_FILTER)
    const freshnessTier2 = await fetchFreshnessP95(silverPool, TIER_2_FILTER)
    const successTier1 = await fetchQuoteSuccessRate(silverPool, TIER_1_FILTER)
    const successTier2 = await fetchQuoteSuccessRate(silverPool, TIER_2_FILTER)
    const coverageTier1 = await fetchProviderCoverageMin(silverPool, TIER_1_FILTER)
    const coverageTier2 = await fetchProviderCoverageMin(silverPool, TIER_2_FILTER)

    if (freshnessTier1 !== null) recordSLOValue('freshness_p95', '1h', freshnessTier1)
    if (freshnessTier2 !== null) recordSLOValue('freshness_p95_tier2', '1h', freshnessTier2)
    if (successTier1 !== null) recordSLOValue('quote_success_rate', '1h', successTier1)
    if (successTier2 !== null) recordSLOValue('quote_success_rate_tier2', '1h', successTier2)
    if (coverageTier1 !== null) recordSLOValue('provider_coverage', '1h', coverageTier1)
    if (coverageTier2 !== null) recordSLOValue('provider_coverage_tier2', '1h', coverageTier2)

    if (healthCorridors.length > 0) {
      let minAvailableRatio = 1
      let maxSuppressedRatio = 0
      let worstIndices: {
        total: number
        available: number
        suppressed: number
        minProviderCount: number | null
        weightConfidenceP10: number | null
        latestDate: string | null
      } | null = null
      let worstProfile: string = INDICES_METHOD_PROFILES[0]
      const amountBucket = 500

      for (const methodProfile of INDICES_METHOD_PROFILES) {
        const indices = await fetchIndicesReadiness(
          goldPool,
          healthCorridors,
          amountBucket,
          methodProfile,
        )
        const total = Math.max(0, indices.total)
        const availableRatio = total > 0 ? indices.available / total : 0
        const suppressedRatio = total > 0 ? indices.suppressed / total : 0

        if (worstIndices === null || availableRatio < minAvailableRatio) {
          minAvailableRatio = availableRatio
          maxSuppressedRatio = suppressedRatio
          worstIndices = indices
          worstProfile = methodProfile
        } else if (availableRatio === minAvailableRatio && suppressedRatio > maxSuppressedRatio) {
          maxSuppressedRatio = suppressedRatio
          worstIndices = indices
          worstProfile = methodProfile
        }
      }

      recordSLOValue('indices_available_ratio', '1h', minAvailableRatio)
      recordSLOValue('indices_suppressed_ratio', '1h', maxSuppressedRatio)
      if (worstIndices?.weightConfidenceP10 != null) {
        recordSLOValue('weight_confidence_p10', '1h', worstIndices.weightConfidenceP10)
      }

      const total = Math.max(0, worstIndices?.total ?? 0)
      const availableRatio = minAvailableRatio
      const suppressedRatio = maxSuppressedRatio

      logger.info('indices_readiness', {
        corridors_expected: healthCorridors.length,
        corridors_observed: total,
        corridors_missing: Math.max(0, healthCorridors.length - total),
        available_ratio: availableRatio,
        suppressed_ratio: suppressedRatio,
        min_provider_count: worstIndices?.minProviderCount ?? null,
        weight_confidence_p10: worstIndices?.weightConfidenceP10 ?? null,
        latest_date: worstIndices?.latestDate ?? null,
        worst_profile: worstProfile,
      })
    } else {
      logger.warn('health_corridors_empty', { reason: 'no_tier0_corridors' })
    }

    success = true
  } catch (error) {
    logger.error('data_health_slo_job_failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  } finally {
    const durationSeconds = (Date.now() - startTime) / 1000
    await recordBatchJobMetric(
      'data-health-slo',
      success ? 'job_complete' : 'job_failure',
      durationSeconds,
    )
    if (isShutdownRequested()) {
      await silverPool.end().catch(() => undefined)
      await goldPool.end().catch(() => undefined)
    }
  }
}

if (require.main === module) {
  runDataHealthSloJob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
