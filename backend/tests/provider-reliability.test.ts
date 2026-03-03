import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock logger before importing the module under test
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import {
  computeSuccessRate,
  computeFreshnessScore,
  computeConsistencyScore,
  computeRepairSpeedScore,
  ProviderReliabilityScorer,
  DEFAULT_RELIABILITY_CONFIG,
  type ProviderOperationalData,
  type ReliabilityScore,
  type ReliabilityConfig,
} from '../plane-b/src/scoring/provider-reliability'
import { GLOBAL_WEIGHT_CORRIDOR_ID } from '../shared/weighting-model'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeOperationalData = (
  overrides: Partial<ProviderOperationalData> = {},
): ProviderOperationalData => ({
  providerId: 'providerId' in overrides ? overrides.providerId! : 'wise',
  corridorId: 'corridorId' in overrides ? overrides.corridorId! : 'USA-US-MEX-MX',
  successCount: overrides.successCount ?? 95,
  totalCount: overrides.totalCount ?? 100,
  lastObservationAgeSeconds: overrides.lastObservationAgeSeconds ?? 300,
  rateStddev: overrides.rateStddev ?? 0.02,
  medianRate: overrides.medianRate ?? 18.4,
  avgMttrSeconds: overrides.avgMttrSeconds ?? 600,
})

// ---------------------------------------------------------------------------
// computeSuccessRate
// ---------------------------------------------------------------------------

describe('computeSuccessRate', () => {
  it('returns 1.0 when all runs succeed', () => {
    expect(computeSuccessRate(100, 100)).toBe(1.0)
  })

  it('returns 0.0 when all runs fail', () => {
    expect(computeSuccessRate(0, 100)).toBe(0)
  })

  it('returns correct ratio for mixed results', () => {
    expect(computeSuccessRate(75, 100)).toBeCloseTo(0.75, 5)
  })

  it('returns 0.0 when totalCount is 0 (no data)', () => {
    expect(computeSuccessRate(0, 0)).toBe(0)
  })

  it('returns 0.0 when totalCount is negative', () => {
    expect(computeSuccessRate(5, -1)).toBe(0)
  })

  it('returns 0.0 when successCount is negative', () => {
    expect(computeSuccessRate(-5, 100)).toBe(0)
  })

  it('caps at 1.0 when successCount exceeds totalCount', () => {
    // Should not happen in practice, but guard against it
    expect(computeSuccessRate(110, 100)).toBe(1.0)
  })

  it('handles a single run', () => {
    expect(computeSuccessRate(1, 1)).toBe(1.0)
    expect(computeSuccessRate(0, 1)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeFreshnessScore
// ---------------------------------------------------------------------------

describe('computeFreshnessScore', () => {
  it('returns 1.0 when age is 0 (just observed)', () => {
    expect(computeFreshnessScore(0, 3600)).toBe(1.0)
  })

  it('returns 0.0 when age equals max acceptable age', () => {
    expect(computeFreshnessScore(3600, 3600)).toBe(0)
  })

  it('returns 0.0 when age exceeds max acceptable age', () => {
    expect(computeFreshnessScore(7200, 3600)).toBe(0)
  })

  it('returns 0.5 at half the max age (linear decay)', () => {
    expect(computeFreshnessScore(1800, 3600)).toBeCloseTo(0.5, 5)
  })

  it('returns 0.75 at quarter of the max age', () => {
    expect(computeFreshnessScore(900, 3600)).toBeCloseTo(0.75, 5)
  })

  it('returns 1.0 when age is negative', () => {
    expect(computeFreshnessScore(-100, 3600)).toBe(1.0)
  })

  it('returns 0.0 when maxAcceptableAge is 0', () => {
    expect(computeFreshnessScore(100, 0)).toBe(0)
  })

  it('returns 0.0 when maxAcceptableAge is negative', () => {
    expect(computeFreshnessScore(100, -100)).toBe(0)
  })

  it('returns value in (0, 1) for age between 0 and max', () => {
    const score = computeFreshnessScore(1200, 3600)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })
})

// ---------------------------------------------------------------------------
// computeConsistencyScore
// ---------------------------------------------------------------------------

describe('computeConsistencyScore', () => {
  it('returns 1.0 when stddev is 0 (perfectly consistent)', () => {
    expect(computeConsistencyScore(0, 18.4)).toBe(1.0)
  })

  it('returns 0.0 when CV equals maxAcceptableCv', () => {
    // CV = stddev / median = 1.84 / 18.4 = 0.1
    expect(computeConsistencyScore(1.84, 18.4, 0.1)).toBe(0)
  })

  it('returns 0.0 when CV exceeds maxAcceptableCv', () => {
    // CV = 5.0 / 18.4 > 0.1
    expect(computeConsistencyScore(5.0, 18.4, 0.1)).toBe(0)
  })

  it('returns 0.5 when CV is half of maxAcceptableCv', () => {
    // CV = 0.92 / 18.4 = 0.05, maxCv = 0.1 -> score = 1 - 0.05/0.1 = 0.5
    expect(computeConsistencyScore(0.92, 18.4, 0.1)).toBeCloseTo(0.5, 2)
  })

  it('returns 1.0 when medianRate is 0 (no variance detected)', () => {
    expect(computeConsistencyScore(0.5, 0, 0.1)).toBe(1.0)
  })

  it('returns 1.0 when stddev is negative', () => {
    expect(computeConsistencyScore(-0.5, 18.4, 0.1)).toBe(1.0)
  })

  it('uses absolute value of medianRate for negative rates', () => {
    // CV = 0.5 / |-10| = 0.05, maxCv = 0.1 -> score = 0.5
    expect(computeConsistencyScore(0.5, -10, 0.1)).toBeCloseTo(0.5, 5)
  })

  it('returns 0.0 when maxAcceptableCv is 0', () => {
    expect(computeConsistencyScore(0.1, 18.4, 0)).toBe(0)
  })

  it('uses default maxAcceptableCv when not provided', () => {
    // Default is 0.1, CV = 0.02 / 18.4 ≈ 0.00109
    const score = computeConsistencyScore(0.02, 18.4)
    expect(score).toBeGreaterThan(0.98)
    expect(score).toBeLessThanOrEqual(1.0)
  })
})

// ---------------------------------------------------------------------------
// computeRepairSpeedScore
// ---------------------------------------------------------------------------

describe('computeRepairSpeedScore', () => {
  it('returns 1.0 when MTTR is 0 (instant repair or never failed)', () => {
    expect(computeRepairSpeedScore(0, 7200)).toBe(1.0)
  })

  it('returns 0.0 when MTTR equals max acceptable', () => {
    expect(computeRepairSpeedScore(7200, 7200)).toBe(0)
  })

  it('returns 0.0 when MTTR exceeds max acceptable', () => {
    expect(computeRepairSpeedScore(14400, 7200)).toBe(0)
  })

  it('returns 0.5 when MTTR is half of max', () => {
    expect(computeRepairSpeedScore(3600, 7200)).toBeCloseTo(0.5, 5)
  })

  it('returns 0.0 when maxAcceptableMttr is 0', () => {
    expect(computeRepairSpeedScore(100, 0)).toBe(0)
  })

  it('returns 0.0 when maxAcceptableMttr is negative', () => {
    expect(computeRepairSpeedScore(100, -100)).toBe(0)
  })

  it('returns 1.0 when MTTR is negative (treated as 0)', () => {
    expect(computeRepairSpeedScore(-100, 7200)).toBe(1.0)
  })

  it('returns value in (0, 1) for MTTR between 0 and max', () => {
    const score = computeRepairSpeedScore(2400, 7200)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })
})

// ---------------------------------------------------------------------------
// DEFAULT_RELIABILITY_CONFIG
// ---------------------------------------------------------------------------

describe('DEFAULT_RELIABILITY_CONFIG', () => {
  it('has weights that sum to 1.0', () => {
    const sum =
      DEFAULT_RELIABILITY_CONFIG.successRateWeight +
      DEFAULT_RELIABILITY_CONFIG.freshnessWeight +
      DEFAULT_RELIABILITY_CONFIG.consistencyWeight +
      DEFAULT_RELIABILITY_CONFIG.repairSpeedWeight
    expect(sum).toBeCloseTo(1.0, 10)
  })

  it('has expected default weights', () => {
    expect(DEFAULT_RELIABILITY_CONFIG.successRateWeight).toBe(0.4)
    expect(DEFAULT_RELIABILITY_CONFIG.freshnessWeight).toBe(0.3)
    expect(DEFAULT_RELIABILITY_CONFIG.consistencyWeight).toBe(0.2)
    expect(DEFAULT_RELIABILITY_CONFIG.repairSpeedWeight).toBe(0.1)
  })

  it('has reasonable threshold defaults', () => {
    expect(DEFAULT_RELIABILITY_CONFIG.maxAcceptableAgeSeconds).toBe(3600)
    expect(DEFAULT_RELIABILITY_CONFIG.maxAcceptableMttrSeconds).toBe(7200)
    expect(DEFAULT_RELIABILITY_CONFIG.maxAcceptableCv).toBe(0.1)
    expect(DEFAULT_RELIABILITY_CONFIG.reliabilityFloor).toBe(0.1)
  })
})

// ---------------------------------------------------------------------------
// ProviderReliabilityScorer — computeReliability
// ---------------------------------------------------------------------------

describe('ProviderReliabilityScorer', () => {
  let scorer: ProviderReliabilityScorer

  beforeEach(() => {
    scorer = new ProviderReliabilityScorer()
  })

  describe('constructor', () => {
    it('throws when custom weights do not sum to 1.0', () => {
      expect(
        () =>
          new ProviderReliabilityScorer({
            successRateWeight: 0.5,
            freshnessWeight: 0.5,
            consistencyWeight: 0.5,
            repairSpeedWeight: 0.5,
          }),
      ).toThrow('Reliability config weights must sum to 1.0, got 2')
    })

    it('accepts weights that sum to 1.0', () => {
      expect(
        () =>
          new ProviderReliabilityScorer({
            successRateWeight: 0.25,
            freshnessWeight: 0.25,
            consistencyWeight: 0.25,
            repairSpeedWeight: 0.25,
          }),
      ).not.toThrow()
    })
  })

  describe('computeReliability', () => {
    it('computes a perfect score for a healthy provider', () => {
      const data = makeOperationalData({
        successCount: 100,
        totalCount: 100,
        lastObservationAgeSeconds: 0,
        rateStddev: 0,
        medianRate: 18.4,
        avgMttrSeconds: 0,
      })

      const score = scorer.computeReliability(data)

      expect(score.overall).toBeCloseTo(1.0, 5)
      expect(score.components.successRate).toBe(1.0)
      expect(score.components.freshness).toBe(1.0)
      expect(score.components.consistency).toBe(1.0)
      expect(score.components.repairSpeed).toBe(1.0)
      expect(score.providerId).toBe('wise')
      expect(score.corridorId).toBe('USA-US-MEX-MX')
    })

    it('computes a zero score for a completely failed provider', () => {
      const data = makeOperationalData({
        successCount: 0,
        totalCount: 100,
        lastObservationAgeSeconds: 7200, // 2 hours, exceeds 1-hour max
        rateStddev: 5.0, // CV = 5/18.4 >> 0.1
        medianRate: 18.4,
        avgMttrSeconds: 14400, // exceeds 2-hour max
      })

      const score = scorer.computeReliability(data)

      expect(score.overall).toBe(0)
      expect(score.components.successRate).toBe(0)
      expect(score.components.freshness).toBe(0)
      expect(score.components.consistency).toBe(0)
      expect(score.components.repairSpeed).toBe(0)
    })

    it('computes weighted composite correctly', () => {
      // Engineer specific component scores and verify weighted sum
      const data = makeOperationalData({
        successCount: 80,
        totalCount: 100,    // success_rate = 0.80
        lastObservationAgeSeconds: 1800, // freshness = 0.5 (half of 3600 max)
        rateStddev: 0.92,
        medianRate: 18.4,   // CV = 0.05, consistency = 0.5
        avgMttrSeconds: 3600, // repair_speed = 0.5 (half of 7200 max)
      })

      const score = scorer.computeReliability(data)

      expect(score.components.successRate).toBeCloseTo(0.80, 2)
      expect(score.components.freshness).toBeCloseTo(0.50, 2)
      expect(score.components.consistency).toBeCloseTo(0.50, 2)
      expect(score.components.repairSpeed).toBeCloseTo(0.50, 2)

      // Weighted sum: 0.80*0.4 + 0.50*0.3 + 0.50*0.2 + 0.50*0.1
      // = 0.32 + 0.15 + 0.10 + 0.05 = 0.62
      expect(score.overall).toBeCloseTo(0.62, 2)
    })

    it('handles no-data scenario (totalCount = 0)', () => {
      const data = makeOperationalData({
        successCount: 0,
        totalCount: 0,
        lastObservationAgeSeconds: 7200,
        rateStddev: 0,
        medianRate: 0,
        avgMttrSeconds: 0,
      })

      const score = scorer.computeReliability(data)

      expect(score.components.successRate).toBe(0)
      expect(score.components.freshness).toBe(0)
      expect(score.components.consistency).toBe(1.0) // stddev=0 -> perfect consistency
      expect(score.components.repairSpeed).toBe(1.0) // mttr=0 -> never needed repair
      expect(score.overall).toBeCloseTo(0.2 + 0.1, 5) // consistency * 0.2 + repair * 0.1
    })

    it('includes providerId and corridorId in the result', () => {
      const data = makeOperationalData({
        providerId: 'remitly',
        corridorId: 'GBR-GB-IND-IN',
      })

      const score = scorer.computeReliability(data)

      expect(score.providerId).toBe('remitly')
      expect(score.corridorId).toBe('GBR-GB-IND-IN')
    })

    it('handles null corridorId for global scores', () => {
      const data = makeOperationalData({ corridorId: null })

      const score = scorer.computeReliability(data)

      expect(score.corridorId).toBeNull()
    })

    it('returns overall in [0, 1] for random inputs', () => {
      // Fuzz-like check: various realistic values
      const cases: Partial<ProviderOperationalData>[] = [
        { successCount: 50, totalCount: 100, lastObservationAgeSeconds: 1800, avgMttrSeconds: 3600 },
        { successCount: 100, totalCount: 100, lastObservationAgeSeconds: 0, avgMttrSeconds: 0 },
        { successCount: 0, totalCount: 0, lastObservationAgeSeconds: 99999, avgMttrSeconds: 99999 },
        { successCount: 1, totalCount: 1, lastObservationAgeSeconds: 3599, avgMttrSeconds: 7199 },
      ]

      for (const c of cases) {
        const score = scorer.computeReliability(makeOperationalData(c))
        expect(score.overall).toBeGreaterThanOrEqual(0)
        expect(score.overall).toBeLessThanOrEqual(1)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // ProviderReliabilityScorer — computeAll
  // ---------------------------------------------------------------------------

  describe('computeAll', () => {
    it('returns a nested map keyed by provider and corridor', () => {
      const data = [
        makeOperationalData({ providerId: 'wise', corridorId: 'US-MX' }),
        makeOperationalData({ providerId: 'wise', corridorId: 'US-IN' }),
        makeOperationalData({ providerId: 'remitly', corridorId: 'US-MX' }),
      ]

      const result = scorer.computeAll(data)

      expect(result.size).toBe(2)

      const wiseMap = result.get('wise')!
      expect(wiseMap.size).toBe(2)
      expect(wiseMap.has('US-MX')).toBe(true)
      expect(wiseMap.has('US-IN')).toBe(true)

      const remitlyMap = result.get('remitly')!
      expect(remitlyMap.size).toBe(1)
      expect(remitlyMap.has('US-MX')).toBe(true)
    })

    it('returns an empty map for empty input', () => {
      const result = scorer.computeAll([])
      expect(result.size).toBe(0)
    })

    it('uses GLOBAL_WEIGHT_CORRIDOR_ID key for null corridorId', () => {
      const data = [makeOperationalData({ corridorId: null })]
      const result = scorer.computeAll(data)

      const wiseMap = result.get('wise')!
      expect(wiseMap.has(GLOBAL_WEIGHT_CORRIDOR_ID)).toBe(true)
    })

    it('computes correct scores for each entry', () => {
      const perfectData = makeOperationalData({
        providerId: 'perfect',
        corridorId: 'US-MX',
        successCount: 100,
        totalCount: 100,
        lastObservationAgeSeconds: 0,
        rateStddev: 0,
        avgMttrSeconds: 0,
      })
      const poorData = makeOperationalData({
        providerId: 'poor',
        corridorId: 'US-MX',
        successCount: 0,
        totalCount: 100,
        lastObservationAgeSeconds: 7200,
        rateStddev: 5,
        medianRate: 18.4,
        avgMttrSeconds: 14400,
      })

      const result = scorer.computeAll([perfectData, poorData])

      const perfectScore = result.get('perfect')!.get('US-MX')!
      const poorScore = result.get('poor')!.get('US-MX')!

      expect(perfectScore.overall).toBeCloseTo(1.0, 5)
      expect(poorScore.overall).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // ProviderReliabilityScorer — adjustWeights
  // ---------------------------------------------------------------------------

  describe('adjustWeights', () => {
    it('preserves weights when all reliability scores are 1.0', () => {
      const accuracyWeights = new Map([
        ['wise', 0.4],
        ['remitly', 0.35],
        ['ria', 0.25],
      ])
      const reliabilityScores = new Map([
        ['wise', 1.0],
        ['remitly', 1.0],
        ['ria', 1.0],
      ])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      expect(adjusted.get('wise')).toBeCloseTo(0.4, 5)
      expect(adjusted.get('remitly')).toBeCloseTo(0.35, 5)
      expect(adjusted.get('ria')).toBeCloseTo(0.25, 5)
    })

    it('reduces weight of an unreliable provider while preserving sum = 1', () => {
      const accuracyWeights = new Map([
        ['wise', 0.5],
        ['remitly', 0.5],
      ])
      const reliabilityScores = new Map([
        ['wise', 1.0],
        ['remitly', 0.0], // completely unreliable
      ])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      // wise: 0.5 * (0.1 + 0.9 * 1.0) = 0.5
      // remitly: 0.5 * (0.1 + 0.9 * 0.0) = 0.05
      // total = 0.55
      // wise: 0.5 / 0.55, remitly: 0.05 / 0.55
      expect(adjusted.get('wise')!).toBeGreaterThan(0.5)
      expect(adjusted.get('remitly')!).toBeLessThan(0.5)

      // Sum must be 1.0
      const sum = Array.from(adjusted.values()).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    })

    it('applies floor — reliability 0 does not zero out the weight', () => {
      const accuracyWeights = new Map([
        ['wise', 0.5],
        ['remitly', 0.5],
      ])
      const reliabilityScores = new Map([
        ['wise', 1.0],
        ['remitly', 0.0],
      ])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      // remitly should still have a non-zero weight due to floor
      expect(adjusted.get('remitly')!).toBeGreaterThan(0)
    })

    it('uses reliability 1.0 as default for providers missing a reliability score', () => {
      const accuracyWeights = new Map([
        ['wise', 0.5],
        ['remitly', 0.5],
      ])
      // Only wise has a reliability score
      const reliabilityScores = new Map([
        ['wise', 0.5],
      ])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      // remitly defaults to reliability=1.0, so its multiplier is 1.0
      // wise has reliability=0.5, so its multiplier = 0.1 + 0.9*0.5 = 0.55
      // wise_raw = 0.5 * 0.55 = 0.275
      // remitly_raw = 0.5 * 1.0 = 0.5
      // total = 0.775
      expect(adjusted.get('remitly')!).toBeGreaterThan(adjusted.get('wise')!)

      const sum = Array.from(adjusted.values()).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    })

    it('returns empty map for empty inputs', () => {
      const adjusted = scorer.adjustWeights(new Map(), new Map())
      expect(adjusted.size).toBe(0)
    })

    it('handles single provider', () => {
      const accuracyWeights = new Map([['wise', 1.0]])
      const reliabilityScores = new Map([['wise', 0.5]])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      // After renormalization, single provider always gets 1.0
      expect(adjusted.get('wise')).toBeCloseTo(1.0, 10)
    })

    it('renormalizes correctly with 5 providers', () => {
      const accuracyWeights = new Map([
        ['a', 0.3],
        ['b', 0.25],
        ['c', 0.2],
        ['d', 0.15],
        ['e', 0.1],
      ])
      const reliabilityScores = new Map([
        ['a', 1.0],
        ['b', 0.8],
        ['c', 0.6],
        ['d', 0.4],
        ['e', 0.2],
      ])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      // Verify ordering is preserved (higher accuracy + higher reliability = higher weight)
      expect(adjusted.get('a')!).toBeGreaterThan(adjusted.get('b')!)
      expect(adjusted.get('b')!).toBeGreaterThan(adjusted.get('c')!)

      // Verify sum = 1.0
      const sum = Array.from(adjusted.values()).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    })

    it('adjusts weights with all-zero accuracy weights gracefully', () => {
      const accuracyWeights = new Map([
        ['wise', 0],
        ['remitly', 0],
      ])
      const reliabilityScores = new Map([
        ['wise', 1.0],
        ['remitly', 1.0],
      ])

      const adjusted = scorer.adjustWeights(accuracyWeights, reliabilityScores)

      // All raw adjusted = 0, fallback to equal weights
      expect(adjusted.get('wise')).toBeCloseTo(0.5, 5)
      expect(adjusted.get('remitly')).toBeCloseTo(0.5, 5)
    })
  })

  // ---------------------------------------------------------------------------
  // Config override
  // ---------------------------------------------------------------------------

  describe('config override', () => {
    it('respects custom weights', () => {
      const customScorer = new ProviderReliabilityScorer({
        successRateWeight: 1.0,
        freshnessWeight: 0,
        consistencyWeight: 0,
        repairSpeedWeight: 0,
      })

      const data = makeOperationalData({
        successCount: 80,
        totalCount: 100,
        lastObservationAgeSeconds: 7200, // stale
        rateStddev: 5.0, // inconsistent
        avgMttrSeconds: 14400, // slow repairs
      })

      const score = customScorer.computeReliability(data)

      // Only success rate should matter
      expect(score.overall).toBeCloseTo(0.80, 2)
    })

    it('respects custom maxAcceptableAgeSeconds', () => {
      const customScorer = new ProviderReliabilityScorer({
        maxAcceptableAgeSeconds: 600, // 10 minutes (tighter)
      })

      const data = makeOperationalData({
        lastObservationAgeSeconds: 300, // 5 min
      })

      const score = customScorer.computeReliability(data)

      // 300/600 = 0.5, so freshness = 0.5
      expect(score.components.freshness).toBeCloseTo(0.5, 2)
    })

    it('respects custom maxAcceptableMttrSeconds', () => {
      const customScorer = new ProviderReliabilityScorer({
        maxAcceptableMttrSeconds: 1800, // 30 min (tighter)
      })

      const data = makeOperationalData({
        avgMttrSeconds: 900, // 15 min
      })

      const score = customScorer.computeReliability(data)

      // 900/1800 = 0.5, so repairSpeed = 0.5
      expect(score.components.repairSpeed).toBeCloseTo(0.5, 2)
    })

    it('respects custom maxAcceptableCv', () => {
      const customScorer = new ProviderReliabilityScorer({
        maxAcceptableCv: 0.05, // tighter than default 0.1
      })

      const data = makeOperationalData({
        rateStddev: 0.46,
        medianRate: 18.4, // CV ≈ 0.025 = half of 0.05
      })

      const score = customScorer.computeReliability(data)

      expect(score.components.consistency).toBeCloseTo(0.5, 2)
    })

    it('respects custom reliabilityFloor in adjustWeights', () => {
      const customScorer = new ProviderReliabilityScorer({
        reliabilityFloor: 0.5, // high floor
      })

      const accuracyWeights = new Map([
        ['wise', 0.5],
        ['remitly', 0.5],
      ])
      const reliabilityScores = new Map([
        ['wise', 1.0],
        ['remitly', 0.0],
      ])

      const adjusted = customScorer.adjustWeights(accuracyWeights, reliabilityScores)

      // wise: 0.5 * (0.5 + 0.5 * 1.0) = 0.5
      // remitly: 0.5 * (0.5 + 0.5 * 0.0) = 0.25
      // total = 0.75
      // With high floor, unreliable provider keeps more weight
      expect(adjusted.get('remitly')!).toBeGreaterThan(0.3)

      const sum = Array.from(adjusted.values()).reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 10)
    })
  })

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles a provider with perfect record', () => {
      const data = makeOperationalData({
        successCount: 10000,
        totalCount: 10000,
        lastObservationAgeSeconds: 30,
        rateStddev: 0.001,
        medianRate: 18.4,
        avgMttrSeconds: 0,
      })

      const score = scorer.computeReliability(data)
      expect(score.overall).toBeGreaterThan(0.95)
    })

    it('handles a provider with all failures', () => {
      const data = makeOperationalData({
        successCount: 0,
        totalCount: 500,
        lastObservationAgeSeconds: 3600,
        rateStddev: 2.0,
        medianRate: 18.4,
        avgMttrSeconds: 7200,
      })

      const score = scorer.computeReliability(data)
      expect(score.overall).toBe(0)
    })

    it('handles very large numbers without overflow', () => {
      const data = makeOperationalData({
        successCount: 1000000,
        totalCount: 1000000,
        lastObservationAgeSeconds: 1,
        rateStddev: 0.00001,
        medianRate: 18.4,
        avgMttrSeconds: 1,
      })

      const score = scorer.computeReliability(data)
      expect(score.overall).toBeGreaterThan(0.99)
      expect(Number.isFinite(score.overall)).toBe(true)
    })

    it('all component scores are individually in [0, 1]', () => {
      const extremeCases: Partial<ProviderOperationalData>[] = [
        { successCount: 0, totalCount: 0 },
        { successCount: 100, totalCount: 100 },
        { lastObservationAgeSeconds: 0 },
        { lastObservationAgeSeconds: 999999 },
        { rateStddev: 0, medianRate: 0 },
        { rateStddev: 100, medianRate: 1 },
        { avgMttrSeconds: 0 },
        { avgMttrSeconds: 999999 },
      ]

      for (const c of extremeCases) {
        const score = scorer.computeReliability(makeOperationalData(c))
        for (const [, value] of Object.entries(score.components)) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        }
        expect(score.overall).toBeGreaterThanOrEqual(0)
        expect(score.overall).toBeLessThanOrEqual(1)
      }
    })
  })
})
