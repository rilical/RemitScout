/**
 * B2C Retry Failed Worker - Retries failed B2C quote refresh requests.
 *
 * This worker resets failed requests back to 'pending' status after a minimum
 * age threshold, allowing them to be retried by the main refresh worker.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend b2c:retry-failed
 * ```
 *
 * **Environment Variables**:
 * - `B2C_RETRY_MIN_AGE_SECONDS`: Minimum age in seconds before retrying (default: 300 = 5 minutes)
 */

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { QuoteRefreshRepository } from '../plane-b/src/repositories'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const minAgeSeconds = toNumber(process.env.B2C_RETRY_MIN_AGE_SECONDS, 300)
const logger = createLogger('script.b2c-retry-failed')
initTracing('b2c-retry-failed')
const lockTtlSeconds = 300

export const runB2cRetryFailed = async (): Promise<number> => {
  const lock = new WorkerLock('b2c-retry-failed', lockTtlSeconds)
  const acquired = await lock.acquire()
  if (!acquired) {
    logger.info('retry_skipped', { reason: 'lock_already_held' })
    return 0
  }

  const pool = createPool(config.db.planeBUrl)
  const repo = new QuoteRefreshRepository(pool)

  try {
    const retriedCount = await repo.retryFailedRequests(minAgeSeconds)
    logger.info('retry_complete', {
      retried_count: retriedCount,
      min_age_seconds: minAgeSeconds,
    })
    return retriedCount
  } finally {
    await pool.end()
    await lock.release()
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runB2cRetryFailed()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      logger.error('retry_failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      process.exit(1)
    })
}



