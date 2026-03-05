import type { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { UsageLogRepository } from '../repositories'
import type { IUsageLogRepository } from '../repositories'

const logger = createLogger('plane-a.usage-log-buffer')

export type UsageLogEntry = {
  clientId: string
  endpoint: string
  corridorId: string | null
  responseTimeMs: number | null
  statusCode: number
}

const buffer: UsageLogEntry[] = []
let flushTimer: NodeJS.Timeout | null = null
let repo: IUsageLogRepository | null = null
let shutdownRegistered = false
let droppedCount = 0

const MAX_BUFFER_SIZE = config.planeA.usageLogBufferSize
const FLUSH_INTERVAL_MS = config.planeA.usageLogFlushIntervalMs
const HARD_MAX_BUFFER_SIZE = MAX_BUFFER_SIZE * 10

/**
 * Initialize the usage log buffer with the database pool.
 * Must be called once at startup before pushing entries.
 */
export const initUsageLogBuffer = (dbPool: Pool): void => {
  repo = new UsageLogRepository(dbPool)

  if (!shutdownRegistered) {
    shutdownRegistered = true

    const onShutdown = () => {
      flushUsageLogBuffer().catch((error) => {
        logger.warn('usage_log_buffer_shutdown_flush_failed', {
          error: error instanceof Error ? error.message : String(error),
          dropped_entries: buffer.length,
        })
      })
    }

    process.once('SIGTERM', onShutdown)
    process.once('SIGINT', onShutdown)
  }

  scheduleFlush()
}

/**
 * Push a usage log entry into the in-memory buffer.
 * When the buffer reaches its max size, an immediate flush is triggered.
 * Entries are dropped if the buffer exceeds the hard memory cap.
 */
export const pushUsageLogEntry = (entry: UsageLogEntry): void => {
  if (buffer.length >= HARD_MAX_BUFFER_SIZE) {
    droppedCount++
    if (droppedCount % 100 === 0) {
      logger.warn('usage_log_buffer_hard_cap_reached', {
        dropped_count: droppedCount,
        buffer_size: buffer.length,
        hard_max: HARD_MAX_BUFFER_SIZE,
      })
    }
    return
  }

  buffer.push(entry)

  if (buffer.length >= MAX_BUFFER_SIZE) {
    flushUsageLogBuffer().catch((error) => {
      logger.warn('usage_log_buffer_size_flush_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
    return
  }

  scheduleFlush()
}

const scheduleFlush = (): void => {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flushUsageLogBuffer().catch((error) => {
      logger.warn('usage_log_buffer_timer_flush_failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    })
  }, FLUSH_INTERVAL_MS)
  flushTimer.unref?.()
}

/**
 * Flush all buffered entries to the database in a single bulk INSERT.
 * On failure the entries are retained in the buffer for the next flush cycle.
 */
export const flushUsageLogBuffer = async (): Promise<void> => {
  if (buffer.length === 0) return
  if (!repo) {
    logger.warn('usage_log_buffer_flush_skipped', { reason: 'repo_not_initialized' })
    return
  }

  // Drain the buffer into a local batch so new entries can still accumulate
  // while the INSERT is in flight.
  const batch = buffer.splice(0, buffer.length)

  try {
    await repo.bulkInsertUsageLogs(batch)

    logger.debug('usage_log_buffer_flushed', { count: batch.length })
  } catch (error) {
    // On failure, put the entries back at the front of the buffer so they
    // are retried on the next flush cycle.
    buffer.unshift(...batch)

    logger.warn('usage_log_buffer_flush_failed', {
      error: error instanceof Error ? error.message : String(error),
      batch_size: batch.length,
      buffer_size: buffer.length,
    })
  }

  // If there are still entries (from failure retry or new pushes during flush),
  // schedule the next flush.
  if (buffer.length > 0) {
    scheduleFlush()
  }
}
