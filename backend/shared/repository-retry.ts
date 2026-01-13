import type { Pool } from 'pg'
import { createLogger } from './logger'
import { formatError, isError } from './utils/error-handling'

const logger = createLogger('shared.repository-retry')

/**
 * Transient database error codes that should be retried.
 */
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNRESET',
  'EPIPE',
  '57P01', // PostgreSQL: admin_shutdown
  '57P02', // PostgreSQL: crash_shutdown
  '57P03', // PostgreSQL: cannot_connect_now
  '08003', // PostgreSQL: connection_does_not_exist
  '08006', // PostgreSQL: connection_failure
  '08001', // PostgreSQL: sqlclient_unable_to_establish_sqlconnection
  '08004', // PostgreSQL: sqlserver_rejected_establishment_of_sqlconnection
  '40001', // PostgreSQL: serialization_failure
  '40P01', // PostgreSQL: deadlock_detected
])

/**
 * Checks if an error is retryable.
 */
export const isRetryableError = (error: unknown): boolean => {
  if (!isError(error)) {
    return false
  }

  // Check error code
  if (error.code && RETRYABLE_ERROR_CODES.has(String(error.code))) {
    return true
  }

  // Check error message for transient patterns
  const message = error.message.toLowerCase()
  return (
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('temporary') ||
    message.includes('deadlock') ||
    message.includes('serialization')
  )
}

export type RetryOptions = {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

/**
 * Executes a database operation with retry logic for transient errors.
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    backoffMultiplier = 2,
  } = options

  let lastError: unknown
  let delayMs = initialDelayMs

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: unknown) {
      lastError = error

      if (!isRetryableError(error)) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      const { message } = formatError(error)
      logger.warn('repository_retry', {
        attempt: attempt + 1,
        max_retries: maxRetries,
        delay_ms: delayMs,
        error: message,
      })

      await new Promise((resolve) => setTimeout(resolve, delayMs))
      delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs)
    }
  }

  throw lastError
}

/**
 * Circuit breaker state for database operations.
 */
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now()

    // Check if we should transition from open to half-open
    if (this.state === 'open') {
      if (now - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'half-open'
        logger.info('circuit_breaker_half_open', {
          failures: this.failures,
        })
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      
      // Success - reset circuit breaker
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
        logger.info('circuit_breaker_closed', {
          message: 'Circuit breaker closed after successful operation',
        })
      } else {
        this.failures = Math.max(0, this.failures - 1)
      }

      return result
    } catch (error: unknown) {
      this.failures += 1
      this.lastFailureTime = now

      if (this.failures >= this.failureThreshold) {
        this.state = 'open'
        logger.error('circuit_breaker_open', {
          failures: this.failures,
          threshold: this.failureThreshold,
        })
      }

      throw error
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }
}

/**
 * Circuit breakers per repository.
 */
const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Gets or creates a circuit breaker for a repository.
 */
const getCircuitBreaker = (repository: string): CircuitBreaker => {
  if (!circuitBreakers.has(repository)) {
    circuitBreakers.set(repository, new CircuitBreaker(5, 60000))
  }
  return circuitBreakers.get(repository)!
}

/**
 * Executes a database operation with circuit breaker protection.
 */
export const withCircuitBreaker = async <T>(
  repository: string,
  operation: () => Promise<T>,
): Promise<T> => {
  const breaker = getCircuitBreaker(repository)
  return breaker.execute(operation)
}

export const resetCircuitBreakers = (): void => {
  circuitBreakers.clear()
}



