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
import { WorkerLock } from '../plane-b/src/lib/worker-lock'
import { StoplistService } from '../plane-b/src/services'
import { RightsMatrixRepository } from '../plane-b/src/repositories'

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const lockTtlSeconds = toNumber(process.env.STOPLIST_AUTO_RESUME_LOCK_TTL_SECONDS, 300)
const logger = createLogger('script.stoplist-auto-resume')

let shutdownRequested = false
let lock: WorkerLock | null = null

const shutdown = (signal: string) => {
  if (shutdownRequested) return
  shutdownRequested = true
  logger.info('shutdown_requested', { signal })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

const run = async (): Promise<void> => {
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
    const stoplistStatuses = await rightsRepo.loadStoplistStatuses()
    const pausedProviders = stoplistStatuses.filter(
      (status) => status.stoplist_status === 'paused',
    )

    logger.info('auto_resume_start', {
      paused_provider_count: pausedProviders.length,
    })

    for (const status of pausedProviders) {
      if (shutdownRequested) {
        logger.info('auto_resume_interrupted', { provider_id: status.provider_id })
        break
      }

      try {
        const shouldResume = await stoplistService.shouldAutoResume(status.provider_id)
        if (shouldResume) {
          await stoplistService.autoResumeProvider(status.provider_id)
          resumed++
          logger.info('provider_resumed', {
            provider_id: status.provider_id,
          })
        } else {
          skipped++
        }
      } catch (error) {
        errors++
        logger.error('provider_resume_error', {
          provider_id: status.provider_id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    }

    const durationMs = Date.now() - startTime
    logger.info('auto_resume_complete', {
      resumed,
      skipped,
      errors,
      duration_ms: durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startTime
    logger.error('auto_resume_failed', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: durationMs,
    })
    throw error
  } finally {
    if (lock) {
      await lock.release()
    }
    await pool.end()
  }
}

run()
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

