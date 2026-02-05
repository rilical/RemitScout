/**
 * Stoplist Auto-Resume Batch Job - Automatically resumes paused providers after cooldown.
 *
 * This job checks all paused providers and resumes them if their cooldown period
 * has expired. Only auto-paused providers (with notes starting with 'auto_paused:')
 * are eligible for auto-resume.
 *
 * **Usage**:
 * ```bash
 * pnpm -C backend stoplist:auto-resume
 * ```
 *
 * **Environment Variables**:
 * - `STOPLIST_AUTO_RESUME_LOCK_TTL_SECONDS`: Lock TTL in seconds (default: 300 = 5 minutes)
 *
 * **Features**:
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Distributed locking (prevents concurrent runs)
 * - Comprehensive logging with metrics
 */

import { createPool } from '../shared/db'
import { config } from '../shared/config'
import { createLogger } from '../shared/logger'
import { initTracing } from '../shared/tracing'
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { StoplistService } from '../plane-b/src/services'
import { RightsMatrixRepository } from '../plane-b/src/repositories'
import { recordBatchJobMetric } from '../shared/worker-metrics'
import { formatError } from '../shared/utils/error-handling'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.STOPLIST_AUTO_RESUME_LOCK_TTL_SECONDS, 300)
const logger = createLogger('script.stoplist-auto-resume')
initTracing('stoplist-auto-resume')

let shutdownRequested = false
let lock: WorkerLock | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export const runStoplistAutoResume = async (): Promise<void> => {
  if (shutdownRequested) {
    logger.info('job_skipped', { reason: 'shutdown_requested' })
    return
  }

  lock = new WorkerLock('stoplist-auto-resume', lockTtlSeconds)
  const acquired = await lock.acquire()

  if (!acquired) {
    logger.info('job_skipped', { reason: 'lock_already_held' })
    return
  }

  const pool = createPool(config.db.planeBUrl)
  const stoplistService = new StoplistService(pool)
  const rightsRepo = new RightsMatrixRepository(pool)

  const startTime = Date.now()
  let resumed = 0
  let skipped = 0
  let errors = 0

  try {
    await recordBatchJobMetric('stoplist-auto-resume', 'job_start')
    
    const stoplistStatuses = await rightsRepo.loadStoplistStatuses()
    const pausedProviders = stoplistStatuses.filter(
      (status) => status.stoplist_status === 'paused',
    )

    logger.info('auto_resume_start', {
      paused_provider_count: pausedProviders.length,
    })

    // Process providers in parallel batches of 5
    const batchSize = 5
    for (let i = 0; i < pausedProviders.length; i += batchSize) {
      if (shutdownRequested) {
        logger.info('auto_resume_interrupted')
        break
      }

      const batch = pausedProviders.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(async (status) => {
          try {
            const shouldResume = await stoplistService.shouldAutoResume(status.provider_id)
            if (shouldResume) {
              await stoplistService.autoResumeProvider(status.provider_id)
              resumed++
              logger.info('provider_resumed', {
                provider_id: status.provider_id,
              })
              return { resumed: true, skipped: false }
            } else {
              skipped++
              return { resumed: false, skipped: true }
            }
          } catch (error) {
            errors++
            const { message, stack } = formatError(error)
            logger.error('provider_resume_error', {
              provider_id: status.provider_id,
              error: message,
              stack,
            })
            return { resumed: false, skipped: false, error: true }
          }
        }),
      )

      // Log connection pool stats
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      }
      logger.debug('auto_resume_pool_stats', poolStats)
    }

    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    logger.info('auto_resume_complete', {
      resumed,
      skipped,
      errors,
      duration_ms: durationMs,
    })
    
    await recordBatchJobMetric('stoplist-auto-resume', 'job_complete', durationSeconds, {
      resumed: String(resumed),
      skipped: String(skipped),
      errors: String(errors),
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    const durationSeconds = durationMs / 1000
    const { message } = formatError(error)
    logger.error('auto_resume_failed', {
      error: message,
      duration_ms: durationMs,
    })
    
    await recordBatchJobMetric('stoplist-auto-resume', 'job_failure', durationSeconds, {
      error_type: 'exception',
    })
    throw error
  } finally {
    if (lock) {
      await lock.release()
    }
    await pool.end()
  }
}

if (require.main === module && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  runStoplistAutoResume()
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
