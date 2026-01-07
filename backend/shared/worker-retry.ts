import { createLogger } from './logger'
import { formatError, isError } from './utils/error-handling'
import { retry } from './retry'

const logger = createLogger('shared.worker-retry')

export type WorkerRetryOptions = {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryable?: (error: unknown) => boolean
}

/**
 * Default retryable error checker for worker operations.
 */
const isRetryableWorkerError = (error: unknown): boolean => {
  if (!isError(error)) {
    return false
  }

  const message = error.message.toLowerCase()
  const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'econnrefused',
    'etimedout',
    'enotfound',
    'econnreset',
    'temporary',
    'throttl',
    'rate limit',
    '503',
    '502',
    '500',
  ]

  return retryablePatterns.some((pattern) => message.includes(pattern))
}

/**
 * Executes a worker operation with retry logic and exponential backoff.
 */
export const withWorkerRetry = async <T>(
  operation: () => Promise<T>,
  options: WorkerRetryOptions = {},
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryable = isRetryableWorkerError,
  } = options

  return retry(operation, {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryable,
  })
}

/**
 * Executes a worker operation with retry and sends to DLQ on final failure.
 */
export const withWorkerRetryAndDLQ = async <T>(
  operation: () => Promise<T>,
  sendToDLQFn: (error: Error) => Promise<void>,
  options: WorkerRetryOptions = {},
): Promise<T> => {
  try {
    return await withWorkerRetry(operation, options)
  } catch (error: unknown) {
    const err = isError(error) ? error : new Error(String(error))
    await sendToDLQFn(err)
    throw err
  }
}



