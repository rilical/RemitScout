/**
 * Gold Reconciliation Job - Backfills missed Gold updates.
 *
 * This job runs periodically (every 10-15 min) to:
 * - Detect corridors with stale Gold exports (> 15 min lag)
 * - Re-process those corridors to ensure consistency
 * - Acts as a safety net for missed live updates
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:reconciliation
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_RECONCILIATION_LOCK_TTL_SECONDS`: Lock TTL (default: 600)
 * - `GOLD_RECONCILIATION_STALE_THRESHOLD_MINUTES`: Minutes before considering stale (default: 15)
 * - `GOLD_RECONCILIATION_MAX_CORRIDORS`: Max corridors to process per run (default: 500)
 */

import type { Pool } from 'pg'
import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { retry } from '../shared/retry'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { formatError } from '../shared/utils/error-handling'
import { GoldPublisherLive } from '../plane-c/src/services/gold-publisher-live'
import { upsertGoldIndicesLive } from './gold-indices-live'

const logger = createLogger('script.gold-reconciliation-job')
initTracing('gold-reconciliation-job')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.GOLD_RECONCILIATION_LOCK_TTL_SECONDS, 600)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const staleThresholdMinutes = toNumber(process.env.GOLD_RECONCILIATION_STALE_THRESHOLD_MINUTES, 15)
const maxCorridors = toNumber(process.env.GOLD_RECONCILIATION_MAX_CORRIDORS, 500)

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let silverPool: Pool | null = null
let goldPool: Pool | null = null

const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

const { isShutdownRequested } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release().catch((error) => {
        logger.warn('lock_release_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (silverPool) {
      await silverPool.end()
    }
    if (goldPool) {
      await goldPool.end()
    }
  },
})

type StaleCorridorRow = {
  corridor_id: string
  silver_updated_at: Date
  gold_rates_updated_at: Date | null
  gold_indices_updated_at: Date | null
  rates_lag_minutes: number
  indices_lag_minutes: number
}

const findStaleCorridors = async (pool: Pool, thresholdMinutes: number, limit: number): Promise<string[]> => {
  const result = await query<StaleCorridorRow>(
    `WITH silver_latest AS (
      SELECT
        qr.corridor_id,
        MAX(qr.collected_at) AS silver_updated_at
      FROM silver.quote_record qr
      JOIN silver.ingestion_run ir ON ir.run_id = qr.ingestion_run_id
      WHERE qr.status = 'ok'
        AND qr.collected_at >= NOW() - INTERVAL '4 hours'
        AND ir.collector_type LIKE 'b2b_%'
        AND ir.status = 'success'
      GROUP BY qr.corridor_id
    ),
    gold_rates_latest AS (
      SELECT
        corridor_id,
        MAX(created_at) AS gold_updated_at
      FROM gold_export.corridor_rates
      WHERE timestamp_bucket >= NOW() - INTERVAL '8 hours'
      GROUP BY corridor_id
    ),
    gold_indices_latest AS (
      SELECT
        corridor_id,
        MAX(created_at) AS gold_updated_at
      FROM gold_export.cdp_daily
      WHERE date >= CURRENT_DATE - INTERVAL '2 days'
      GROUP BY corridor_id
    )
    SELECT
      s.corridor_id,
      s.silver_updated_at,
      gr.gold_updated_at AS gold_rates_updated_at,
      gi.gold_updated_at AS gold_indices_updated_at,
      EXTRACT(EPOCH FROM (s.silver_updated_at - COALESCE(gr.gold_updated_at, '1970-01-01'::timestamptz))) / 60 AS rates_lag_minutes,
      EXTRACT(EPOCH FROM (s.silver_updated_at - COALESCE(gi.gold_updated_at, '1970-01-01'::timestamptz))) / 60 AS indices_lag_minutes
    FROM silver_latest s
    LEFT JOIN gold_rates_latest gr ON gr.corridor_id = s.corridor_id
    LEFT JOIN gold_indices_latest gi ON gi.corridor_id = s.corridor_id
    WHERE COALESCE(gr.gold_updated_at, '1970-01-01'::timestamptz) < s.silver_updated_at - ($1 * INTERVAL '1 minute')
       OR COALESCE(gi.gold_updated_at, '1970-01-01'::timestamptz) < s.silver_updated_at - ($1 * INTERVAL '1 minute')
    ORDER BY GREATEST(
      EXTRACT(EPOCH FROM (s.silver_updated_at - COALESCE(gr.gold_updated_at, '1970-01-01'::timestamptz))),
      EXTRACT(EPOCH FROM (s.silver_updated_at - COALESCE(gi.gold_updated_at, '1970-01-01'::timestamptz)))
    ) DESC
    LIMIT $2`,
    [thresholdMinutes, limit],
    pool,
  )

  return result.rows.map((row) => row.corridor_id)
}

export const runGoldReconciliationJob = async (): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('gold-reconciliation-job', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return
  }

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend()
      .then((extended) => {
        if (!extended && config.redis.url) {
          logger.warn('lock_extend_failed', { lock_key: 'gold-reconciliation-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-reconciliation-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  silverPool = createPool(config.db.planeBUrl)
  goldPool = createPool(config.db.planeCUrl)

  const publisher = new GoldPublisherLive(silverPool, goldPool)
  const startTime = Date.now()

  try {
    await recordBatchJobMetric('gold-reconciliation-job', 'job_start')

    const staleCorridors = await retry(
      () => findStaleCorridors(silverPool!, staleThresholdMinutes, maxCorridors),
      {
        maxRetries: 3,
        initialDelayMs: 500,
        retryable: (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error)
          return errorMessage.includes('connection') ||
                 errorMessage.includes('timeout') ||
                 errorMessage.includes('ECONNREFUSED') ||
                 errorMessage.includes('ETIMEDOUT')
        },
      },
    )

    if (staleCorridors.length === 0) {
      const durationMs = Date.now() - startTime
      logger.info('job_complete', {
        reconciled: 0,
        duration_ms: durationMs,
        reason: 'no_stale_corridors',
      })
      await recordBatchJobMetric('gold-reconciliation-job', 'job_complete', durationMs / 1000, {
        reconciled: '0',
      })
      return
    }

    logger.info('stale_corridors_found', {
      count: staleCorridors.length,
      threshold_minutes: staleThresholdMinutes,
    })

    let publisherSuccess = 0
    let publisherErrors = 0
    let indicesSuccess = 0
    let indicesErrors = 0

    const batchSize = 50
    for (let i = 0; i < staleCorridors.length; i += batchSize) {
      if (isShutdownRequested()) {
        logger.info('job_interrupted', { reason: 'shutdown_requested', processed: i })
        break
      }

      const batch = staleCorridors.slice(i, i + batchSize)

      try {
        const result = await publisher.processCorridors(batch)
        publisherSuccess += result.published
        publisherErrors += result.errors
      } catch (error) {
        logger.error('reconciliation_publisher_batch_failed', {
          error: error instanceof Error ? error.message : String(error),
          batch_start: i,
          batch_size: batch.length,
        })
        publisherErrors += batch.length
      }

      try {
        const upserted = await upsertGoldIndicesLive(silverPool!, goldPool!, { corridorIds: batch })
        indicesSuccess += upserted
      } catch (error) {
        logger.error('reconciliation_indices_batch_failed', {
          error: error instanceof Error ? error.message : String(error),
          batch_start: i,
          batch_size: batch.length,
        })
        indicesErrors += batch.length
      }
    }

    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000

    logger.info('job_complete', {
      stale_corridors: staleCorridors.length,
      publisher_success: publisherSuccess,
      publisher_errors: publisherErrors,
      indices_success: indicesSuccess,
      indices_errors: indicesErrors,
      duration_ms: durationMs,
    })

    await recordBatchJobMetric('gold-reconciliation-job', 'job_complete', durationSeconds, {
      stale_corridors: String(staleCorridors.length),
      publisher_success: String(publisherSuccess),
      indices_success: String(indicesSuccess),
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    const { message } = formatError(error)
    logger.error('job_failed', {
      error: message,
      duration_ms: durationMs,
    })

    await recordBatchJobMetric('gold-reconciliation-job', 'job_failure', durationSeconds, {
      error_type: 'unknown',
    })
    throw error
  } finally {
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release()
    }
    if (silverPool && !isShutdownRequested()) {
      await silverPool.end()
      silverPool = null
    }
    if (goldPool && !isShutdownRequested()) {
      await goldPool.end()
      goldPool = null
    }
  }
}

if (require.main === module && !isLambdaRuntime) {
  runGoldReconciliationJob()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('job_fatal_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
