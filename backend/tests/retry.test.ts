import { describe, it, expect, vi } from 'vitest'
import { retry } from '../shared/retry'

/**
 * Helper: create an AWS-style retryable error (5xx HTTP status code).
 * The default retryable predicate in retry.ts delegates to isRetryableError
 * from aws-errors.ts, which only retries transient/AWS errors.
 */
const makeAwsRetryableError = (message: string): Error & { $metadata?: { httpStatusCode: number } } => {
  const err = new Error(message) as Error & { $metadata?: { httpStatusCode: number } }
  err.$metadata = { httpStatusCode: 503 }
  return err
}

describe('retry', () => {
  it('returns result on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await retry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on AWS-retryable failure and succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeAwsRetryableError('service_unavailable'))
      .mockResolvedValue('success')

    const result = await retry(fn, { maxRetries: 2, initialDelayMs: 10 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('exhausts retries and throws last error for AWS-retryable errors', async () => {
    const error = makeAwsRetryableError('persistent error')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      retry(fn, { maxRetries: 2, initialDelayMs: 10 }),
    ).rejects.toThrow('persistent error')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('uses custom maxRetries', async () => {
    const error = makeAwsRetryableError('error')
    const fn = vi.fn().mockRejectedValue(error)

    await expect(
      retry(fn, { maxRetries: 1, initialDelayMs: 10 }),
    ).rejects.toThrow('error')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('applies exponential backoff', async () => {
    const startTime = Date.now()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeAwsRetryableError('fail1'))
      .mockRejectedValueOnce(makeAwsRetryableError('fail2'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 2,
      initialDelayMs: 50,
      backoffMultiplier: 2,
      jitter: false,
    })

    const elapsed = Date.now() - startTime
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
    expect(elapsed).toBeGreaterThanOrEqual(50 + 100)
  })

  it('caps delay at maxDelayMs', async () => {
    const startTime = Date.now()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeAwsRetryableError('fail1'))
      .mockRejectedValueOnce(makeAwsRetryableError('fail2'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 2,
      initialDelayMs: 100,
      maxDelayMs: 150,
      backoffMultiplier: 2,
      jitter: false,
    })

    const elapsed = Date.now() - startTime
    expect(result).toBe('success')
    expect(elapsed).toBeLessThan(500)
  })

  it('applies jitter when enabled', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeAwsRetryableError('fail'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 1,
      initialDelayMs: 50,
      jitter: true,
    })

    expect(result).toBe('success')
  })

  it('skips retry when retryable returns false', async () => {
    const error = new Error('non-retryable')
    const fn = vi.fn().mockRejectedValue(error)

    const retryable = vi.fn().mockReturnValue(false)

    await expect(
      retry(fn, {
        maxRetries: 2,
        initialDelayMs: 10,
        retryable,
      }),
    ).rejects.toThrow('non-retryable')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(retryable).toHaveBeenCalledWith(error)
  })

  it('retries when retryable returns true', async () => {
    const error = new Error('retryable')
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success')

    const retryable = vi.fn().mockReturnValue(true)

    const result = await retry(fn, {
      maxRetries: 1,
      initialDelayMs: 10,
      retryable,
    })

    expect(result).toBe('success')
    expect(retryable).toHaveBeenCalledWith(error)
  })

  it('uses default options when none provided', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await retry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('handles retryable function that throws', async () => {
    const error = new Error('error')
    const fn = vi.fn().mockRejectedValue(error)

    const retryable = vi.fn().mockImplementation(() => {
      throw new Error('retryable error')
    })

    await expect(
      retry(fn, {
        maxRetries: 1,
        initialDelayMs: 10,
        retryable,
      }),
    ).rejects.toThrow('error')
  })

  it('handles multiple sequential failures with backoff for AWS-retryable errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeAwsRetryableError('fail1'))
      .mockRejectedValueOnce(makeAwsRetryableError('fail2'))
      .mockRejectedValueOnce(makeAwsRetryableError('fail3'))
      .mockResolvedValue('success')

    const result = await retry(fn, {
      maxRetries: 3,
      initialDelayMs: 20,
      backoffMultiplier: 2,
      jitter: false,
    })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(4)
  })

  // --- Default predicate narrowing tests ---
  // These tests verify the fix: the default retryable predicate must NOT retry
  // generic Error instances (which would include permanent failures like
  // validation errors, auth errors, not-found errors, etc.).

  it('default predicate does NOT retry a plain new Error (permanent failure)', async () => {
    // A plain Error with no AWS metadata should not be retried by the default predicate.
    // Previously, `|| error instanceof Error` caused ALL errors to be retried.
    const permanentError = new Error('not_found: resource does not exist')
    const fn = vi.fn().mockRejectedValue(permanentError)

    await expect(
      retry(fn, { maxRetries: 3, initialDelayMs: 10 }),
    ).rejects.toThrow('not_found: resource does not exist')

    // Must only be called once — no retries for permanent errors.
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('default predicate does NOT retry a validation error (permanent failure)', async () => {
    const validationError = new Error('validation_error: amount must be positive')
    const fn = vi.fn().mockRejectedValue(validationError)

    await expect(
      retry(fn, { maxRetries: 3, initialDelayMs: 10 }),
    ).rejects.toThrow('validation_error')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('default predicate retries AWS throttling errors (transient, 429)', async () => {
    const throttlingError = new Error('ThrottlingException') as Error & { code?: string }
    throttlingError.code = 'ThrottlingException'
    const fn = vi
      .fn()
      .mockRejectedValueOnce(throttlingError)
      .mockResolvedValue('success')

    const result = await retry(fn, { maxRetries: 2, initialDelayMs: 10 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('default predicate retries AWS 503 ServiceUnavailable errors (transient)', async () => {
    const serviceError = makeAwsRetryableError('ServiceUnavailable')
    const fn = vi
      .fn()
      .mockRejectedValueOnce(serviceError)
      .mockResolvedValue('success')

    const result = await retry(fn, { maxRetries: 2, initialDelayMs: 10 })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('default predicate does NOT retry AWS 400 client errors (permanent)', async () => {
    const clientError = new Error('BadRequest') as Error & { $metadata?: { httpStatusCode: number } }
    clientError.$metadata = { httpStatusCode: 400 }
    const fn = vi.fn().mockRejectedValue(clientError)

    await expect(
      retry(fn, { maxRetries: 3, initialDelayMs: 10 }),
    ).rejects.toThrow('BadRequest')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('default predicate does NOT retry AWS 403 Forbidden errors (permanent)', async () => {
    const forbiddenError = new Error('AccessDeniedException') as Error & { code?: string }
    forbiddenError.code = 'AccessDeniedException'
    const fn = vi.fn().mockRejectedValue(forbiddenError)

    await expect(
      retry(fn, { maxRetries: 3, initialDelayMs: 10 }),
    ).rejects.toThrow('AccessDeniedException')

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
