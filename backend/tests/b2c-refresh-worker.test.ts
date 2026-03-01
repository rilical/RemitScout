import { beforeEach, describe, expect, it, vi } from 'vitest'

const processQuoteRefreshQueueMock = vi.fn(async () => 3)
const acquireLockMock = vi.fn(async () => true)
const releaseLockMock = vi.fn(async () => undefined)
const extendLockMock = vi.fn(async () => true)
const isShuttingDownMock = vi.fn(() => false)

vi.mock('../shared/config', () => ({
  config: {
    planeB: {
      b2cRefreshMaxRetries: 3,
    },
    workers: {
      b2cRefreshWorker: {
        limit: 50,
        concurrency: 5,
        lockMode: 'single',
        loopEnabled: false,
        loopDelayMs: 50,
        idleDelayMs: 100,
        loopJitterMs: 0,
        backpressureThreshold: 5,
        healthEnabled: false,
      },
      health: { port: 8080 },
    },
    queues: {
      quoteRefreshMode: 'off',
      quoteRefreshUrl: '',
    },
    redis: { url: '' },
    runtime: { isLambda: false },
    envName: 'test',
    env: 'test',
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/worker-jitter', () => ({
  applyJitter: async () => undefined,
}))

vi.mock('../shared/error-tracker', () => ({
  initErrorTracking: () => undefined,
}))

vi.mock('../shared/tracing', () => ({
  initTracing: () => undefined,
}))

vi.mock('../shared/health-server', () => ({
  startHealthServer: async () => ({ close: async () => undefined }),
}))

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: () => undefined,
}))

vi.mock('../shared/ops-events', () => ({
  emitOpsEvent: () => undefined,
}))

vi.mock('./b2c-refresh-worker-metrics', () => ({
  getMetrics: () => '',
  metricsContentType: 'text/plain',
  recordRequest: () => undefined,
  updateQueueDepth: () => undefined,
}))

vi.mock('../shared/shutdown', () => ({
  createShutdownHandler: () => {
    const controller = new AbortController()
    return {
      signal: controller.signal,
      isShuttingDown: isShuttingDownMock,
      shutdown: async () => undefined,
    }
  },
}))

vi.mock('../plane-b/src/quote-refresh', () => ({
  processQuoteRefreshQueue: processQuoteRefreshQueueMock,
}))

vi.mock('../plane-b/src/lib/worker-lock', () => ({
  WorkerLock: class WorkerLock {
    acquireLock = acquireLockMock
    extend = extendLockMock
    release = releaseLockMock
  },
}))

describe('b2c refresh worker', () => {
  beforeEach(() => {
    processQuoteRefreshQueueMock.mockClear()
    acquireLockMock.mockClear()
    releaseLockMock.mockClear()
    extendLockMock.mockClear()
    isShuttingDownMock.mockClear()
    isShuttingDownMock.mockReturnValue(false)
  })

  it('passes an AbortSignal to queue processing and releases lock after run', async () => {
    const { runB2cRefreshWorker } = await import('../scripts/b2c-refresh-worker')

    const processed = await runB2cRefreshWorker()
    expect(processed).toBe(3)

    expect(acquireLockMock).toHaveBeenCalledTimes(1)
    expect(processQuoteRefreshQueueMock).toHaveBeenCalledTimes(1)
    expect(releaseLockMock).toHaveBeenCalledTimes(1)

    const args = processQuoteRefreshQueueMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(args.limit).toBe(50)
    expect(args.maxRetries).toBe(3)
    expect(args.concurrency).toBe(5)
    expect(args.signal).toBeInstanceOf(AbortSignal)
  })
})
