import { createLogger } from './logger'
import { isRetryableError } from './aws-errors'
import { trackRetryAttempt, trackRetryFailure, trackRetryDelay } from './retry-metrics'

const logger = createLogger('shared.retry')

export type RetryOptions = {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  jitter?: boolean
  retryable?: (error: unknown) => boolean
  timeoutMs?: number
  signal?: AbortSignal
  operation?: string
}

const defaultOptions: Required<Omit<RetryOptions, 'timeoutMs' | 'signal'>> & {
  timeoutMs?: number
  signal?: AbortSignal
} = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryable: (error) => isRetryableError(error),
  operation: 'unknown',
}

const calculateDelay = (
  attempt: number,
  options: Required<Omit<RetryOptions, 'timeoutMs' | 'signal'>> & {
    timeoutMs?: number
    signal?: AbortSignal
  },
): number => {
  const baseDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt)
  const cappedDelay = Math.min(baseDelay, options.maxDelayMs)

  if (!options.jitter) {
    return cappedDelay
  }

  return cappedDelay * (0.5 + Math.random() * 0.5)
}

export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const opts = {
    ...defaultOptions,
    ...options,
  }
  const retryableFn =
    typeof options.retryable === 'function' ? options.retryable : defaultOptions.retryable

  const operation = options.operation || 'unknown'
  let lastError: unknown
  let attempt = 0
  const startTime = Date.now()
  let totalDelay = 0

  const checkTimeout = (): void => {
    if (opts.timeoutMs) {
      const elapsed = Date.now() - startTime
      if (elapsed >= opts.timeoutMs) {
        const timeoutError = new Error(
          `Retry timeout exceeded: ${elapsed}ms >= ${opts.timeoutMs}ms`,
        )
        logger.debug('retry_timeout', {
          elapsed_ms: elapsed,
          timeout_ms: opts.timeoutMs,
          attempt,
        })
        throw timeoutError
      }
    }
  }

  const checkCancellation = (): void => {
    if (opts.signal?.aborted) {
      const cancelError = new Error('Retry cancelled via AbortSignal')
      logger.debug('retry_cancelled', { attempt })
      throw cancelError
    }
  }

  while (attempt <= opts.maxRetries) {
    try {
      checkCancellation()
      checkTimeout()
      const result = await fn()
      if (attempt > 0) {
        trackRetryAttempt(operation, true)
        trackRetryDelay(operation, totalDelay / 1000)
      }
      return result
    } catch (error) {
      lastError = error

      if (opts.signal?.aborted) {
        throw new Error('Retry cancelled via AbortSignal')
      }

      let retryable = false
      try {
        retryable = retryableFn(error)
      } catch (retryableError) {
        logger.warn('retryable_check_failed', {
          attempt,
          error: retryableError instanceof Error ? retryableError.message : String(retryableError),
        })
        retryable = false
      }

      if (!retryable) {
        logger.debug('retry_skipped_not_retryable', { attempt, error })
        throw error
      }

      if (attempt >= opts.maxRetries) {
        trackRetryAttempt(operation, false)
        trackRetryFailure(operation)
        trackRetryDelay(operation, totalDelay / 1000)
        logger.debug('retry_exhausted', {
          attempt,
          maxRetries: opts.maxRetries,
          total_delay_ms: totalDelay,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }

      trackRetryAttempt(operation, false)

      checkTimeout()

      const delay = calculateDelay(attempt, opts)
      totalDelay += delay

      if (opts.timeoutMs) {
        const elapsed = Date.now() - startTime
        const remaining = opts.timeoutMs - elapsed
        if (remaining <= 0) {
          throw new Error(
            `Retry timeout exceeded: ${elapsed}ms >= ${opts.timeoutMs}ms`,
          )
        }
        const actualDelay = Math.min(delay, remaining)
        logger.debug('retry_waiting', {
          attempt: attempt + 1,
          delayMs: Math.round(actualDelay),
          total_delay_ms: totalDelay,
          error: error instanceof Error ? error.message : String(error),
        })
        await new Promise<void>((resolve, reject) => {
          if (opts.signal) {
            opts.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId)
              reject(new Error('Retry cancelled via AbortSignal'))
            })
          }
          const timeoutId = setTimeout(resolve, actualDelay)
        })
      } else {
        logger.debug('retry_waiting', {
          attempt: attempt + 1,
          delayMs: Math.round(delay),
          total_delay_ms: totalDelay,
          error: error instanceof Error ? error.message : String(error),
        })
        await new Promise<void>((resolve, reject) => {
          if (opts.signal) {
            opts.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId)
              reject(new Error('Retry cancelled via AbortSignal'))
            })
          }
          const timeoutId = setTimeout(resolve, delay)
        })
      }
      attempt += 1
    }
  }

  throw lastError
}
