import { Pool } from 'pg'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'

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
let pool: Pool | null = null
let shutdownRegistered = false

const MAX_BUFFER_SIZE = config.planeA.usageLogBufferSize
const FLUSH_INTERVAL_MS = config.planeA.usageLogFlushIntervalMs

/**
 * Initialize the usage log buffer with the database pool.
 * Must be called once at startup before pushing entries.
 */
export const initUsageLogBuffer = (dbPool: Pool): void => {
  pool = dbPool

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
 */
export const pushUsageLogEntry = (entry: UsageLogEntry): void => {
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
  if (!pool) {
    logger.warn('usage_log_buffer_flush_skipped', { reason: 'pool_not_initialized' })
    return
  }

  // Drain the buffer into a local batch so new entries can still accumulate
  // while the INSERT is in flight.
  const batch = buffer.splice(0, buffer.length)

  try {
    // Build a single bulk INSERT with parameterized placeholders.
    // Each row has 5 columns, so row N uses params at offset N*5.
    const valueClauses: string[] = []
    const params: unknown[] = []

    for (let i = 0; i < batch.length; i++) {
      const offset = i * 5
      valueClauses.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`,
      )
      params.push(
        batch[i].clientId,
        batch[i].endpoint,
        batch[i].corridorId,
        batch[i].responseTimeMs,
        batch[i].statusCode,
      )
    }

    const sql = `
      INSERT INTO public.api_usage_log (
        client_id,
        endpoint,
        corridor_id,
        response_time_ms,
        status_code
      ) VALUES ${valueClauses.join(', ')}
    `

    await pool.query(sql, params)

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
