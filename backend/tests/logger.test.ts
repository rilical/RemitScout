import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger } from '../shared/logger'

describe('logger', () => {
  const originalEnv = process.env
  const originalLogLevel = process.env.LOG_LEVEL
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    process.env.LOG_LEVEL = originalLogLevel
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('createLogger', () => {
    it('creates logger with component name', () => {
      const logger = createLogger('test.component')
      expect(logger).toHaveProperty('debug')
      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('error')
    })

    it('uses provided trace ID', () => {
      const traceId = 'custom-trace-id'
      const logger = createLogger('test.component', traceId)
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event', { data: 'value' })

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.trace_id).toBe(traceId)

      consoleLogSpy.mockRestore()
    })

    it('generates trace ID when not provided', () => {
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event')

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.trace_id).toBeDefined()
      expect(typeof logCall.trace_id).toBe('string')
      expect(logCall.trace_id.length).toBeGreaterThan(0)

      consoleLogSpy.mockRestore()
    })
  })

  describe('log levels', () => {
    it('logs info messages', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event', { key: 'value' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.level).toBe('info')
      expect(logCall.event).toBe('test_event')
      expect(logCall.key).toBe('value')

      consoleLogSpy.mockRestore()
    })

    it('logs error messages to console.error', () => {
      process.env.LOG_LEVEL = 'error'
      const logger = createLogger('test.component')
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      logger.error('test_error', { error: new Error('test') })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logCall = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string)
      expect(logCall.level).toBe('error')
      expect(logCall.event).toBe('test_error')

      consoleErrorSpy.mockRestore()
    })

    it('logs warn messages to console.warn', () => {
      process.env.LOG_LEVEL = 'warn'
      const logger = createLogger('test.component')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logger.warn('test_warning')

      expect(consoleWarnSpy).toHaveBeenCalled()
      const logCall = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string)
      expect(logCall.level).toBe('warn')

      consoleWarnSpy.mockRestore()
    })

    it('logs debug messages when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.debug('test_debug')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.level).toBe('debug')

      consoleLogSpy.mockRestore()
    })

    it('filters out debug messages when LOG_LEVEL is info', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.debug('test_debug')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('filters out info messages when LOG_LEVEL is warn', () => {
      process.env.LOG_LEVEL = 'warn'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_info')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })
  })

  describe('context normalization', () => {
    it('serializes Error objects in context', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const error = new Error('test error')

      logger.info('test_event', { error })

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.error).toEqual({
        name: 'Error',
        message: 'test error',
        stack: expect.any(String),
      })

      consoleLogSpy.mockRestore()
    })

    it('handles non-Error values in error field', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event', { error: 'string error' })

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.error).toEqual({ message: 'string error' })

      consoleLogSpy.mockRestore()
    })

    it('includes all context fields', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event', {
        userId: '123',
        action: 'test',
        count: 42,
      })

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.userId).toBe('123')
      expect(logCall.action).toBe('test')
      expect(logCall.count).toBe(42)

      consoleLogSpy.mockRestore()
    })

    it('handles undefined context', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.event).toBe('test_event')
      expect(logCall.component).toBe('test.component')

      consoleLogSpy.mockRestore()
    })
  })

  describe('log level resolution', () => {
    it('defaults to debug in non-production', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.LOG_LEVEL
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.debug('test_debug')

      expect(consoleLogSpy).toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('defaults to info in production', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.LOG_LEVEL
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.debug('test_debug')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('normalizes log level case', () => {
      process.env.LOG_LEVEL = 'DEBUG'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.debug('test_debug')

      expect(consoleLogSpy).toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('defaults to info for invalid log level', () => {
      process.env.LOG_LEVEL = 'invalid'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.debug('test_debug')

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })
  })

  describe('log structure', () => {
    it('includes required fields', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event')

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall).toHaveProperty('level')
      expect(logCall).toHaveProperty('time')
      expect(logCall).toHaveProperty('component')
      expect(logCall).toHaveProperty('event')
      expect(logCall).toHaveProperty('trace_id')

      consoleLogSpy.mockRestore()
    })

    it('includes ISO timestamp', () => {
      process.env.LOG_LEVEL = 'info'
      const logger = createLogger('test.component')
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.info('test_event')

      const logCall = JSON.parse(consoleLogSpy.mock.calls[0][0] as string)
      expect(logCall.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      consoleLogSpy.mockRestore()
    })
  })
})



