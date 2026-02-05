import type { Pool } from 'pg'
import { Gauge } from 'prom-client'

import { createLogger } from './logger'
import { query } from './db'
import { getMetrics, metricsContentType, metricsRegistry } from './metrics-registry'
import { recordSLOValue } from './slo-tracker'

const logger = createLogger('shared.data-health-metrics')

const dataFreshnessAgeMinutes = new Gauge({
  name: 'data_freshness_age_minutes',
  help: 'Data freshness age in minutes for quotes by corridor, provider, and amount bucket.',
  labelNames: ['corridor_id', 'provider_id', 'amount_bucket'],
  registers: [metricsRegistry],
})

const quoteSuccessRate = new Gauge({
  name: 'quote_success_rate',
  help: 'Quote success rate (0.0-1.0) by corridor and provider.',
  labelNames: ['corridor_id', 'provider_id'],
  registers: [metricsRegistry],
})

const providerCoverageCount = new Gauge({
  name: 'provider_coverage_count',
  help: 'Number of providers available per corridor and amount bucket.',
  labelNames: ['corridor_id', 'amount_bucket'],
  registers: [metricsRegistry],
})

const TIER_1_FILTER = "('tier_1','tier_1_alpha')"
const TIER_2_FILTER = "('tier_2')"

export const refreshDataHealthMetrics = async (pool: Pool): Promise<void> => {
  try {
    dataFreshnessAgeMinutes.reset()
    quoteSuccessRate.reset()
    providerCoverageCount.reset()

    const freshnessRowsTier1 = await query<{
      corridor_id: string
      provider_id: string
      amount_bucket: number
      age_minutes: number
    }>(
      `SELECT 
        lqp.corridor_id,
        lqp.provider_id,
        lqp.amount_bucket,
        EXTRACT(EPOCH FROM (NOW() - lqp.collected_at)) / 60.0 AS age_minutes
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
       WHERE lqp.status = 'ok'
         AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
         AND cp.priority_tier IN ${TIER_1_FILTER}`,
      [],
      pool,
    )

    const freshnessRowsTier2 = await query<{
      corridor_id: string
      provider_id: string
      amount_bucket: number
      age_minutes: number
    }>(
      `SELECT 
        lqp.corridor_id,
        lqp.provider_id,
        lqp.amount_bucket,
        EXTRACT(EPOCH FROM (NOW() - lqp.collected_at)) / 60.0 AS age_minutes
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
       WHERE lqp.status = 'ok'
         AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
         AND cp.priority_tier IN ${TIER_2_FILTER}`,
      [],
      pool,
    )

    const successRateRowsTier1 = await query<{
      corridor_id: string
      provider_id: string
      success_rate: number
    }>(
      `SELECT 
        qa.corridor_id,
        qa.provider_id,
        COUNT(*) FILTER (WHERE qa.success = true)::float / NULLIF(COUNT(*), 0) AS success_rate
       FROM silver.quote_attempt qa
       JOIN silver.corridor_priority cp ON cp.corridor_id = qa.corridor_id
       WHERE qa.attempted_at >= NOW() - INTERVAL '1 hour'
         AND cp.priority_tier IN ${TIER_1_FILTER}
       GROUP BY qa.corridor_id, qa.provider_id`,
      [],
      pool,
    )

    const successRateRowsTier2 = await query<{
      corridor_id: string
      provider_id: string
      success_rate: number
    }>(
      `SELECT 
        qa.corridor_id,
        qa.provider_id,
        COUNT(*) FILTER (WHERE qa.success = true)::float / NULLIF(COUNT(*), 0) AS success_rate
       FROM silver.quote_attempt qa
       JOIN silver.corridor_priority cp ON cp.corridor_id = qa.corridor_id
       WHERE qa.attempted_at >= NOW() - INTERVAL '1 hour'
         AND cp.priority_tier IN ${TIER_2_FILTER}
       GROUP BY qa.corridor_id, qa.provider_id`,
      [],
      pool,
    )

    const coverageRowsTier1 = await query<{
      corridor_id: string
      amount_bucket: number
      provider_count: number
    }>(
      `SELECT 
        lqp.corridor_id,
        lqp.amount_bucket,
        COUNT(DISTINCT lqp.provider_id) AS provider_count
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
       WHERE lqp.status = 'ok'
         AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
         AND cp.priority_tier IN ${TIER_1_FILTER}
       GROUP BY lqp.corridor_id, lqp.amount_bucket`,
      [],
      pool,
    )

    const coverageRowsTier2 = await query<{
      corridor_id: string
      amount_bucket: number
      provider_count: number
    }>(
      `SELECT 
        lqp.corridor_id,
        lqp.amount_bucket,
        COUNT(DISTINCT lqp.provider_id) AS provider_count
       FROM silver.latest_quote_by_provider lqp
       JOIN silver.corridor_priority cp ON cp.corridor_id = lqp.corridor_id
       WHERE lqp.status = 'ok'
         AND lqp.collected_at >= NOW() - INTERVAL '24 hours'
         AND cp.priority_tier IN ${TIER_2_FILTER}
       GROUP BY lqp.corridor_id, lqp.amount_bucket`,
      [],
      pool,
    )

    const applyFreshnessRows = (
      rows: Array<{ corridor_id: string; provider_id: string; amount_bucket: number; age_minutes: number }>,
    ) => {
      for (const row of rows) {
        dataFreshnessAgeMinutes.set(
          {
            corridor_id: row.corridor_id,
            provider_id: row.provider_id,
            amount_bucket: String(row.amount_bucket),
          },
          row.age_minutes,
        )
      }
    }

    const applySuccessRateRows = (
      rows: Array<{ corridor_id: string; provider_id: string; success_rate: number }>,
    ) => {
      for (const row of rows) {
        quoteSuccessRate.set(
          {
            corridor_id: row.corridor_id,
            provider_id: row.provider_id,
          },
          row.success_rate,
        )
      }
    }

    const applyCoverageRows = (
      rows: Array<{ corridor_id: string; amount_bucket: number; provider_count: number }>,
    ) => {
      for (const row of rows) {
        providerCoverageCount.set(
          {
            corridor_id: row.corridor_id,
            amount_bucket: String(row.amount_bucket),
          },
          row.provider_count,
        )
      }
    }

    applyFreshnessRows(freshnessRowsTier1.rows)
    applyFreshnessRows(freshnessRowsTier2.rows)
    applySuccessRateRows(successRateRowsTier1.rows)
    applySuccessRateRows(successRateRowsTier2.rows)
    applyCoverageRows(coverageRowsTier1.rows)
    applyCoverageRows(coverageRowsTier2.rows)

    logger.debug('data_health_metrics_refreshed', {
      freshness_count: freshnessRowsTier1.rows.length + freshnessRowsTier2.rows.length,
      success_rate_count: successRateRowsTier1.rows.length + successRateRowsTier2.rows.length,
      coverage_count: coverageRowsTier1.rows.length + coverageRowsTier2.rows.length,
    })

    try {
      if (freshnessRowsTier1.rows.length > 0) {
        const freshnessSorted = freshnessRowsTier1.rows
          .map((r) => r.age_minutes * 60)
          .sort((a, b) => a - b)
        const p95Index = Math.floor(freshnessSorted.length * 0.95)
        const p95Seconds = freshnessSorted[Math.min(p95Index, freshnessSorted.length - 1)]
        recordSLOValue('freshness_p95', '1h', p95Seconds)
      }

      if (freshnessRowsTier2.rows.length > 0) {
        const freshnessSorted = freshnessRowsTier2.rows
          .map((r) => r.age_minutes * 60)
          .sort((a, b) => a - b)
        const p95Index = Math.floor(freshnessSorted.length * 0.95)
        const p95Seconds = freshnessSorted[Math.min(p95Index, freshnessSorted.length - 1)]
        recordSLOValue('freshness_p95_tier2', '1h', p95Seconds)
      }

      if (successRateRowsTier1.rows.length > 0) {
        const avgSuccessRate =
          successRateRowsTier1.rows.reduce((sum, r) => sum + (r.success_rate || 0), 0) /
          successRateRowsTier1.rows.length
        recordSLOValue('quote_success_rate', '1h', avgSuccessRate)
      }

      if (successRateRowsTier2.rows.length > 0) {
        const avgSuccessRate =
          successRateRowsTier2.rows.reduce((sum, r) => sum + (r.success_rate || 0), 0) /
          successRateRowsTier2.rows.length
        recordSLOValue('quote_success_rate_tier2', '1h', avgSuccessRate)
      }

      if (coverageRowsTier1.rows.length > 0) {
        const minCoverage = Math.min(...coverageRowsTier1.rows.map((r) => r.provider_count))
        recordSLOValue('provider_coverage', '1h', minCoverage)
      }

      if (coverageRowsTier2.rows.length > 0) {
        const minCoverage = Math.min(...coverageRowsTier2.rows.map((r) => r.provider_count))
        recordSLOValue('provider_coverage_tier2', '1h', minCoverage)
      }
    } catch (sloError) {
      logger.warn('slo_tracking_failed', {
        error: sloError instanceof Error ? sloError.message : String(sloError),
      })
    }

  } catch (error) {
    logger.error('data_health_metrics_refresh_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

let refreshInterval: NodeJS.Timeout | null = null

export const startDataHealthMetricsRefresh = (
  pool: Pool,
  intervalMinutes: number = 5,
): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }

  const refresh = async () => {
    try {
      await refreshDataHealthMetrics(pool)
    } catch (error) {
      logger.error('data_health_metrics_refresh_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  refresh()
  refreshInterval = setInterval(refresh, intervalMinutes * 60 * 1000)
}

export const stopDataHealthMetricsRefresh = (): void => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  refreshInterval = null
}

export { getMetrics, metricsContentType }
