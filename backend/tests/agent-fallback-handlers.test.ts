import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: vi.fn(),
}))

vi.mock('../shared/agent-notifications', () => ({
  notifyAgent: vi.fn(() => Promise.resolve()),
}))

vi.mock('../shared/error-tracker', () => ({
  addBreadcrumb: vi.fn(),
}))

import { RepairFallbackHandler } from '../plane-b/src/handlers/repair-fallback'
import { StressResponseHandler } from '../plane-b/src/handlers/stress-response'

type MockPool = {
  query: ReturnType<typeof vi.fn>
}

const createPool = (rowsByCall: Array<{ rows?: unknown[] }> = []): MockPool => {
  let index = 0
  return {
    query: vi.fn(async () => rowsByCall[index++] ?? { rows: [] }),
  }
}

describe('agent fallback handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies stress responses for routed fetch failures', async () => {
    const pool = createPool([
      { rows: [] },
      { rows: [{ module_id: 'module-wise-http', policy: {} }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    const handler = new StressResponseHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-1',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {
        bundleId: 'bundle-1',
        category: 'network',
        severity: 'persistent',
        fetcherSource: 'http',
        failureLayer: 'fetch',
        providerId: 'wise',
        route: 'US-MX-USD-MXN',
        consecutiveFailures: 7,
      },
    })

    expect(result.success).toBe(true)
    expect(result.metadata).toMatchObject({
      bundleId: 'bundle-1',
      route: 'US-MX-USD-MXN',
      overridesApplied: 1,
      stressLevel: 'high',
    })
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE silver.failure_bundle'),
      ['bundle-1', 'applied'],
    )
  })

  it('degrades stress responses to manual investigation when corridor routing is unavailable', async () => {
    const pool = createPool([
      { rows: [] },
      { rows: [] },
    ])

    const handler = new StressResponseHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-2',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {
        bundleId: 'bundle-2',
        category: 'timeout',
        severity: 'critical',
        providerId: 'wise',
        route: 'unknown',
      },
    })

    expect(result.success).toBe(true)
    expect(result.metadata).toMatchObject({
      action: 'manual_investigation',
      reason: 'missing_corridor_route',
      bundleId: 'bundle-2',
    })
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE silver.failure_bundle'),
      ['bundle-2', 'failed'],
    )
  })

  it('records manual investigation actions for unimplemented repair flows', async () => {
    const pool = createPool([
      { rows: [] },
      { rows: [] },
    ])

    const handler = new RepairFallbackHandler()
    const result = await handler.execute({
      pool,
      jobRunId: 'job-3',
      moduleId: 'module-wise-http',
      corridors: [],
      amountBuckets: [],
      params: {
        bundleId: 'bundle-3',
        category: 'auth',
        severity: 'persistent',
        providerId: 'wise',
        route: 'US-MX-USD-MXN',
      },
    })

    expect(result.success).toBe(true)
    expect(result.metadata).toMatchObject({
      escalation: 'manual_investigation',
      bundleId: 'bundle-3',
      category: 'auth',
    })
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE silver.failure_bundle'),
      ['bundle-3'],
    )
  })
})
