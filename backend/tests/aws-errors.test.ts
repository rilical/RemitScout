import { describe, it, expect, vi } from 'vitest'
import {
  isRetryableError,
  isThrottlingError,
  getRetryDelay,
  classifyError,
} from '../shared/aws-errors'

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('aws-errors', () => {
  describe('isRetryableError', () => {
    it('identifies throttling errors as retryable', () => {
      const error = { code: 'Throttling', name: 'Throttling' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('identifies service unavailable errors as retryable', () => {
      const error = { code: 'ServiceUnavailable', name: 'ServiceUnavailable' }
      expect(isRetryableError(error)).toBe(true)
    })

    it('identifies 5xx HTTP errors as retryable', () => {
      const error = { $metadata: { httpStatusCode: 500 } }
      expect(isRetryableError(error)).toBe(true)
    })

    it('identifies 429 errors as retryable', () => {
      const error = { $metadata: { httpStatusCode: 429 } }
      expect(isRetryableError(error)).toBe(true)
    })

    it('identifies non-retryable errors', () => {
      const error = { code: 'InvalidMessage', name: 'InvalidMessage' }
      expect(isRetryableError(error)).toBe(false)
    })

    it('identifies 4xx errors (except 429) as non-retryable', () => {
      const error = { $metadata: { httpStatusCode: 400 } }
      expect(isRetryableError(error)).toBe(false)
    })

    it('handles errors with retryable messages', () => {
      const error = { message: 'Rate limit exceeded' }
      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('isThrottlingError', () => {
    it('identifies throttling errors', () => {
      const error = { code: 'Throttling', name: 'Throttling' }
      expect(isThrottlingError(error)).toBe(true)
    })

    it('identifies 429 HTTP errors as throttling', () => {
      const error = { $metadata: { httpStatusCode: 429 } }
      expect(isThrottlingError(error)).toBe(true)
    })

    it('identifies non-throttling errors', () => {
      const error = { code: 'ServiceUnavailable', name: 'ServiceUnavailable' }
      expect(isThrottlingError(error)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('returns higher delay for throttling errors', () => {
      const throttlingError = { code: 'Throttling' }
      const normalError = { code: 'ServiceUnavailable' }

      const throttlingDelay = getRetryDelay(throttlingError, 1, 100, 10000)
      const normalDelay = getRetryDelay(normalError, 1, 100, 10000)

      expect(throttlingDelay).toBeGreaterThan(normalDelay)
    })

    it('caps delay at maxDelayMs', () => {
      const error = { code: 'Throttling' }
      const delay = getRetryDelay(error, 10, 100, 1000)
      expect(delay).toBeLessThanOrEqual(1000)
    })
  })

  describe('classifyError', () => {
    it('classifies retryable throttling error', () => {
      const error = { code: 'Throttling', $metadata: { httpStatusCode: 429 } }
      const classification = classifyError(error)

      expect(classification.retryable).toBe(true)
      expect(classification.throttling).toBe(true)
      expect(classification.code).toBe('Throttling')
      expect(classification.httpStatusCode).toBe(429)
    })

    it('classifies non-retryable error', () => {
      const error = { code: 'InvalidMessage' }
      const classification = classifyError(error)

      expect(classification.retryable).toBe(false)
      expect(classification.throttling).toBe(false)
    })
  })
})

