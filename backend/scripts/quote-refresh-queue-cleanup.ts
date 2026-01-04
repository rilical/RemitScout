/**
 * Quote Refresh Queue Cleanup - remove processed rows from DB queue.
 *
 * Usage:
 *   pnpm -C backend b2c:queue-cleanup
 *
 * Env:
 * - QUOTE_REFRESH_CLEANUP_STATUSES (default: completed,failed,blocked,skipped)
 * - QUOTE_REFRESH_CLEANUP_AGE_HOURS (default: 168 = 7 days)
 */

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { QuoteRefreshRepository } from '../plane-b/src/repositories/implementations/quote-refresh-repository'
import { QuoteRefreshStatus } from '../plane-b/src/repositories/types/quote-refresh-status'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { formatError } from '../shared/utils/error-handling'

const logger = createLogger('script.quote-refresh-queue-cleanup')

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseStatusList = (value: string | undefined) =>
  (value || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)

const statusMap: Record<string, QuoteRefreshStatus> = {
  completed: QuoteRefreshStatus.COMPLETED,
  failed: QuoteRefreshStatus.FAILED,
  blocked: QuoteRefreshStatus.BLOCKED,
  skipped: QuoteRefreshStatus.SKIPPED,
}

const defaultStatuses = [
  QuoteRefreshStatus.COMPLETED,
  QuoteRefreshStatus.FAILED,
  QuoteRefreshStatus.BLOCKED,
  QuoteRefreshStatus.SKIPPED,
]

const statuses = (() => {
  const parsed = parseStatusList(process.env.QUOTE_REFRESH_CLEANUP_STATUSES)
  if (parsed.length === 0) return defaultStatuses
  const resolved = parsed
    .map(item => statusMap[item])
    .filter(Boolean)
  return resolved.length ? resolved : defaultStatuses
})()

const olderThanHours = toNumber(process.env.QUOTE_REFRESH_CLEANUP_AGE_HOURS, 168)

export const runQuoteRefreshQueueCleanup = async () => {
  if (olderThanHours <= 0) {
    logger.info('cleanup_skipped', { reason: 'invalid_age_hours', older_than_hours: olderThanHours })
    return
  }

  const pool = createPool(config.db.planeBUrl)
  const repo = new QuoteRefreshRepository(pool)
  const start = Date.now()

  try {
    await recordBatchJobMetric('quote-refresh-queue-cleanup', 'job_start')
    
    const deleted = await repo.cleanupRequests(statuses, olderThanHours)
    const durationMs = Date.now() - start
    const durationSeconds = durationMs / 1000
    
    logger.info('cleanup_complete', {
      deleted_count: deleted,
      statuses,
      older_than_hours: olderThanHours,
      duration_ms: durationMs,
    })
    
    await recordBatchJobMetric('quote-refresh-queue-cleanup', 'job_complete', durationSeconds, {
      deleted_count: String(deleted),
    })
  } catch (error) {
    const durationMs = Date.now() - start
    const durationSeconds = durationMs / 1000
    const { message } = formatError(error)
    logger.error('cleanup_failed', {
      error: message,
      duration_ms: durationMs,
    })
    
    await recordBatchJobMetric('quote-refresh-queue-cleanup', 'job_failure', durationSeconds, {
      error_type: 'exception',
    })
    throw error
  } finally {
    await pool.end()
  }
}

runQuoteRefreshQueueCleanup()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('cleanup_failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })
