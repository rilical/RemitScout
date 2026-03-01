import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * StressResponder unit tests — validates stress signal processing,
 * cadence overrides, cooldown logic, escalation tracking, and de-escalation.
 */

// Mock shared dependencies
vi.mock('../../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../../shared/cloudwatch-metrics', () => ({
  recordCloudWatchMetric: vi.fn(),
}))

vi.mock('../../shared/agent-notifications', () => ({
  notifyAgent: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../shared/error-tracker', () => ({
  addBreadcrumb: vi.fn(),
}))

import { StressResponder, type CorridorStressSignal } from '../plane-b/src/agents/stress-responder'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockQueryResult<T = Record<string, unknown>> = { rows: T[] }

/**
 * Create a mock Pool. Returns query results in order (sequential pops).
 */
function createMockPool(queryResults: MockQueryResult[] = []) {
  let callIndex = 0
  return {
    query: vi.fn(async () => {
      if (callIndex >= queryResults.length) {
        return { rows: [] }
      }
      return queryResults[callIndex++]
    }),
  } as unknown as import('pg').Pool
}

/**
 * Build a stress signal for testing.
 */
function makeSignal(overrides: Partial<CorridorStressSignal> = {}): CorridorStressSignal {
  return {
    corridorId: overrides.corridorId ?? 'US-MX-USD-MXN',
    stressScore: overrides.stressScore ?? 0.7,
    stressLevel: overrides.stressLevel ?? 'high',
    triggerFactors: overrides.triggerFactors ?? ['teer_spike', 'rvi_increase'],
    detectedAt: overrides.detectedAt ?? '2026-03-01T10:00:00Z',
  }
}

describe('StressResponder', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // computeStressLevel
  // -------------------------------------------------------------------------

  describe('computeStressLevel()', () => {
    it('returns "calm" for score below 0.3', () => {
      const pool = createMockPool()
      const responder = new StressResponder(pool)
      expect(responder.computeStressLevel(0.0)).toBe('calm')
      expect(responder.computeStressLevel(0.1)).toBe('calm')
      expect(responder.computeStressLevel(0.29)).toBe('calm')
    })

    it('returns "elevated" for score 0.3 to 0.59', () => {
      const pool = createMockPool()
      const responder = new StressResponder(pool)
      expect(responder.computeStressLevel(0.3)).toBe('elevated')
      expect(responder.computeStressLevel(0.45)).toBe('elevated')
      expect(responder.computeStressLevel(0.59)).toBe('elevated')
    })

    it('returns "high" for score 0.6 to 0.79', () => {
      const pool = createMockPool()
      const responder = new StressResponder(pool)
      expect(responder.computeStressLevel(0.6)).toBe('high')
      expect(responder.computeStressLevel(0.7)).toBe('high')
      expect(responder.computeStressLevel(0.79)).toBe('high')
    })

    it('returns "critical" for score 0.8 and above', () => {
      const pool = createMockPool()
      const responder = new StressResponder(pool)
      expect(responder.computeStressLevel(0.8)).toBe('critical')
      expect(responder.computeStressLevel(0.95)).toBe('critical')
      expect(responder.computeStressLevel(1.0)).toBe('critical')
    })
  })

  // -------------------------------------------------------------------------
  // Calm signal handling
  // -------------------------------------------------------------------------

  describe('calm signal handling', () => {
    it('clears overrides when stress level is calm', async () => {
      const pool = createMockPool([
        { rows: [] }, // clearOverrides UPDATE
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'calm', stressScore: 0.1 })

      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(0)
      // Verify the UPDATE query was called to expire overrides
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('expired'),
        [signal.corridorId],
      )
    })

    it('resets escalation tracking when stress subsides', async () => {
      const pool = createMockPool([
        // First: high signal to set up escalation tracking
        { rows: [{ module_id: 'mod-1', policy: {} }] }, // modules query
        { rows: [] }, // applyCadenceOverride INSERT
        { rows: [] }, // recordStressEvent INSERT
        // Second: calm signal to clear
        { rows: [] }, // clearOverrides UPDATE
      ])

      const responder = new StressResponder(pool)

      // First, process a high signal to create an escalation record
      await responder.processStressSignals([makeSignal({ stressLevel: 'high' })])
      expect(responder.getEscalationRecord('US-MX-USD-MXN')).not.toBeNull()

      // Then process a calm signal — should clear escalation
      await responder.processStressSignals([makeSignal({ stressLevel: 'calm', stressScore: 0.05 })])
      expect(responder.getEscalationRecord('US-MX-USD-MXN')).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Cadence overrides
  // -------------------------------------------------------------------------

  describe('cadence override creation', () => {
    it('creates cadence overrides for elevated stress signals', async () => {
      const pool = createMockPool([
        { rows: [{ module_id: 'mod-wise-1', policy: {} }] }, // modules query
        { rows: [] }, // applyCadenceOverride INSERT
        { rows: [] }, // recordStressEvent INSERT
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'elevated', stressScore: 0.4 })
      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(1)
      expect(overrides[0].moduleId).toBe('mod-wise-1')
      expect(overrides[0].corridorId).toBe('US-MX-USD-MXN')
      // Elevated: 0.75 multiplier -> 60000 * 0.75 = 45000ms
      expect(overrides[0].overrideIntervalMs).toBe(45_000)
      expect(overrides[0].originalIntervalMs).toBe(60_000)
    })

    it('creates faster overrides for high stress', async () => {
      const pool = createMockPool([
        { rows: [{ module_id: 'mod-wise-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'high', stressScore: 0.7 })
      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(1)
      // High: 0.5 multiplier -> 60000 * 0.5 = 30000ms
      expect(overrides[0].overrideIntervalMs).toBe(30_000)
    })

    it('creates fastest overrides for critical stress', async () => {
      const pool = createMockPool([
        { rows: [{ module_id: 'mod-wise-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'critical', stressScore: 0.9 })
      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(1)
      // Critical: 0.25 multiplier -> 60000 * 0.25 = 15000ms
      expect(overrides[0].overrideIntervalMs).toBe(15_000)
    })

    it('applies overrides to multiple modules covering the corridor', async () => {
      const pool = createMockPool([
        { rows: [
          { module_id: 'mod-wise-1', policy: {} },
          { module_id: 'mod-remitly-1', policy: {} },
        ]},
        { rows: [] }, // mod-wise-1 override
        { rows: [] }, // mod-remitly-1 override
        { rows: [] }, // recordStressEvent
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'high' })
      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(2)
      expect(overrides[0].moduleId).toBe('mod-wise-1')
      expect(overrides[1].moduleId).toBe('mod-remitly-1')
    })

    it('returns empty overrides when no modules cover the corridor', async () => {
      const pool = createMockPool([
        { rows: [] }, // no modules found
        { rows: [] }, // recordStressEvent
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'high' })
      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(0)
    })

    it('sets longer TTL for critical overrides (10 min vs 5 min)', async () => {
      const pool = createMockPool([
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'critical', stressScore: 0.9 })
      const overrides = await responder.processStressSignals([signal])

      // Critical TTL = 600,000ms (10 minutes)
      const expiresAt = new Date(overrides[0].expiresAt).getTime()
      const now = Date.now()
      const ttlMs = expiresAt - now
      expect(ttlMs).toBe(600_000)
    })

    it('sets standard TTL for non-critical overrides (5 min)', async () => {
      const pool = createMockPool([
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'elevated', stressScore: 0.4 })
      const overrides = await responder.processStressSignals([signal])

      const expiresAt = new Date(overrides[0].expiresAt).getTime()
      const now = Date.now()
      const ttlMs = expiresAt - now
      expect(ttlMs).toBe(300_000)
    })
  })

  // -------------------------------------------------------------------------
  // Cooldown logic
  // -------------------------------------------------------------------------

  describe('cooldown logic', () => {
    it('skips override when corridor was recently overridden (within 60s cooldown)', async () => {
      // First call: process normally
      const pool = createMockPool([
        // First signal — processes normally
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] }, // override
        { rows: [] }, // stress event
        // Second signal — should be in cooldown
        // No module query expected since cooldown skips
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'high' })

      await responder.processStressSignals([signal])

      // Advance 30s (within cooldown)
      vi.advanceTimersByTime(30_000)

      // Second call with same corridor and same level — should be skipped
      const overrides = await responder.processStressSignals([signal])

      expect(overrides).toHaveLength(0)
    })

    it('processes override after cooldown period expires', async () => {
      const pool = createMockPool([
        // First signal
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
        // Second signal (after cooldown)
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'high' })

      await responder.processStressSignals([signal])

      // Advance past cooldown (60s)
      vi.advanceTimersByTime(61_000)

      const overrides = await responder.processStressSignals([signal])
      expect(overrides).toHaveLength(1)
    })

    it('bypasses cooldown when stress level escalates', async () => {
      const pool = createMockPool([
        // First signal: elevated
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
        // Second signal: critical (escalation bypasses cooldown)
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)

      // First: elevated
      await responder.processStressSignals([
        makeSignal({ stressLevel: 'high', stressScore: 0.65 }),
      ])

      // Advance 10s (well within cooldown)
      vi.advanceTimersByTime(10_000)

      // Second: critical — should bypass cooldown
      const overrides = await responder.processStressSignals([
        makeSignal({ stressLevel: 'critical', stressScore: 0.9 }),
      ])

      expect(overrides).toHaveLength(1)
    })
  })

  // -------------------------------------------------------------------------
  // Escalation tracking
  // -------------------------------------------------------------------------

  describe('escalation tracking', () => {
    it('tracks consecutive high/critical signals for a corridor', async () => {
      const pool = createMockPool([
        // Signal 1 (high)
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      await responder.processStressSignals([
        makeSignal({ stressLevel: 'high', detectedAt: '2026-03-01T10:00:00Z' }),
      ])

      const record = responder.getEscalationRecord('US-MX-USD-MXN')
      expect(record).not.toBeNull()
      expect(record!.consecutiveHighCount).toBe(1)
      expect(record!.escalationLevel).toBe('watch')
    })

    it('escalates to "watch" after 3 consecutive high/critical signals', async () => {
      const pool = createMockPool([])
      const responder = new StressResponder(pool)

      // Send 3 high signals with enough time between them to avoid cooldown
      for (let i = 0; i < 3; i++) {
        // Reset mock pool for each call
        let callIdx = 0
        const results: MockQueryResult[] = [
          { rows: [{ module_id: 'mod-1', policy: {} }] },
          { rows: [] }, // override
          { rows: [] }, // stress event
        ]
        // For the 3rd signal: escalation threshold reached, so an additional INSERT for escalation obs
        if (i === 2) {
          results.push({ rows: [] }) // escalation observation INSERT
        }
        ;(pool.query as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          if (callIdx >= results.length) return { rows: [] }
          return results[callIdx++]
        })

        vi.advanceTimersByTime(61_000)
        await responder.processStressSignals([
          makeSignal({ stressLevel: 'high', detectedAt: `2026-03-01T10:0${i}:00Z` }),
        ])
      }

      const record = responder.getEscalationRecord('US-MX-USD-MXN')
      expect(record).not.toBeNull()
      expect(record!.consecutiveHighCount).toBe(3)
      expect(record!.escalationLevel).toBe('watch')
    })

    it('escalates to "alert" after 6 consecutive high/critical signals', async () => {
      const pool = createMockPool([])
      const responder = new StressResponder(pool)

      for (let i = 0; i < 6; i++) {
        let callIdx = 0
        const results: MockQueryResult[] = [
          { rows: [{ module_id: 'mod-1', policy: {} }] },
          { rows: [] },
          { rows: [] },
        ]
        // At thresholds 3 and 6, an escalation observation is inserted
        if (i === 2 || i === 5) {
          results.push({ rows: [] })
        }
        ;(pool.query as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          if (callIdx >= results.length) return { rows: [] }
          return results[callIdx++]
        })

        vi.advanceTimersByTime(61_000)
        await responder.processStressSignals([
          makeSignal({ stressLevel: 'high', detectedAt: `2026-03-01T10:${String(i).padStart(2, '0')}:00Z` }),
        ])
      }

      const record = responder.getEscalationRecord('US-MX-USD-MXN')
      expect(record).not.toBeNull()
      expect(record!.consecutiveHighCount).toBe(6)
      expect(record!.escalationLevel).toBe('alert')
    })

    it('escalates to "incident" after 10 consecutive high/critical signals', async () => {
      const pool = createMockPool([])
      const responder = new StressResponder(pool)

      for (let i = 0; i < 10; i++) {
        let callIdx = 0
        const results: MockQueryResult[] = [
          { rows: [{ module_id: 'mod-1', policy: {} }] },
          { rows: [] },
          { rows: [] },
        ]
        // At thresholds 3, 6, and 10, an escalation observation is inserted
        if (i === 2 || i === 5 || i === 9) {
          results.push({ rows: [] })
        }
        ;(pool.query as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          if (callIdx >= results.length) return { rows: [] }
          return results[callIdx++]
        })

        vi.advanceTimersByTime(61_000)
        await responder.processStressSignals([
          makeSignal({ stressLevel: 'critical', detectedAt: `2026-03-01T10:${String(i).padStart(2, '0')}:00Z` }),
        ])
      }

      const record = responder.getEscalationRecord('US-MX-USD-MXN')
      expect(record).not.toBeNull()
      expect(record!.consecutiveHighCount).toBe(10)
      expect(record!.escalationLevel).toBe('incident')
    })

    it('partially de-escalates counter on elevated signal', async () => {
      const pool = createMockPool([])
      const responder = new StressResponder(pool)

      // Build up to 4 high signals
      for (let i = 0; i < 4; i++) {
        let callIdx = 0
        const results: MockQueryResult[] = [
          { rows: [{ module_id: 'mod-1', policy: {} }] },
          { rows: [] },
          { rows: [] },
        ]
        if (i === 2) results.push({ rows: [] }) // threshold 3 escalation
        ;(pool.query as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          if (callIdx >= results.length) return { rows: [] }
          return results[callIdx++]
        })
        vi.advanceTimersByTime(61_000)
        await responder.processStressSignals([
          makeSignal({ stressLevel: 'high', detectedAt: `2026-03-01T10:${String(i).padStart(2, '0')}:00Z` }),
        ])
      }

      expect(responder.getEscalationRecord('US-MX-USD-MXN')!.consecutiveHighCount).toBe(4)

      // Now send an elevated signal — should reduce counter by 1
      {
        let callIdx = 0
        const results: MockQueryResult[] = [
          { rows: [{ module_id: 'mod-1', policy: {} }] },
          { rows: [] },
          { rows: [] },
        ]
        ;(pool.query as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          if (callIdx >= results.length) return { rows: [] }
          return results[callIdx++]
        })
        vi.advanceTimersByTime(61_000)
        await responder.processStressSignals([
          makeSignal({ stressLevel: 'elevated', stressScore: 0.4, detectedAt: '2026-03-01T10:04:00Z' }),
        ])
      }

      expect(responder.getEscalationRecord('US-MX-USD-MXN')!.consecutiveHighCount).toBe(3)
    })

    it('returns null escalation record for unknown corridors', () => {
      const pool = createMockPool()
      const responder = new StressResponder(pool)

      expect(responder.getEscalationRecord('UNKNOWN-CORRIDOR')).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Multiple signals in one batch
  // -------------------------------------------------------------------------

  describe('batch signal processing', () => {
    it('processes multiple signals for different corridors', async () => {
      const pool = createMockPool([
        // Signal 1: US-MX
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
        // Signal 2: US-IN
        { rows: [{ module_id: 'mod-2', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signals: CorridorStressSignal[] = [
        makeSignal({ corridorId: 'US-MX-USD-MXN', stressLevel: 'high' }),
        makeSignal({ corridorId: 'US-IN-USD-INR', stressLevel: 'elevated', stressScore: 0.4 }),
      ]

      const overrides = await responder.processStressSignals(signals)

      expect(overrides).toHaveLength(2)
      expect(overrides[0].corridorId).toBe('US-MX-USD-MXN')
      expect(overrides[1].corridorId).toBe('US-IN-USD-INR')
    })

    it('handles mixed calm and stress signals in a batch', async () => {
      const pool = createMockPool([
        // calm signal: clearOverrides
        { rows: [] },
        // high signal: modules query + override + stress event
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] },
        { rows: [] },
      ])

      const responder = new StressResponder(pool)
      const signals: CorridorStressSignal[] = [
        makeSignal({ corridorId: 'US-MX-USD-MXN', stressLevel: 'calm', stressScore: 0.05 }),
        makeSignal({ corridorId: 'US-IN-USD-INR', stressLevel: 'high', stressScore: 0.7 }),
      ]

      const overrides = await responder.processStressSignals(signals)

      // Only the high signal should produce overrides
      expect(overrides).toHaveLength(1)
      expect(overrides[0].corridorId).toBe('US-IN-USD-INR')
    })

    it('returns empty array when all signals are calm', async () => {
      const pool = createMockPool([
        { rows: [] }, // clearOverrides for first signal
        { rows: [] }, // clearOverrides for second signal
      ])

      const responder = new StressResponder(pool)
      const signals: CorridorStressSignal[] = [
        makeSignal({ corridorId: 'US-MX-USD-MXN', stressLevel: 'calm', stressScore: 0.0 }),
        makeSignal({ corridorId: 'US-IN-USD-INR', stressLevel: 'calm', stressScore: 0.1 }),
      ]

      const overrides = await responder.processStressSignals(signals)
      expect(overrides).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  // Stress event recording
  // -------------------------------------------------------------------------

  describe('stress event recording', () => {
    it('records a stress event observation in the database', async () => {
      const pool = createMockPool([
        { rows: [{ module_id: 'mod-1', policy: {} }] },
        { rows: [] }, // override
        { rows: [] }, // stress event INSERT
      ])

      const responder = new StressResponder(pool)
      const signal = makeSignal({ stressLevel: 'high', stressScore: 0.72 })
      await responder.processStressSignals([signal])

      // Verify the stress event INSERT was called
      const calls = (pool.query as ReturnType<typeof vi.fn>).mock.calls
      const stressEventCall = calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('silver.observation') && c[0].includes('event'),
      )
      expect(stressEventCall).toBeDefined()
    })
  })
})
