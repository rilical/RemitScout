import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TriangulationEngine } from '../plane-b/src/triangulation/engine'
import type { StressSignal, StressSignalType } from '../plane-b/src/triangulation/engine'

// ---------------------------------------------------------------------------
// Mock pool — we only need query() for the DB-backed methods
// ---------------------------------------------------------------------------
const createMockPool = (queryImpl?: (...args: unknown[]) => unknown) => {
  const defaultQuery = vi.fn().mockResolvedValue({ rows: [] })
  return {
    query: queryImpl ? vi.fn(queryImpl) : defaultQuery,
    // Pool shape stubs (not exercised by unit tests)
    connect: vi.fn(),
    end: vi.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  } as any
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeSignal = (
  overrides: Partial<StressSignal> & { corridorId: string; signalType: StressSignalType; intensity: number; source: string },
): Parameters<TriangulationEngine['ingestSignal']>[0] => ({
  corridorId: overrides.corridorId,
  signalType: overrides.signalType,
  intensity: overrides.intensity,
  source: overrides.source,
  ttlSeconds: overrides.ttlSeconds ?? 300,
  detectedAt: overrides.detectedAt ?? new Date().toISOString(),
  signalId: overrides.signalId,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TriangulationEngine', () => {
  let engine: TriangulationEngine

  beforeEach(() => {
    engine = new TriangulationEngine(createMockPool())
  })

  // =========================================================================
  // Corridor ID parsing fix verification
  // =========================================================================
  describe('triangulateCorridor — corridorId parsing', () => {
    it('extracts currency codes (not country codes) from a 4-part corridor ID', async () => {
      // The engine's triangulateCorridor is private, so we exercise it via
      // the public triangulate() method. We mock findEligibleCorridors to
      // return a specific corridor and loadLeg to return data so we can
      // verify the leg IDs in the result.
      const corridorId = 'US-PH-USD-PHP'

      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        // findEligibleCorridors — allCorridors query
        if (sql.includes('SELECT DISTINCT corridor_id FROM silver.observation')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        // findEligibleCorridors — coveredCorridors query (return empty = corridor needs triangulation)
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        // loadLeg queries — match by source/dest currency via silver.corridor join
        if (sql.includes('silver.corridor')) {
          const sourceCurrency = params[0] as string
          const destCurrency = params[1] as string

          // Only return data for USD-EUR and EUR-PHP legs
          if (sourceCurrency === 'USD' && destCurrency === 'EUR') {
            return {
              rows: [{
                teer: '0.92',
                rci: '0.01',
                provider_count: '5',
                max_observed: new Date().toISOString(),
              }],
            }
          }
          if (sourceCurrency === 'EUR' && destCurrency === 'PHP') {
            return {
              rows: [{
                teer: '62.0',
                rci: '0.02',
                provider_count: '4',
                max_observed: new Date().toISOString(),
              }],
            }
          }
          // No data for other currency pairs
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        // persistResult
        if (sql.includes('INSERT INTO gold_export.triangulated_index')) {
          return { rows: [] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)

      const results = await testEngine.triangulate({
        date: '2026-03-01',
        amountBuckets: [500],
      })

      // Should have found the corridor and triangulated via EUR intermediary
      expect(results.length).toBe(1)
      const result = results[0]

      // Verify leg corridors use CURRENCY codes, not country codes
      // The old buggy code would have produced 'US-EUR' and 'EUR-PH'
      expect(result.leg1Corridor).toBe('USD-EUR')
      expect(result.leg2Corridor).toBe('EUR-PHP')

      // TEER should be the product of the two legs
      expect(result.triangulatedTeer).toBeCloseTo(0.92 * 62.0, 5)

      // Corridor ID in the result should be the full 4-part ID
      expect(result.corridorId).toBe('US-PH-USD-PHP')
    })

    it('returns null for an invalid (non-4-part) corridor ID', async () => {
      const mockQuery = vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('SELECT DISTINCT corridor_id FROM silver.observation')) {
          return { rows: [{ corridor_id: 'INVALID' }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)

      const results = await testEngine.triangulate({ date: '2026-03-01' })
      // Invalid corridor should be skipped (parseCorridorId returns null)
      expect(results.length).toBe(0)
    })

    it('skips intermediary that matches send or receive currency', async () => {
      // Corridor US-GB-USD-GBP — USD is the send currency and also an intermediary
      const corridorId = 'US-GB-USD-GBP'

      const queriedLegs: { source: string; dest: string }[] = []
      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        if (sql.includes('SELECT DISTINCT corridor_id FROM silver.observation')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        if (sql.includes('silver.corridor')) {
          queriedLegs.push({ source: params[0] as string, dest: params[1] as string })
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)
      await testEngine.triangulate({ date: '2026-03-01' })

      // USD intermediary should be skipped (matches sendCurrency)
      // GBP intermediary should be skipped (matches receiveCurrency)
      // Only EUR intermediary should be tried
      const legSources = queriedLegs.map((l) => `${l.source}-${l.dest}`)
      expect(legSources).not.toContain('USD-USD')
      expect(legSources).not.toContain('GBP-GBP')
      // Should have tried USD-EUR and EUR-GBP legs
      expect(legSources).toContain('USD-EUR')
      expect(legSources).toContain('EUR-GBP')
    })
  })

  // =========================================================================
  // Stress signal validation
  // =========================================================================
  describe('ingestSignal — validateSignal', () => {
    it('accepts a 4-part corridor ID (XX-YY-XXX-YYY)', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'US-PH-USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      }))
      expect(signal).not.toBeNull()
      expect(signal!.corridorId).toBe('US-PH-USD-PHP')
    })

    it('accepts a 2-part corridor ID (XXX-YYY) for leg-level signals', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      }))
      expect(signal).not.toBeNull()
      expect(signal!.corridorId).toBe('USD-EUR')
    })

    it('rejects an empty corridor ID', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: '',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      }))
      expect(signal).toBeNull()
    })

    it('rejects a malformed corridor ID (single part)', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      }))
      expect(signal).toBeNull()
    })

    it('rejects intensity outside [0, 1]', () => {
      const tooHigh = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 1.5,
        source: 'test',
      }))
      expect(tooHigh).toBeNull()

      const negative = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: -0.1,
        source: 'test',
      }))
      expect(negative).toBeNull()
    })

    it('rejects NaN intensity', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: NaN,
        source: 'test',
      }))
      expect(signal).toBeNull()
    })

    it('rejects unknown signal types', () => {
      const signal = engine.ingestSignal({
        corridorId: 'USD-EUR',
        signalType: 'unknown_type' as StressSignalType,
        intensity: 0.5,
        source: 'test',
      })
      expect(signal).toBeNull()
    })

    it('defaults TTL to 300 when not provided', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: undefined as unknown as number,
      }))
      expect(signal).not.toBeNull()
      expect(signal!.ttlSeconds).toBe(300)
    })

    it('generates a signalId when not provided', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      }))
      expect(signal).not.toBeNull()
      expect(signal!.signalId).toBeTruthy()
      expect(signal!.signalId.length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // Stress signal lifecycle
  // =========================================================================
  describe('stress signal lifecycle', () => {
    it('tracks active signals and returns them for the correct corridor', () => {
      engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      }))
      engine.ingestSignal(makeSignal({
        corridorId: 'USD-GBP',
        signalType: 'volume_spike',
        intensity: 0.3,
        source: 'test',
      }))

      const eurSignals = engine.getActiveSignalsForCorridor('USD-EUR')
      const gbpSignals = engine.getActiveSignalsForCorridor('USD-GBP')

      expect(eurSignals.length).toBe(1)
      expect(eurSignals[0].signalType).toBe('rate_deviation')
      expect(gbpSignals.length).toBe(1)
      expect(gbpSignals[0].signalType).toBe('volume_spike')
    })

    it('expires signals after their TTL', () => {
      const pastTime = new Date(Date.now() - 400_000).toISOString() // 400s ago, > 300s TTL
      engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 300,
        detectedAt: pastTime,
      }))

      const active = engine.getActiveSignalsForCorridor('USD-EUR')
      expect(active.length).toBe(0)
    })

    it('purgeExpiredSignals removes expired signals', () => {
      const pastTime = new Date(Date.now() - 400_000).toISOString()
      engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 300,
        detectedAt: pastTime,
      }))
      engine.ingestSignal(makeSignal({
        corridorId: 'USD-GBP',
        signalType: 'volume_spike',
        intensity: 0.3,
        source: 'test',
        ttlSeconds: 600, // still valid
      }))

      const purged = engine.purgeExpiredSignals()
      expect(purged).toBe(1)

      const all = engine.getAllActiveSignals()
      expect(all.length).toBe(1)
      expect(all[0].corridorId).toBe('USD-GBP')
    })

    it('isSignalActive returns false for expired signals', () => {
      const pastTime = new Date(Date.now() - 400_000).toISOString()
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 300,
        detectedAt: pastTime,
      }))
      expect(signal).not.toBeNull()
      expect(engine.isSignalActive(signal!.signalId)).toBe(false)
    })

    it('isSignalActive returns true for non-expired signals', () => {
      const signal = engine.ingestSignal(makeSignal({
        corridorId: 'USD-EUR',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 600,
      }))
      expect(signal).not.toBeNull()
      expect(engine.isSignalActive(signal!.signalId)).toBe(true)
    })
  })

  // =========================================================================
  // TEER combination
  // =========================================================================
  describe('TEER combination', () => {
    it('multiplies exchange rates from two legs', async () => {
      // We test combineTeer indirectly through the triangulate flow
      const corridorId = 'GB-KE-GBP-KES'

      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        if (sql.includes('SELECT DISTINCT corridor_id')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        if (sql.includes('silver.corridor')) {
          const src = params[0] as string
          const dst = params[1] as string
          if (src === 'GBP' && dst === 'USD') {
            return { rows: [{ teer: '1.27', rci: '0.005', provider_count: '6', max_observed: new Date().toISOString() }] }
          }
          if (src === 'USD' && dst === 'KES') {
            return { rows: [{ teer: '130.5', rci: '0.008', provider_count: '4', max_observed: new Date().toISOString() }] }
          }
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        if (sql.includes('INSERT INTO gold_export')) {
          return { rows: [] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)
      const results = await testEngine.triangulate({ date: '2026-03-01' })

      expect(results.length).toBe(1)
      // GBP->USD * USD->KES = 1.27 * 130.5 = 165.735
      expect(results[0].triangulatedTeer).toBeCloseTo(1.27 * 130.5, 5)
      expect(results[0].leg1Corridor).toBe('GBP-USD')
      expect(results[0].leg2Corridor).toBe('USD-KES')
    })
  })

  // =========================================================================
  // RCI combination
  // =========================================================================
  describe('RCI combination', () => {
    it('produces root-sum-square weighted RCI', async () => {
      const corridorId = 'GB-KE-GBP-KES'

      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        if (sql.includes('SELECT DISTINCT corridor_id')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        if (sql.includes('silver.corridor')) {
          const src = params[0] as string
          const dst = params[1] as string
          if (src === 'GBP' && dst === 'USD') {
            return { rows: [{ teer: '1.27', rci: '0.02', provider_count: '6', max_observed: new Date().toISOString() }] }
          }
          if (src === 'USD' && dst === 'KES') {
            return { rows: [{ teer: '130.5', rci: '0.03', provider_count: '4', max_observed: new Date().toISOString() }] }
          }
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        if (sql.includes('INSERT INTO gold_export')) {
          return { rows: [] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)
      const results = await testEngine.triangulate({ date: '2026-03-01' })

      expect(results.length).toBe(1)
      // w1 = 6/10 = 0.6, w2 = 4/10 = 0.4
      // sqrt(0.6 * 0.02^2 + 0.4 * 0.03^2)
      const expected = Math.sqrt(0.6 * 0.0004 + 0.4 * 0.0009)
      expect(results[0].triangulatedRci).toBeCloseTo(expected, 8)
    })
  })

  // =========================================================================
  // Confidence assessment
  // =========================================================================
  describe('confidence assessment', () => {
    it('assigns high confidence with many providers and fresh data', async () => {
      const corridorId = 'AU-IN-AUD-INR'
      const freshTs = new Date(Date.now() - 10 * 60_000).toISOString() // 10 min ago

      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        if (sql.includes('SELECT DISTINCT corridor_id')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        if (sql.includes('silver.corridor')) {
          const src = params[0] as string
          const dst = params[1] as string
          if (src === 'AUD' && dst === 'USD') {
            return { rows: [{ teer: '0.65', rci: '0.005', provider_count: '8', max_observed: freshTs }] }
          }
          if (src === 'USD' && dst === 'INR') {
            return { rows: [{ teer: '83.5', rci: '0.004', provider_count: '7', max_observed: freshTs }] }
          }
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        if (sql.includes('INSERT INTO gold_export')) {
          return { rows: [] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)
      const results = await testEngine.triangulate({ date: '2026-03-01' })

      expect(results.length).toBe(1)
      expect(results[0].confidence).toBe('high')
    })

    it('downgrades confidence when high-intensity stress signals are active', async () => {
      const corridorId = 'AU-IN-AUD-INR'
      const freshTs = new Date(Date.now() - 10 * 60_000).toISOString()

      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        if (sql.includes('SELECT DISTINCT corridor_id')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        if (sql.includes('silver.corridor')) {
          const src = params[0] as string
          const dst = params[1] as string
          if (src === 'AUD' && dst === 'USD') {
            return { rows: [{ teer: '0.65', rci: '0.005', provider_count: '8', max_observed: freshTs }] }
          }
          if (src === 'USD' && dst === 'INR') {
            return { rows: [{ teer: '83.5', rci: '0.004', provider_count: '7', max_observed: freshTs }] }
          }
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        if (sql.includes('INSERT INTO gold_export')) {
          return { rows: [] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)

      // Ingest 3 high-intensity stress signals
      testEngine.ingestSignal(makeSignal({
        corridorId: 'AU-IN-AUD-INR',
        signalType: 'rate_deviation',
        intensity: 0.9,
        source: 'test',
      }))
      testEngine.ingestSignal(makeSignal({
        corridorId: 'AUD-USD',
        signalType: 'provider_dropout',
        intensity: 0.8,
        source: 'test',
      }))
      testEngine.ingestSignal(makeSignal({
        corridorId: 'USD-INR',
        signalType: 'failure_surge',
        intensity: 0.75,
        source: 'test',
      }))

      const results = await testEngine.triangulate({ date: '2026-03-01' })
      expect(results.length).toBe(1)
      // With 3 high-intensity signals (>= 0.7), confidence should be downgraded to low
      expect(results[0].confidence).toBe('low')
    })
  })

  // =========================================================================
  // loadLeg — 2-part leg ID handling
  // =========================================================================
  describe('loadLeg — currency pair matching', () => {
    it('queries silver.corridor by source_currency and dest_currency', async () => {
      const corridorId = 'JP-US-JPY-USD'

      const capturedQueries: { sql: string; params: unknown[] }[] = []
      const mockQuery = vi.fn().mockImplementation((sql: string, params: unknown[]) => {
        capturedQueries.push({ sql, params })
        if (sql.includes('SELECT DISTINCT corridor_id')) {
          return { rows: [{ corridor_id: corridorId }] }
        }
        if (sql.includes('HAVING COUNT')) {
          return { rows: [] }
        }
        if (sql.includes('silver.corridor')) {
          return { rows: [{ teer: null, rci: null, provider_count: '0', max_observed: null }] }
        }
        return { rows: [] }
      })

      const pool = createMockPool()
      pool.query = mockQuery
      const testEngine = new TriangulationEngine(pool)
      await testEngine.triangulate({ date: '2026-03-01' })

      // loadLeg queries should use currency codes, not country codes
      const legQueries = capturedQueries.filter((q) => q.sql.includes('silver.corridor'))
      expect(legQueries.length).toBeGreaterThan(0)

      // All leg queries should use 3-letter currency codes as first two params
      for (const q of legQueries) {
        const src = q.params[0] as string
        const dst = q.params[1] as string
        expect(src.length).toBe(3)
        expect(dst.length).toBe(3)
        // Verify they are valid currency codes (from the intermediary list or the corridor currencies)
        const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY']
        expect(validCurrencies).toContain(src)
        expect(validCurrencies).toContain(dst)
      }
    })
  })

  // =========================================================================
  // Per-corridor signal cap
  // =========================================================================
  describe('signal capacity limits', () => {
    it('evicts oldest signal when per-corridor cap is reached', () => {
      // Default maxSignalsPerCorridor is 50
      const signals: StressSignal[] = []
      for (let i = 0; i < 52; i++) {
        const s = engine.ingestSignal(makeSignal({
          corridorId: 'USD-EUR',
          signalType: 'rate_deviation',
          intensity: 0.1 + (i * 0.01),
          source: 'test',
          detectedAt: new Date(Date.now() + i * 1000).toISOString(),
        }))
        if (s) signals.push(s)
      }

      const active = engine.getActiveSignalsForCorridor('USD-EUR')
      // Should be capped at 50
      expect(active.length).toBeLessThanOrEqual(50)
    })
  })
})
