import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createShutdownHandler, isShutdownRequested, resetShutdownState } from '../shared/shutdown'

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('shutdown', () => {
  const originalExit = process.exit
  const originalOn = process.on
  const originalListeners = process.listeners

  beforeEach(() => {
    vi.clearAllMocks()
    process.exit = vi.fn() as any
    process.on = vi.fn() as any
    process.listeners = vi.fn(() => []) as any
    resetShutdownState()
  })

  afterEach(() => {
    process.exit = originalExit
    process.on = originalOn
    process.listeners = originalListeners
  })

  describe('isShutdownRequested', () => {
    it('returns false initially', () => {
      expect(isShutdownRequested()).toBe(false)
    })
  })

  describe('createShutdownHandler', () => {
    it('registers SIGTERM and SIGINT handlers', () => {
      const handler = createShutdownHandler()

      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    })

    it('calls onShutdown callback', async () => {
      const onShutdown = vi.fn().mockResolvedValue(undefined)
      const handler = createShutdownHandler({ onShutdown })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        await sigtermHandler('SIGTERM')
      }

      expect(onShutdown).toHaveBeenCalled()
    })

    it('exits with code 0 after successful shutdown', async () => {
      const onShutdown = vi.fn().mockResolvedValue(undefined)
      const handler = createShutdownHandler({ onShutdown })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        await sigtermHandler('SIGTERM')
      }

      expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('exits with code 1 on shutdown error', async () => {
      const error = new Error('Shutdown failed')
      const onShutdown = vi.fn().mockRejectedValue(error)
      const handler = createShutdownHandler({ onShutdown })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        await sigtermHandler('SIGTERM')
      }

      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('uses custom timeout', async () => {
      vi.useFakeTimers()
      const onShutdown = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50000)),
      )
      const handler = createShutdownHandler({ timeoutMs: 1000, onShutdown })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        sigtermHandler('SIGTERM')
        await vi.advanceTimersByTimeAsync(1000)
      }

      expect(process.exit).toHaveBeenCalledWith(1)
      vi.useRealTimers()
    })

    it('prevents multiple shutdown calls', async () => {
      const onShutdown = vi.fn().mockResolvedValue(undefined)
      const handler = createShutdownHandler({ onShutdown })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        await sigtermHandler('SIGTERM')
        await sigtermHandler('SIGTERM')
      }

      expect(onShutdown).toHaveBeenCalledTimes(1)
    })

    it('returns shutdown function', () => {
      const handler = createShutdownHandler()

      expect(handler).toHaveProperty('shutdown')
      expect(typeof handler.shutdown).toBe('function')
    })

    it('returns isShutdownRequested function', () => {
      const handler = createShutdownHandler()

      expect(handler).toHaveProperty('isShutdownRequested')
      expect(typeof handler.isShutdownRequested).toBe('function')
    })

    it('uses custom logger when provided', async () => {
      const customLogger = {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      }
      const handler = createShutdownHandler({ logger: customLogger })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        await sigtermHandler('SIGTERM')
      }

      expect(customLogger.info).toHaveBeenCalled()
    })

    it('handles synchronous onShutdown', async () => {
      const onShutdown = vi.fn()
      const handler = createShutdownHandler({ onShutdown })

      const sigtermHandler = (process.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'SIGTERM',
      )?.[1]

      if (sigtermHandler) {
        await sigtermHandler('SIGTERM')
      }

      expect(onShutdown).toHaveBeenCalled()
      expect(process.exit).toHaveBeenCalledWith(0)
    })
  })
})



