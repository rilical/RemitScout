/**
 * Gold Popular Corridors Batch Job - Aggregates recent search and quote data.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend gold:popular-corridors
 * ```
 *
 * **Environment Variables**:
 * - `GOLD_POPULAR_CORRIDORS_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 600 = 10 minutes)
 * - `GOLD_POPULAR_CORRIDORS_MAX`: Max corridors to process (default: 100)
 *
 * **Features**:
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Distributed locking (prevents concurrent runs)
 * - Comprehensive logging with metrics
 */

import type { PoolClient } from 'pg'

import { createPool, query } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { createShutdownHandler } from '../shared/shutdown'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { PopularCorridorRepository } from '../plane-b/src/repositories'
import type { PopularCorridorAggregationRow } from '../plane-b/src/repositories/interfaces/popular-corridor-repository.interface'
import {
  recordJobStart,
  recordJobComplete,
  recordJobFailure,
} from './gold-popular-corridors-job-metrics'
import { startHealthServer } from './gold-popular-corridors-job-health'
import { retry } from '../shared/retry'

const toNumber = (value: string | number | null | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const isValidRoute = (value: string) => {
  const trimmed = value.trim()
  return /^[^→]+ → [^→]+$/.test(trimmed)
}

const lockTtlSeconds = toNumber(process.env.GOLD_POPULAR_CORRIDORS_LOCK_TTL_SECONDS, 600)
const lockRefreshMs = Math.max(1000, Math.floor((lockTtlSeconds * 1000) / 2))
const logger = createLogger('script.gold-popular-corridors')
initTracing('gold-popular-corridors-job')

let lock: WorkerLock | null = null
let lockRefreshTimer: ReturnType<typeof setInterval> | null = null
let healthServer: { close: () => Promise<void> } | null = null
let pool: ReturnType<typeof createPool> | null = null

const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

const { isShutdownRequested, signal: shutdownSignal } = createShutdownHandler({
  timeoutMs: 30000,
  logger,
  onShutdown: async () => {
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
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
    if (pool) {
      await pool.end()
    }
  },
})

export const runGoldPopularCorridorsJob = async (
  options: { enableHealthServer?: boolean } = {},
): Promise<void> => {
  if (isShutdownRequested()) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  const enableHealthServer = options.enableHealthServer ?? !isLambdaRuntime
  if (enableHealthServer) {
    try {
      healthServer = await startHealthServer({ logger })
    } catch (error) {
      logger.warn('health_server_start_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  lock = new WorkerLock('gold-popular-corridors-job', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    recordJobFailure('lock_failed')
    return
  }

  recordJobStart()

  lockRefreshTimer = setInterval(() => {
    if (!lock) return
    lock.extend()
      .then((extended) => {
        if (!extended && config.redis.url) {
          logger.warn('lock_extend_failed', { lock_key: 'gold-popular-corridors-job' })
        }
      })
      .catch((error) => {
        logger.warn('lock_extend_failed', {
          lock_key: 'gold-popular-corridors-job',
          error: error instanceof Error ? error.message : String(error),
        })
      })
  }, lockRefreshMs)

  pool = createPool(config.db.planeBUrl)
  const repo = new PopularCorridorRepository(pool)
  const startTime = Date.now()
  const maxCorridors = toNumber(process.env.GOLD_POPULAR_CORRIDORS_MAX, 100)
  let client: PoolClient | null = null
  let rows: PopularCorridorAggregationRow[] = []
  let inserted = 0

  try {
    logger.info('job_start', {
      lock_ttl_seconds: lockTtlSeconds,
      max_corridors: maxCorridors,
    })
    rows = await retry(
      () => repo.aggregatePopularCorridors(maxCorridors),
      {
        maxRetries: 3,
        initialDelayMs: 500,
        maxDelayMs: 10000,
        timeoutMs: 60000,
        operation: 'gold-popular-corridors.aggregate',
        signal: shutdownSignal,
        retryable: (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error)
          return errorMessage.includes('connection') ||
                 errorMessage.includes('timeout') ||
                 errorMessage.includes('ECONNREFUSED') ||
                 errorMessage.includes('ETIMEDOUT')
        },
      },
    )

    if (rows.length === 0) {
      logger.warn('job_no_data', { message: 'No popular corridors found in last 24 hours' })
      const durationMs = Date.now() - startTime
      const durationSeconds = durationMs / 1000
      recordJobComplete(durationSeconds, 0, 0)
      return
    }

    const valid = rows.filter((row) => {
      if (isValidRoute(row.route)) return true
      logger.warn('invalid_route_format', { route: row.route })
      return false
    })

    if (valid.length === 0) {
      logger.warn('job_no_valid_rows', {
        message: 'All popular corridor rows were invalid; preserving existing dataset.',
        rows_seen: rows.length,
      })
      const durationMs = Date.now() - startTime
      const durationSeconds = durationMs / 1000
      recordJobComplete(durationSeconds, rows.length, 0)
      return
    }

    client = await pool.connect()
    const txRepo = new PopularCorridorRepository(client)
    await client.query('BEGIN')
    try {
      await txRepo.clearAll()

      // Bulk insert to avoid N+1 inserts (pattern: freshness-report-repository.ts).
      await retry(
        () => query(
          `INSERT INTO gold.popular_corridors
           (route, count_24h, top_provider, fee_range, speed_range, best_for)
           SELECT * FROM UNNEST(
             $1::text[],
             $2::int[],
             $3::text[],
             $4::text[],
             $5::text[],
             $6::text[]
           )`,
          [
            valid.map((r) => r.route),
            valid.map((r) => toNumber(r.count_24h, 0)),
            valid.map((r) => r.top_provider ?? null),
            valid.map((r) => r.fee_range ?? null),
            valid.map((r) => r.speed_range ?? null),
            valid.map((r) => r.best_for ?? null),
          ],
          client!,
        ),
        {
          maxRetries: 2,
          initialDelayMs: 200,
          maxDelayMs: 10000,
          timeoutMs: 60000,
          operation: 'gold-popular-corridors.insert_bulk',
          signal: shutdownSignal,
          retryable: (error) => {
            const errorMessage = error instanceof Error ? error.message : String(error)
            return errorMessage.includes('connection')
              || errorMessage.includes('timeout')
              || errorMessage.includes('ECONNREFUSED')
          },
        },
      )
      inserted = valid.length

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    logger.info('job_complete', {
      corridors_processed: rows.length,
      corridors_inserted: inserted,
      duration_ms: durationMs,
    })
    recordJobComplete(durationSeconds, rows.length, inserted)
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.error('job_failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: durationMs,
    })

    const errorMessage = error instanceof Error ? error.message : String(error)
    let errorType = 'unknown'
    if (errorMessage.includes('lock') || errorMessage.includes('Lock')) {
      errorType = 'lock_failed'
    } else if (errorMessage.includes('query') || errorMessage.includes('SELECT') || errorMessage.includes('aggregate')) {
      errorType = 'query_failed'
    } else if (errorMessage.includes('insert') || errorMessage.includes('INSERT') || errorMessage.includes('constraint')) {
      errorType = 'insert_failed'
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      errorType = 'validation_failed'
    }

    recordJobFailure(errorType)
    throw error
  } finally {
    if (healthServer) {
      await healthServer.close().catch((error) => {
        logger.warn('health_server_close_failed', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    }
    if (lockRefreshTimer) {
      clearInterval(lockRefreshTimer)
    }
    if (lock) {
      await lock.release()
    }
    if (client) {
      client.release()
    }
    if (pool && !isShutdownRequested()) {
      await pool.end()
      pool = null
    }
  }
}

if (require.main === module && !isLambdaRuntime) {
  runGoldPopularCorridorsJob()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      logger.error('job_fatal_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}
