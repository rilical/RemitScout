import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool } from 'pg'

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that trigger the modules.
// ---------------------------------------------------------------------------

vi.mock('../shared/config', () => ({
  config: {
    envName: 'test',
    env: 'test',
    observability: { cloudwatch: { enabled: false, highCardinalityEnabled: false } },
    agent: {
      llmConnector: 'anthropic',
      llmModel: 'claude-sonnet-4-20250514',
      llmMaxTokens: 2048,
      llmTemperature: 0.2,
      anthropicApiKey: 'test-key', // pragma: allowlist secret
      bedrockRegion: '',
      bedrockModelId: '',
      llmPromptVersion: '1',
      pollIntervalMs: 5000,
      maxConcurrentJobs: 4,
      jobTimeoutMs: 60_000,
    },
  },
}))
vi.mock('../shared/cloudwatch-metrics', () => ({ recordCloudWatchMetric: vi.fn() }))
vi.mock('../shared/ops-events', () => ({ emitOpsEvent: vi.fn() }))
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))
vi.mock('../shared/error-tracker', () => ({
  captureExceptionWithContext: vi.fn(),
  addBreadcrumb: vi.fn(),
}))
vi.mock('../shared/agent-notifications', () => ({
  notifyAgent: vi.fn(),
}))
vi.mock('../shared/provider-catalog', () => ({
  listProviders: () => ['wise', 'remitly', 'westernunion'],
}))

// Mock the agent-config so we control the enabled flag and intervals.
vi.mock('../plane-b/src/agents/agent-config', () => ({
  resolveAgentConfig: (_name: string) => ({
    enabled: true,
    pollIntervalMs: 5_000,
    maxConcurrentJobs: 4,
    jobTimeoutMs: 60_000,
  }),
}))

// Mock the FailureDetector — we inject bundles directly via the mock.
const mockDetectFailures = vi.fn()
vi.mock('../plane-b/src/agents/failure-detector', () => ({
  FailureDetector: vi.fn().mockImplementation(() => ({
    detectFailures: mockDetectFailures,
  })),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { AgentOrchestrator } from '../plane-b/src/agents/orchestrator'
import { recordCloudWatchMetric } from '../shared/cloudwatch-metrics'
import type { FailureBundle } from '../shared/types/failure-bundle'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeBundle = (overrides: Partial<FailureBundle> = {}): FailureBundle => ({
  bundleId: `bundle-${Math.random().toString(36).slice(2)}`,
  moduleId: 'module-wise-http',
  providerId: 'wise',
  collectorType: 'http',
  severity: 'degraded',
  category: 'parse',
  consecutiveFailures: 6,
  firstFailureAt: new Date().toISOString(),
  lastFailureAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  errorMessage: 'TypeError: Cannot read property',
  errorType: 'TypeError',
  httpStatuses: [200],
  affectedCorridors: ['US-MX-USD-MXN'],
  domSignatureHash: null,
  previousDomSignatureHash: null,
  observationIds: ['obs-1'],
  qualityFlags: [],
  repairAttempted: false,
  repairOutcome: null,
  repairPrUrl: null,
  fetcherSource: 'http',
  failureLayer: 'parse',
  ...overrides,
})

/**
 * Build a mock Pool that records all SQL queries made.
 *
 * The advisory lock query is always made to return `acquired: true` by default
 * so the cycle is not skipped unless a test explicitly overrides it.
 */
const makeMockPool = (overrides: {
  lockAcquired?: boolean
} = {}): Pool & {
  queryCalls: Array<{ text: string; values: unknown[] }>
  clientRelease: ReturnType<typeof vi.fn>
} => {
  const queryCalls: Array<{ text: string; values: unknown[] }> = []

  const executeQuery = vi.fn().mockImplementation(async (text: string, values?: unknown[]) => {
    queryCalls.push({ text, values: values ?? [] })

    // Advisory lock — pg_try_advisory_xact_lock
    if (text.includes('pg_try_advisory_xact_lock')) {
      return { rows: [{ acquired: overrides.lockAcquired ?? true }] }
    }

    // dispatch_queue poll — return no items so the process loop stays idle.
    if (text.includes('dispatch_queue')) {
      return { rows: [] }
    }

    return { rows: [] }
  })

  const clientRelease = vi.fn()
  const poolQuery = vi.fn().mockImplementation((text: string, values?: unknown[]) =>
    executeQuery(text, values),
  )
  const connect = vi.fn().mockResolvedValue({
    query: executeQuery,
    release: clientRelease,
  })

  return {
    query: poolQuery,
    connect,
    queryCalls,
    clientRelease,
  } as unknown as Pool & {
    queryCalls: typeof queryCalls
    clientRelease: typeof clientRelease
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AgentOrchestrator — blast radius controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. MAX_BUNDLES_PER_CYCLE cap
  // -------------------------------------------------------------------------

  describe('MAX_BUNDLES_PER_CYCLE = 6', () => {
    it('routes all bundles when count is <= 6', async () => {
      const bundles = Array.from({ length: 5 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)

      // runFailureDetection is private — access via the detection-cycle mechanism.
      // We trigger one cycle by calling start() with an AbortSignal that fires immediately
      // after the first detection cycle completes.
      const ac = new AbortController()

      // Spy on enqueueDispatch to count routed bundles.
      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      orchestrator.configureDetectionCycle({ intervalMs: 60_000 })

      const startPromise = orchestrator.start(ac.signal)
      // Allow the first detection cycle to run.
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      // Allow async operations to flush before asserting.
      await new Promise((r) => setTimeout(r, 0))

      ac.abort()
      await startPromise

      expect(enqueueSpy).toHaveBeenCalledTimes(5)
    })

    it('caps at 6 bundles when 8 are detected', async () => {
      const bundles = Array.from({ length: 8 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      // Only 6 should have been dispatched.
      expect(enqueueSpy).toHaveBeenCalledTimes(6)
    })

    it('caps at 6 bundles when exactly 7 are detected', async () => {
      const bundles = Array.from({ length: 7 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      expect(enqueueSpy).toHaveBeenCalledTimes(6)
    })

    it('routes the highest-severity bundles first when capped', async () => {
      // Mix of severities — only the top 6 by severity should be dispatched.
      const bundles = [
        makeBundle({ severity: 'transient', moduleId: 'mod-low' }),
        makeBundle({ severity: 'critical', moduleId: 'mod-critical-1' }),
        makeBundle({ severity: 'persistent', moduleId: 'mod-persistent-1' }),
        makeBundle({ severity: 'degraded', moduleId: 'mod-degraded-1' }),
        makeBundle({ severity: 'critical', moduleId: 'mod-critical-2' }),
        makeBundle({ severity: 'persistent', moduleId: 'mod-persistent-2' }),
        makeBundle({ severity: 'degraded', moduleId: 'mod-degraded-2' }),
      ]
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const routedModuleIds: string[] = []
      vi.spyOn(orchestrator, 'enqueueDispatch').mockImplementation(async (_queue, moduleId) => {
        routedModuleIds.push(moduleId ?? '')
        return 'dispatch-id'
      })

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      // 6 bundles should be dispatched — the 'transient' one should be dropped.
      expect(routedModuleIds).toHaveLength(6)
      expect(routedModuleIds).not.toContain('mod-low')
    })

    it('emits failure_bundles_deferred metric when bundles are dropped', async () => {
      const bundles = Array.from({ length: 8 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      const metricCalls = vi.mocked(recordCloudWatchMetric).mock.calls
      const deferredMetric = metricCalls.find(([m]) => m.name === 'failure_bundles_deferred')
      expect(deferredMetric).toBeDefined()
      expect(deferredMetric![0].value).toBe(2) // 8 - 6 = 2 deferred
    })
  })

  // -------------------------------------------------------------------------
  // 2. Correlated failure detection (>= 10 bundles)
  // -------------------------------------------------------------------------

  describe('correlated failure detection', () => {
    it('skips repair dispatch and emits escalation metric when >= 10 bundles detected', async () => {
      const bundles = Array.from({ length: 12 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      // No individual repairs should be dispatched.
      expect(enqueueSpy).not.toHaveBeenCalled()

      // Escalation metric should be emitted.
      const metricCalls = vi.mocked(recordCloudWatchMetric).mock.calls
      const escalationMetric = metricCalls.find(([m]) => m.name === 'correlated_failure_escalation')
      expect(escalationMetric).toBeDefined()
      expect(escalationMetric![0].value).toBe(12)
    })

    it('skips escalation and repairs normally when exactly 9 bundles detected', async () => {
      const bundles = Array.from({ length: 9 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      // 9 < 10, so individual repair is attempted (capped at 6).
      expect(enqueueSpy).toHaveBeenCalledTimes(6)

      // No escalation metric.
      const metricCalls = vi.mocked(recordCloudWatchMetric).mock.calls
      const escalationMetric = metricCalls.find(([m]) => m.name === 'correlated_failure_escalation')
      expect(escalationMetric).toBeUndefined()
    })

    it('triggers escalation at exactly the threshold (10 bundles)', async () => {
      const bundles = Array.from({ length: 10 }, () => makeBundle())
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool()
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      expect(enqueueSpy).not.toHaveBeenCalled()

      const metricCalls = vi.mocked(recordCloudWatchMetric).mock.calls
      const escalationMetric = metricCalls.find(([m]) => m.name === 'correlated_failure_escalation')
      expect(escalationMetric).toBeDefined()
      expect(escalationMetric![0].value).toBe(10)
    })
  })

  // -------------------------------------------------------------------------
  // 3. Advisory lock prevents duplicate detection cycles
  // -------------------------------------------------------------------------

  describe('advisory lock', () => {
    it('skips the detection cycle when the lock is not acquired', async () => {
      mockDetectFailures.mockResolvedValueOnce([makeBundle()])

      // Pool returns acquired: false — another instance holds the lock.
      const pool = makeMockPool({ lockAcquired: false })
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const enqueueSpy = vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)

      // Wait long enough for the detection cycle attempt to have been made.
      await new Promise((r) => setTimeout(r, 50))
      ac.abort()
      await startPromise

      // detectFailures should never have been called because the lock was not acquired.
      expect(mockDetectFailures).not.toHaveBeenCalled()
      expect(enqueueSpy).not.toHaveBeenCalled()
    })

    it('runs the detection cycle when the lock is acquired', async () => {
      const bundles = [makeBundle()]
      mockDetectFailures.mockResolvedValueOnce(bundles)

      const pool = makeMockPool({ lockAcquired: true })
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      vi.spyOn(orchestrator, 'enqueueDispatch').mockResolvedValue('dispatch-id')

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      expect(mockDetectFailures).toHaveBeenCalledOnce()
    })

    it('always releases the advisory lock even when detectFailures throws', async () => {
      mockDetectFailures.mockRejectedValueOnce(new Error('DB error'))

      const pool = makeMockPool({ lockAcquired: true })
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const startPromise = orchestrator.start(ac.signal)
      await vi.waitFor(() => expect(mockDetectFailures).toHaveBeenCalledOnce())
      await new Promise((r) => setTimeout(r, 0))
      ac.abort()
      await startPromise

      // Transaction-scoped lock should always release the client even on errors.
      expect(pool.clientRelease).toHaveBeenCalledTimes(1)
    })

    it('uses the correct advisory lock key (999001)', async () => {
      mockDetectFailures.mockResolvedValueOnce([])

      const pool = makeMockPool({ lockAcquired: true })
      const orchestrator = new AgentOrchestrator(pool)
      const ac = new AbortController()

      const startPromise = orchestrator.start(ac.signal)
      await new Promise((r) => setTimeout(r, 50))
      ac.abort()
      await startPromise

      const lockCalls = pool.queryCalls.filter((q) =>
        q.text.includes('pg_try_advisory_xact_lock'),
      )
      expect(lockCalls.length).toBeGreaterThanOrEqual(1)
      expect(lockCalls[0].values[0]).toBe(999001)
    })
  })
})
