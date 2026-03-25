import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { initErrorTracking } from '../shared/error-tracker'
import { RightsMatrixRepository } from '../plane-b/src/repositories'

initTracing('rights-matrix-quality-metrics-job')
initErrorTracking('rights-matrix-quality-metrics-job')

const logger = createLogger('script.rights-matrix-quality-metrics-job')

type UptimeRow = { provider_id: string; total_runs: string; success_runs: string }
type LatencyRow = { provider_id: string; avg_latency_ms: number | null }
type FrequencyRow = { provider_id: string; observed_frequency: string | null }

export const runRightsMatrixQualityMetrics = async (): Promise<void> => {
  const pool = createPool(config.db.planeBUrl)
  const repo = new RightsMatrixRepository(pool)

  try {
    const [uptimeResult, latencyResult, frequencyResult] = await Promise.all([
      query<UptimeRow>(
        `SELECT provider_id,
                COUNT(*) AS total_runs,
                COUNT(*) FILTER (WHERE status = 'success') AS success_runs
           FROM silver.ingestion_run
          WHERE created_at >= NOW() - INTERVAL '30 days'
          GROUP BY provider_id`,
        [],
        pool,
      ),
      query<LatencyRow>(
        `SELECT provider_id,
                AVG(EXTRACT(EPOCH FROM (ingested_at - collected_at)) * 1000)::INTEGER AS avg_latency_ms
           FROM silver.quote_record
          WHERE collected_at >= NOW() - INTERVAL '30 days'
            AND ingested_at IS NOT NULL
            AND collected_at IS NOT NULL
          GROUP BY provider_id`,
        [],
        pool,
      ),
      query<FrequencyRow>(
        `SELECT provider_id,
                (INTERVAL '30 days' / NULLIF(COUNT(*), 0))::TEXT AS observed_frequency
           FROM silver.ingestion_run
          WHERE created_at >= NOW() - INTERVAL '30 days'
            AND status = 'success'
          GROUP BY provider_id`,
        [],
        pool,
      ),
    ])

    const latencyByProvider = new Map<string, number | null>()
    for (const row of latencyResult.rows) {
      latencyByProvider.set(row.provider_id, row.avg_latency_ms)
    }

    const frequencyByProvider = new Map<string, string | null>()
    for (const row of frequencyResult.rows) {
      frequencyByProvider.set(row.provider_id, row.observed_frequency)
    }

    let updatedCount = 0
    const errors: Array<{ provider_id: string; error: string }> = []

    for (const row of uptimeResult.rows) {
      const totalRuns = Number(row.total_runs)
      const successRuns = Number(row.success_runs)
      const uptimeLast30d = totalRuns > 0 ? successRuns / totalRuns : null

      try {
        await repo.updateQualityMetrics({
          providerId: row.provider_id,
          observedUpdateFrequency: frequencyByProvider.get(row.provider_id) ?? null,
          uptimeLast30d,
          avgQuoteLatencyMs: latencyByProvider.get(row.provider_id) ?? null,
        })
        updatedCount += 1
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push({ provider_id: row.provider_id, error: message })
        logger.error('rights_matrix_quality_metrics_provider_update_failed', {
          provider_id: row.provider_id,
          error: message,
        })
      }
    }

    logger.info('rights_matrix_quality_metrics_complete', {
      provider_count: updatedCount,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } finally {
    await pool.end().catch(() => {
      // Ignore pool close errors.
    })
  }
}

if (require.main === module) {
  runRightsMatrixQualityMetrics()
    .then(() => { process.exit(0) })
    .catch((error) => {
      logger.error('rights_matrix_quality_metrics_failed', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      })
      process.exit(1)
    })
}
