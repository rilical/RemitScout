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

export const refreshDataHealthMetrics = async (pool: Pool): Promise<void> => {
  try {
    dataFreshnessAgeMinutes.reset()
    quoteSuccessRate.reset()
    providerCoverageCount.reset()

    const freshnessRows = await query<{
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
         AND cp.priority_tier = 'tier_1_alpha'`,
      [],
      pool,
    )

    const successRateRows = await query<{
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
         AND cp.priority_tier = 'tier_1_alpha'
       GROUP BY qa.corridor_id, qa.provider_id`,
      [],
      pool,
    )

    const coverageRows = await query<{
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
         AND cp.priority_tier = 'tier_1_alpha'
       GROUP BY lqp.corridor_id, lqp.amount_bucket`,
      [],
      pool,
    )

    for (const row of freshnessRows.rows) {
      dataFreshnessAgeMinutes.set(
        {
          corridor_id: row.corridor_id,
          provider_id: row.provider_id,
          amount_bucket: String(row.amount_bucket),
        },
        row.age_minutes,
      )
    }

    for (const row of successRateRows.rows) {
      quoteSuccessRate.set(
        {
          corridor_id: row.corridor_id,
          provider_id: row.provider_id,
        },
        row.success_rate,
      )
    }

    for (const row of coverageRows.rows) {
      providerCoverageCount.set(
        {
          corridor_id: row.corridor_id,
          amount_bucket: String(row.amount_bucket),
        },
        row.provider_count,
      )
    }

    logger.debug('data_health_metrics_refreshed', {
      freshness_count: freshnessRows.rows.length,
      success_rate_count: successRateRows.rows.length,
      coverage_count: coverageRows.rows.length,
    })

    try {
      if (freshnessRows.rows.length > 0) {
        const freshnessSorted = freshnessRows.rows
          .map((r) => r.age_minutes * 60)
          .sort((a, b) => a - b)
        const p95Index = Math.floor(freshnessSorted.length * 0.95)
        const p95Seconds = freshnessSorted[Math.min(p95Index, freshnessSorted.length - 1)]
        recordSLOValue('freshness_p95', '1h', p95Seconds)
      }

      if (successRateRows.rows.length > 0) {
        const avgSuccessRate =
          successRateRows.rows.reduce((sum, r) => sum + (r.success_rate || 0), 0) /
          successRateRows.rows.length
        recordSLOValue('quote_success_rate', '1h', avgSuccessRate)
      }

      if (coverageRows.rows.length > 0) {
        const minCoverage = Math.min(...coverageRows.rows.map((r) => r.provider_count))
        recordSLOValue('provider_coverage', '1h', minCoverage)
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
