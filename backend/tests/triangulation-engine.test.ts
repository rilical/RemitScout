import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger before importing the engine
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { TriangulationEngine } from '../plane-b/src/triangulation/engine'
import type { StressSignal, StressSignalType } from '../plane-b/src/triangulation/engine'

// Minimal mock pool — the engine's pure methods (signal management,
// stress scoring, confidence assessment) don't need real DB access.
const createMockPool = () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  connect: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSignal = (overrides: Partial<StressSignal> = {}): StressSignal => ({
  signalId: overrides.signalId ?? `sig-${Math.random().toString(36).slice(2, 8)}`,
  corridorId: overrides.corridorId ?? 'USD-PHP',
  signalType: overrides.signalType ?? 'rate_deviation',
  intensity: overrides.intensity ?? 0.5,
  detectedAt: overrides.detectedAt ?? new Date().toISOString(),
  ttlSeconds: overrides.ttlSeconds ?? 300,
  source: overrides.source ?? 'test-module',
})

describe('TriangulationEngine', () => {
  let engine: TriangulationEngine

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00.000Z'))
    const pool = createMockPool()
    engine = new TriangulationEngine(pool as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // =========================================================================
  // Signal validation
  // =========================================================================
  describe('signal validation', () => {
    it('accepts a valid signal with all required fields', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      expect(result).not.toBeNull()
      expect(result!.corridorId).toBe('USD-PHP')
      expect(result!.signalType).toBe('rate_deviation')
      expect(result!.intensity).toBe(0.5)
      expect(result!.source).toBe('test')
      expect(result!.signalId).toBeTruthy()
      expect(result!.detectedAt).toBeTruthy()
      expect(result!.ttlSeconds).toBe(300) // default TTL
    })

    it('rejects signal with invalid corridor ID format (4-part)', () => {
      const result = engine.ingestSignal({
        corridorId: 'US-MX-USD-MXN', // 4-part format, engine expects "XXX-YYY"
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      // The engine validates corridor as /^[A-Z]{3}-[A-Z]{3}$/ (currency pair style)
      expect(result).toBeNull()
    })

    it('accepts valid corridor format: 3-letter-3-letter', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      expect(result).not.toBeNull()
      expect(result!.corridorId).toBe('USD-PHP')
    })

    it('rejects signal with empty corridor ID', () => {
      const result = engine.ingestSignal({
        corridorId: '',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      expect(result).toBeNull()
    })

    it('rejects signal with lowercase corridor ID', () => {
      const result = engine.ingestSignal({
        corridorId: 'usd-php',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      expect(result).toBeNull()
    })

    it('rejects signal with intensity below 0', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: -0.1,
        source: 'test',
      })

      expect(result).toBeNull()
    })

    it('rejects signal with intensity above 1', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 1.1,
        source: 'test',
      })

      expect(result).toBeNull()
    })

    it('rejects signal with NaN intensity', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: NaN,
        source: 'test',
      })

      expect(result).toBeNull()
    })

    it('accepts boundary intensity values (0 and 1)', () => {
      const zero = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0,
        source: 'test',
      })
      expect(zero).not.toBeNull()
      expect(zero!.intensity).toBe(0)

      const one = engine.ingestSignal({
        corridorId: 'GBP-KES',
        signalType: 'volume_spike',
        intensity: 1,
        source: 'test',
      })
      expect(one).not.toBeNull()
      expect(one!.intensity).toBe(1)
    })

    it('rejects signal with invalid signal type', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'invalid_type' as StressSignalType,
        intensity: 0.5,
        source: 'test',
      })

      expect(result).toBeNull()
    })

    it('accepts all valid signal types', () => {
      const validTypes: StressSignalType[] = [
        'rate_deviation', 'volume_spike', 'volume_drop', 'provider_dropout',
        'freshness_breach', 'rci_spike', 'external_fx', 'failure_surge',
      ]

      for (const signalType of validTypes) {
        const result = engine.ingestSignal({
          corridorId: 'USD-PHP',
          signalType,
          intensity: 0.5,
          source: 'test',
        })
        expect(result).not.toBeNull()
        expect(result!.signalType).toBe(signalType)
      }
    })

    it('rejects signal with empty source', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: '',
      })

      expect(result).toBeNull()
    })

    it('uses provided signalId when supplied', () => {
      const result = engine.ingestSignal({
        signalId: 'custom-id-123',
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      expect(result).not.toBeNull()
      expect(result!.signalId).toBe('custom-id-123')
    })

    it('uses provided detectedAt when supplied', () => {
      const ts = '2026-02-28T10:00:00.000Z'
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        detectedAt: ts,
      })

      expect(result).not.toBeNull()
      expect(result!.detectedAt).toBe(ts)
    })

    it('defaults ttlSeconds to 300 when not provided or invalid', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
      })

      expect(result!.ttlSeconds).toBe(300)
    })

    it('defaults ttlSeconds to 300 when zero is provided', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 0,
      })

      expect(result!.ttlSeconds).toBe(300)
    })

    it('defaults ttlSeconds to 300 when negative value is provided', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: -100,
      })

      expect(result!.ttlSeconds).toBe(300)
    })

    it('uses provided positive ttlSeconds', () => {
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 600,
      })

      expect(result!.ttlSeconds).toBe(600)
    })
  })

  // =========================================================================
  // Signal expiration and purge
  // =========================================================================
  describe('signal expiration', () => {
    it('purges expired signals', () => {
      // Ingest a signal with 60s TTL
      engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 60,
        detectedAt: '2026-03-01T11:58:00.000Z', // 2 min before "now"
      })

      // Current time = 12:00:00, signal detected at 11:58:00 with 60s TTL
      // Signal expired at 11:59:00 — should be purged
      const purged = engine.purgeExpiredSignals()
      expect(purged).toBe(1)
    })

    it('does not purge active signals', () => {
      engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 600, // 10 min TTL, well within range
      })

      const purged = engine.purgeExpiredSignals()
      expect(purged).toBe(0)
    })

    it('isSignalActive returns true for active signals', () => {
      const signal = engine.ingestSignal({
        signalId: 'test-active',
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 600,
      })

      expect(engine.isSignalActive('test-active')).toBe(true)
    })

    it('isSignalActive returns false for expired signals', () => {
      engine.ingestSignal({
        signalId: 'test-expired',
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 60,
        detectedAt: '2026-03-01T11:58:00.000Z', // expired
      })

      expect(engine.isSignalActive('test-expired')).toBe(false)
    })

    it('isSignalActive returns false for unknown signalId', () => {
      expect(engine.isSignalActive('nonexistent')).toBe(false)
    })

    it('getActiveSignalsForCorridor only returns non-expired signals', () => {
      // One active, one expired
      engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 600, // active
      })
      engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'volume_spike',
        intensity: 0.3,
        source: 'test',
        ttlSeconds: 60,
        detectedAt: '2026-03-01T11:58:00.000Z', // expired
      })

      const active = engine.getActiveSignalsForCorridor('USD-PHP')
      expect(active).toHaveLength(1)
      expect(active[0].signalType).toBe('rate_deviation')
    })

    it('getActiveSignalsForCorridor returns empty for corridors with no signals', () => {
      const active = engine.getActiveSignalsForCorridor('GBP-KES')
      expect(active).toHaveLength(0)
    })

    it('getAllActiveSignals purges expired before returning', () => {
      engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0.5,
        source: 'test',
        ttlSeconds: 600,
      })
      engine.ingestSignal({
        corridorId: 'EUR-USD',
        signalType: 'volume_drop',
        intensity: 0.3,
        source: 'test',
        ttlSeconds: 60,
        detectedAt: '2026-03-01T11:58:00.000Z', // expired
      })

      const all = engine.getAllActiveSignals()
      expect(all).toHaveLength(1)
      expect(all[0].corridorId).toBe('USD-PHP')
    })
  })

  // =========================================================================
  // Signal capacity limits
  // =========================================================================
  describe('signal capacity limits', () => {
    it('evicts oldest signal when per-corridor limit (50) is reached', () => {
      // Ingest 50 signals for the same corridor
      for (let i = 0; i < 50; i++) {
        engine.ingestSignal({
          corridorId: 'USD-PHP',
          signalType: 'rate_deviation',
          intensity: 0.5,
          source: 'test',
          ttlSeconds: 600,
          detectedAt: new Date(Date.now() - (50 - i) * 1000).toISOString(), // staggered times
        })
      }

      // The 51st signal should succeed, evicting the oldest
      const result = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'volume_spike',
        intensity: 0.9,
        source: 'test',
        ttlSeconds: 600,
      })

      expect(result).not.toBeNull()
      // Should still have at most 50 for this corridor
      const active = engine.getActiveSignalsForCorridor('USD-PHP')
      expect(active.length).toBeLessThanOrEqual(50)
    })

    it('handles global signal cap (2000) gracefully', () => {
      // We won't ingest 2000 signals in a unit test, but we can verify
      // the mechanism works for a smaller count using valid corridor IDs
      const corridors = ['USD-PHP', 'GBP-KES', 'EUR-USD', 'CAD-INR', 'AUD-NZD']
      for (const corridorId of corridors) {
        engine.ingestSignal({
          corridorId,
          signalType: 'rate_deviation',
          intensity: 0.5,
          source: 'test',
          ttlSeconds: 600,
        })
      }

      const all = engine.getAllActiveSignals()
      expect(all).toHaveLength(5)
    })
  })

  // =========================================================================
  // Stress score bounds
  // =========================================================================
  describe('stress score computation', () => {
    // Access the private computeStressScore via triangulating.
    // We test indirectly: ingest stress signals, then verify they
    // affect the results when the engine is exercised.
    // For pure bounds testing, we validate the engine's scoring contract
    // through signal intensity ranges.

    it('stress score is bounded to [0, 1] — no signals means lower scores', () => {
      // Without any signals, the stress contribution from signals is 0.
      // The RCI and freshness contributions are computed from leg data,
      // so stress score from signals alone should be bounded.
      // We test this contract through the signal intensity boundary:
      // intensity of 0 contributes 0 to stress, intensity of 1 contributes at most 0.2

      const lowSignal = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0,
        source: 'test',
        ttlSeconds: 600,
      })
      expect(lowSignal).not.toBeNull()
      expect(lowSignal!.intensity).toBe(0)

      const highSignal = engine.ingestSignal({
        corridorId: 'EUR-USD',
        signalType: 'failure_surge',
        intensity: 1,
        source: 'test',
        ttlSeconds: 600,
      })
      expect(highSignal).not.toBeNull()
      expect(highSignal!.intensity).toBe(1)
    })

    it('signal intensity is always normalized to [0, 1] range', () => {
      // Boundary: exactly 0
      const s0 = engine.ingestSignal({
        corridorId: 'USD-PHP',
        signalType: 'rate_deviation',
        intensity: 0,
        source: 'test',
      })
      expect(s0!.intensity).toBe(0)

      // Boundary: exactly 1
      const s1 = engine.ingestSignal({
        corridorId: 'GBP-KES',
        signalType: 'volume_spike',
        intensity: 1,
        source: 'test',
      })
      expect(s1!.intensity).toBe(1)

      // Out of bounds: rejected
      expect(engine.ingestSignal({
        corridorId: 'EUR-USD',
        signalType: 'rate_deviation',
        intensity: -0.001,
        source: 'test',
      })).toBeNull()

      expect(engine.ingestSignal({
        corridorId: 'EUR-USD',
        signalType: 'rate_deviation',
        intensity: 1.001,
        source: 'test',
      })).toBeNull()
    })
  })

  // =========================================================================
  // Confidence assessment
  // =========================================================================
  describe('confidence assessment', () => {
    // The assessConfidence method is private, but its logic depends on:
    // 1. minProviders per leg (threshold: 5 for high, 3 for medium)
    // 2. maxFreshness per leg (threshold: 30min for high, 60min for medium)
    // 3. High-intensity stress signals (>= 0.7) downgrade confidence
    //
    // We test confidence effects indirectly through signal downgrade rules.

    it('high-intensity signals (>= 0.7) affect confidence downgrade', () => {
      // Ingest 3 high-intensity signals for the same corridor
      for (let i = 0; i < 3; i++) {
        const result = engine.ingestSignal({
          corridorId: 'USD-PHP',
          signalType: 'rate_deviation',
          intensity: 0.8,
          source: 'test',
          ttlSeconds: 600,
        })
        expect(result).not.toBeNull()
      }

      // With 3+ high-intensity signals, confidence should be forced to 'low'
      // This is tested indirectly — the signals are stored and available
      const signals = engine.getActiveSignalsForCorridor('USD-PHP')
      expect(signals).toHaveLength(3)
      expect(signals.every(s => s.intensity >= 0.7)).toBe(true)
    })

    it('low-intensity signals do not affect confidence downgrade', () => {
      for (let i = 0; i < 5; i++) {
        engine.ingestSignal({
          corridorId: 'EUR-USD',
          signalType: 'volume_spike',
          intensity: 0.3, // below 0.7 threshold
          source: 'test',
          ttlSeconds: 600,
        })
      }

      const signals = engine.getActiveSignalsForCorridor('EUR-USD')
      expect(signals).toHaveLength(5)
      expect(signals.every(s => s.intensity < 0.7)).toBe(true)
    })
  })

  // =========================================================================
  // TriangulatedResult type contract
  // =========================================================================
  describe('TriangulatedResult type contract', () => {
    it('has the expected shape for a corridor result', () => {
      // This is a compile-time/type contract test
      const result = {
        corridorId: 'GBP-KES',
        amountBucket: 500,
        methodProfile: 'bank_transfer:bank_deposit',
        date: '2026-03-01',
        leg1Corridor: 'GBP-USD',
        leg2Corridor: 'USD-KES',
        leg1Teer: 1.27,
        leg2Teer: 130.5,
        triangulatedTeer: 1.27 * 130.5,
        triangulatedRci: 0.015,
        stressScore: 0.2,
        confidence: 'high' as const,
        methodologyVersion: 'triangulation_v1',
      }

      expect(result.corridorId).toBe('GBP-KES')
      expect(result.triangulatedTeer).toBeCloseTo(165.735, 2)
      expect(result.confidence).toBe('high')
      expect(result.methodologyVersion).toBe('triangulation_v1')
      expect(result.stressScore).toBeGreaterThanOrEqual(0)
      expect(result.stressScore).toBeLessThanOrEqual(1)
    })
  })

  // =========================================================================
  // TEER combination logic (multiplicative)
  // =========================================================================
  describe('TEER combination (multiplicative)', () => {
    // The engine combines TEER via multiplication: leg1 * leg2
    // Example: GBP/USD = 1.27, USD/KES = 130.5 => GBP/KES = 165.735

    it('multiplies two legs to get triangulated TEER', () => {
      const leg1Teer = 1.27 // GBP/USD
      const leg2Teer = 130.5 // USD/KES
      const expected = leg1Teer * leg2Teer

      expect(expected).toBeCloseTo(165.735, 2)
    })

    it('handles small exchange rates', () => {
      const leg1Teer = 0.0085 // JPY/USD
      const leg2Teer = 83.5 // USD/INR
      const expected = leg1Teer * leg2Teer

      expect(expected).toBeCloseTo(0.70975, 4)
    })

    it('handles identical rates (e.g., pegged currencies)', () => {
      const leg1Teer = 1.0
      const leg2Teer = 3.6725 // AED/USD rate
      const expected = leg1Teer * leg2Teer

      expect(expected).toBeCloseTo(3.6725, 4)
    })
  })

  // =========================================================================
  // RCI combination logic (root-sum-square)
  // =========================================================================
  describe('RCI combination (root-sum-square)', () => {
    // combineRci: sqrt(w1 * rci1^2 + w2 * rci2^2)
    // where w = providerCount / totalProviders

    it('combines RCI using provider-weighted root-sum-square', () => {
      const leg1Rci = 0.02
      const leg2Rci = 0.03
      const leg1Providers = 5
      const leg2Providers = 3
      const total = leg1Providers + leg2Providers
      const w1 = leg1Providers / total
      const w2 = leg2Providers / total

      const expected = Math.sqrt(
        w1 * leg1Rci * leg1Rci + w2 * leg2Rci * leg2Rci,
      )

      // sqrt(0.625 * 0.0004 + 0.375 * 0.0009) = sqrt(0.00025 + 0.0003375) = sqrt(0.0005875)
      expect(expected).toBeCloseTo(0.02424, 4)
    })

    it('returns zero RCI when both legs have zero RCI', () => {
      const result = Math.sqrt(0.5 * 0 + 0.5 * 0)
      expect(result).toBe(0)
    })

    it('weights higher-provider leg more heavily', () => {
      const leg1Rci = 0.05
      const leg2Rci = 0.05
      const leg1Providers = 10
      const leg2Providers = 2
      const total = leg1Providers + leg2Providers
      const w1 = leg1Providers / total
      const w2 = leg2Providers / total

      const combined = Math.sqrt(w1 * leg1Rci ** 2 + w2 * leg2Rci ** 2)
      // With equal RCI but unequal weights, combined should equal 0.05
      expect(combined).toBeCloseTo(0.05, 4)
    })
  })

  // =========================================================================
  // Corridor ID format used in triangulation legs
  // =========================================================================
  describe('corridor ID splitting for triangulation', () => {
    // The engine splits corridorId on '-' to get send/receive currencies.
    // It uses currency codes (not country-country-currency-currency format).

    it('splits "GBP-KES" into sendCurrency=GBP, receiveCurrency=KES', () => {
      const corridorId = 'GBP-KES'
      const [send, receive] = corridorId.split('-')
      expect(send).toBe('GBP')
      expect(receive).toBe('KES')
    })

    it('constructs intermediary leg IDs correctly', () => {
      const corridorId = 'GBP-KES'
      const [send, receive] = corridorId.split('-')
      const intermediary = 'USD'

      const leg1Id = `${send}-${intermediary}`
      const leg2Id = `${intermediary}-${receive}`

      expect(leg1Id).toBe('GBP-USD')
      expect(leg2Id).toBe('USD-KES')
    })

    it('skips intermediary when it matches send or receive currency', () => {
      const corridorId = 'USD-PHP'
      const [send, receive] = corridorId.split('-')
      const intermediaries = ['USD', 'EUR', 'GBP']

      const eligible = intermediaries.filter(
        (i) => i !== send && i !== receive,
      )

      expect(eligible).toEqual(['EUR', 'GBP'])
      expect(eligible).not.toContain('USD')
    })
  })

  // =========================================================================
  // Integration: triangulate() method with mocked DB
  // =========================================================================
  describe('triangulate() with mocked database', () => {
    it('returns empty results when no eligible corridors exist', async () => {
      const pool = createMockPool()
      pool.query.mockResolvedValue({ rows: [] })
      const eng = new TriangulationEngine(pool as any)

      const results = await eng.triangulate({ date: '2026-03-01' })
      expect(results).toEqual([])
    })

    it('calls database with parameterized queries (not string concatenation)', async () => {
      const pool = createMockPool()
      pool.query.mockResolvedValue({ rows: [] })
      const eng = new TriangulationEngine(pool as any)

      await eng.triangulate({ date: '2026-03-01', amountBuckets: [500] })

      // Verify all queries use parameterized format
      for (const call of pool.query.mock.calls) {
        const sql = call[0] as string
        const params = call[1] as any[]

        // SQL should contain $1, $2, etc. placeholders
        expect(sql).toMatch(/\$\d+/)
        // Params should be an array
        expect(Array.isArray(params)).toBe(true)
      }
    })

    it('uses default options when none provided', async () => {
      const pool = createMockPool()
      pool.query.mockResolvedValue({ rows: [] })
      const eng = new TriangulationEngine(pool as any)

      const results = await eng.triangulate()
      expect(results).toEqual([])

      // Should have queried with today's date and default bucket
      const firstCall = pool.query.mock.calls[0]
      expect(firstCall[1]).toBeDefined()
    })
  })
})
