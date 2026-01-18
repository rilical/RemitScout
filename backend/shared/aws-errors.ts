import { createLogger } from './logger'

const logger = createLogger('shared.aws-errors')

export interface AWSRetryableError extends Error {
  $metadata?: {
    httpStatusCode?: number
  }
  code?: string
}

const RETRYABLE_ERROR_CODES = new Set([
  'Throttling',
  'ThrottlingException',
  'ThrottledException',
  'ServiceUnavailable',
  'ServiceUnavailableException',
  'InternalServerError',
  'InternalError',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'RequestTimeout',
  'RequestTimeoutException',
  'TooManyRequestsException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
])

const THROTTLING_ERROR_CODES = new Set([
  'Throttling',
  'ThrottlingException',
  'ThrottledException',
  'TooManyRequestsException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
])

const NON_RETRYABLE_ERROR_CODES = new Set([
  'InvalidMessage',
  'InvalidParameter',
  'InvalidParameterValue',
  'InvalidParameterException',
  'AccessDenied',
  'AccessDeniedException',
  'UnauthorizedOperation',
  'Forbidden',
  'ValidationException',
  'InvalidRequest',
  'MalformedQueryString',
  'InvalidAction',
])

const RETRYABLE_HTTP_STATUS_CODES = new Set([429, 500, 502, 503, 504])

export const isRetryableError = (error: unknown): boolean => {
  if (!error) return false

  const awsError = error as AWSRetryableError

  if (awsError.code && RETRYABLE_ERROR_CODES.has(awsError.code)) {
    return true
  }

  if (awsError.code && NON_RETRYABLE_ERROR_CODES.has(awsError.code)) {
    return false
  }

  if (awsError.name && RETRYABLE_ERROR_CODES.has(awsError.name)) {
    return true
  }

  if (awsError.name && NON_RETRYABLE_ERROR_CODES.has(awsError.name)) {
    return false
  }

  const httpStatusCode = awsError.$metadata?.httpStatusCode
  if (httpStatusCode && RETRYABLE_HTTP_STATUS_CODES.has(httpStatusCode)) {
    return true
  }

  if (httpStatusCode && httpStatusCode >= 400 && httpStatusCode < 500) {
    if (httpStatusCode === 429) {
      return true
    }
    return false
  }

  if (httpStatusCode && httpStatusCode >= 500) {
    return true
  }

  const errorMessage = awsError.message?.toLowerCase() || ''
  if (
    errorMessage.includes('throttl') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('internal server error')
  ) {
    return true
  }

  return false
}

export const isThrottlingError = (error: unknown): boolean => {
  if (!error) return false

  const awsError = error as AWSRetryableError

  if (awsError.code && THROTTLING_ERROR_CODES.has(awsError.code)) {
    return true
  }

  if (awsError.name && THROTTLING_ERROR_CODES.has(awsError.name)) {
    return true
  }

  const httpStatusCode = awsError.$metadata?.httpStatusCode
  if (httpStatusCode === 429) {
    return true
  }

  const errorMessage = awsError.message?.toLowerCase() || ''
  if (
    errorMessage.includes('throttl') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('provisioned throughput exceeded')
  ) {
    return true
  }

  return false
}

export const getRetryDelay = (
  error: unknown,
  attempt: number,
  baseDelayMs: number = 100,
  maxDelayMs: number = 30000,
): number => {
  if (isThrottlingError(error)) {
    const throttlingDelay = Math.min(
      baseDelayMs * Math.pow(2, attempt) * 2,
      maxDelayMs,
    )
    logger.debug('throttling_retry_delay', {
      attempt,
      delay_ms: throttlingDelay,
    })
    return throttlingDelay
  }

  const exponentialDelay = Math.min(
    baseDelayMs * Math.pow(2, attempt),
    maxDelayMs,
  )

  return exponentialDelay
}

export const classifyError = (error: unknown): {
  retryable: boolean
  throttling: boolean
  code?: string
  httpStatusCode?: number
} => {
  if (!error) {
    return { retryable: false, throttling: false }
  }

  const awsError = error as AWSRetryableError
  const retryable = isRetryableError(error)
  const throttling = isThrottlingError(error)

  return {
    retryable,
    throttling,
    code: awsError.code || awsError.name,
    httpStatusCode: awsError.$metadata?.httpStatusCode,
  }
}
