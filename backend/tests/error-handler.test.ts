import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleError, handleErrorWithBreadcrumb, wrapAsync } from '../shared/error-handler'
import * as errorTracker from '../shared/error-tracker'

vi.mock('../shared/error-tracker', () => ({
  captureExceptionWithContext: vi.fn(),
  addBreadcrumb: vi.fn(),
}))

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('logs error and captures exception', () => {
      const error = new Error('Test error')
      const context = { userId: '123', action: 'test' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      handleError(error, context)

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalledWith(
        error,
        context,
        { service: 'remit-scout' },
      )

      consoleErrorSpy.mockRestore()
    })

    it('uses custom service name when provided', () => {
      const error = new Error('Test error')
      const context = { userId: '123' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      handleError(error, context, 'custom-service')

      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalledWith(
        error,
        context,
        { service: 'custom-service' },
      )

      consoleErrorSpy.mockRestore()
    })

    it('handles Sentry capture failures gracefully', () => {
      const error = new Error('Test error')
      const context = { userId: '123' }
      vi.mocked(errorTracker.captureExceptionWithContext).mockImplementation(() => {
        throw new Error('Sentry failed')
      })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => handleError(error, context)).not.toThrow()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('handleErrorWithBreadcrumb', () => {
    it('adds breadcrumb before handling error', () => {
      const error = new Error('Test error')
      const context = { userId: '123' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      handleErrorWithBreadcrumb(
        error,
        context,
        'Test breadcrumb',
        'test-category',
      )

      expect(errorTracker.addBreadcrumb).toHaveBeenCalledWith(
        'Test breadcrumb',
        'test-category',
        'error',
      )
      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('handles breadcrumb failures gracefully', () => {
      const error = new Error('Test error')
      const context = { userId: '123' }
      vi.mocked(errorTracker.addBreadcrumb).mockImplementation(() => {
        throw new Error('Breadcrumb failed')
      })
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() =>
        handleErrorWithBreadcrumb(error, context, 'Test', 'test'),
      ).not.toThrow()
      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('uses custom service name when provided', () => {
      const error = new Error('Test error')
      const context = { userId: '123' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      handleErrorWithBreadcrumb(
        error,
        context,
        'Test breadcrumb',
        'test-category',
        'custom-service',
      )

      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalledWith(
        error,
        context,
        { service: 'custom-service' },
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('wrapAsync', () => {
    it('returns successful result', async () => {
      const fn = async () => 'success'
      const context = { action: 'test' }

      const result = await wrapAsync(fn, context)

      expect(result).toBe('success')
      expect(errorTracker.captureExceptionWithContext).not.toHaveBeenCalled()
    })

    it('handles Error instances', async () => {
      const error = new Error('Test error')
      const fn = async () => {
        throw error
      }
      const context = { action: 'test' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(wrapAsync(fn, context)).rejects.toThrow('Test error')
      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalledWith(
        error,
        context,
        { service: 'remit-scout' },
      )

      consoleErrorSpy.mockRestore()
    })

    it('converts non-Error to Error', async () => {
      const fn = async () => {
        throw 'string error'
      }
      const context = { action: 'test' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(wrapAsync(fn, context)).rejects.toBe('string error')
      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalled()
      const call = vi.mocked(errorTracker.captureExceptionWithContext).mock.calls[0]
      expect(call[0]).toBeInstanceOf(Error)
      expect(call[0].message).toBe('string error')

      consoleErrorSpy.mockRestore()
    })

    it('uses custom service name when provided', async () => {
      const error = new Error('Test error')
      const fn = async () => {
        throw error
      }
      const context = { action: 'test' }
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(wrapAsync(fn, context, 'custom-service')).rejects.toThrow()
      expect(errorTracker.captureExceptionWithContext).toHaveBeenCalledWith(
        error,
        context,
        { service: 'custom-service' },
      )

      consoleErrorSpy.mockRestore()
    })
  })
})


