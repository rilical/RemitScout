import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock shared dependencies before importing the module under test
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

import {
  computeMedian,
  computeMAD,
  CrossProviderDetector,
  type CrossProviderAnomalyResult,
} from '../plane-b/src/signals/cross-provider-detector'

/* ------------------------------------------------------------------ */
/*  computeMedian                                                      */
/* ------------------------------------------------------------------ */
describe('computeMedian', () => {
  it('returns the middle element for odd-length arrays', () => {
    expect(computeMedian([3, 1, 2])).toBe(2)
    expect(computeMedian([10, 20, 30, 40, 50])).toBe(30)
    expect(computeMedian([5])).toBe(5)
  })

  it('returns the average of two middle elements for even-length arrays', () => {
    expect(computeMedian([1, 2, 3, 4])).toBe(2.5)
    expect(computeMedian([10, 20])).toBe(15)
    expect(computeMedian([1, 3, 5, 7])).toBe(4)
  })

  it('returns the single element for a one-element array', () => {
    expect(computeMedian([42])).toBe(42)
  })

  it('handles unsorted input correctly', () => {
    expect(computeMedian([9, 1, 5, 3, 7])).toBe(5)
  })

  it('throws on empty array', () => {
    expect(() => computeMedian([])).toThrow('Cannot compute median of empty array')
  })

  it('does not mutate the original array', () => {
    const original = [3, 1, 2]
    computeMedian(original)
    expect(original).toEqual([3, 1, 2])
  })
})

/* ------------------------------------------------------------------ */
/*  computeMAD                                                         */
/* ------------------------------------------------------------------ */
describe('computeMAD', () => {
  it('computes MAD for a normal spread of values', () => {
    // Values: [1, 2, 3, 4, 5], median = 3
    // Absolute deviations: [2, 1, 0, 1, 2]
    // Median of deviations: 1
    const values = [1, 2, 3, 4, 5]
    const median = computeMedian(values)
    expect(computeMAD(values, median)).toBe(1)
  })

  it('returns 0 when all values are the same', () => {
    const values = [18.4, 18.4, 18.4, 18.4]
    const median = computeMedian(values)
    expect(computeMAD(values, median)).toBe(0)
  })

  it('computes MAD for two values', () => {
    // Values: [10, 20], median = 15
    // Absolute deviations: [5, 5]
    // Median of deviations: 5
    const values = [10, 20]
    const median = computeMedian(values)
    expect(computeMAD(values, median)).toBe(5)
  })

  it('returns 0 for empty array', () => {
    expect(computeMAD([], 0)).toBe(0)
  })

  it('computes correct MAD with an outlier', () => {
    // Values: [18.4, 18.4, 18.4, 18.5, 19.2]
    // Median = 18.4
    // Abs deviations: [0, 0, 0, 0.1, 0.8]
    // Sorted deviations: [0, 0, 0, 0.1, 0.8]
    // Median of deviations: 0
    const values = [18.4, 18.4, 18.4, 18.5, 19.2]
    const median = computeMedian(values)
    expect(median).toBe(18.4)
    expect(computeMAD(values, median)).toBe(0)
  })
})

/* ------------------------------------------------------------------ */
/*  CrossProviderDetector.detectOutliers                               */
/* ------------------------------------------------------------------ */
describe('CrossProviderDetector', () => {
  let detector: CrossProviderDetector

  beforeEach(() => {
    detector = new CrossProviderDetector()
  })

  describe('detectOutliers', () => {
    it('detects a clear outlier among 5 providers', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.38],
        ['xoom', 18.41],
        ['western_union', 19.50], // clear outlier
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      expect(results.size).toBe(5)

      const wuResult = results.get('western_union')!
      expect(wuResult.detected).toBe(true)
      expect(wuResult.direction).toBe('above')
      expect(wuResult.madScore).toBeGreaterThan(3.0)
      expect(wuResult.currentRate).toBe(19.50)
      expect(wuResult.providerCount).toBe(5)
      expect(wuResult.median).not.toBeNull()
      expect(wuResult.mad).not.toBeNull()

      // Non-outlier providers should not be flagged
      const wiseResult = results.get('wise')!
      expect(wiseResult.detected).toBe(false)
    })

    it('returns no outliers when all providers are similar', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.41],
        ['xoom', 18.39],
        ['worldremit', 18.43],
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      for (const [, result] of results) {
        expect(result.detected).toBe(false)
        expect(result.providerCount).toBe(5)
      }
    })

    it('detects outlier among 23 providers at 18.4x with one at 19.20', () => {
      const rates = new Map<string, number>()

      // 23 providers clustered around 18.4x
      const providerNames = [
        'wise', 'remitly', 'ria', 'xoom', 'worldremit',
        'paysend', 'instarem', 'singx', 'transfergo', 'pangea',
        'sendwave', 'bossmoney', 'intermex', 'placid', 'remitbee',
        'mukuru', 'orbitremit', 'wirebarley', 'xe', 'koronapay',
        'dahabshiil', 'wells_fargo', 'alansari',
      ]

      for (let i = 0; i < providerNames.length; i++) {
        // Slight variation: 18.38 to 18.46
        rates.set(providerNames[i]!, 18.38 + (i % 9) * 0.01)
      }

      // One outlier at 19.20
      rates.set('western_union', 19.20)

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      expect(results.size).toBe(24)

      const wuResult = results.get('western_union')!
      expect(wuResult.detected).toBe(true)
      expect(wuResult.direction).toBe('above')
      expect(wuResult.madScore).toBeGreaterThan(3.0)
      expect(wuResult.currentRate).toBe(19.20)
      expect(wuResult.providerCount).toBe(24)

      // Verify clustered providers are NOT flagged
      const wiseResult = results.get('wise')!
      expect(wiseResult.detected).toBe(false)
    })

    it('returns detected: false for fewer than 3 providers', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      expect(results.size).toBe(2)
      for (const [, result] of results) {
        expect(result.detected).toBe(false)
        expect(result.madScore).toBeNull()
        expect(result.direction).toBeNull()
        expect(result.median).toBeNull()
        expect(result.mad).toBeNull()
        expect(result.providerCount).toBe(2)
      }
    })

    it('returns detected: false for a single provider', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      expect(results.size).toBe(1)
      const result = results.get('wise')!
      expect(result.detected).toBe(false)
      expect(result.madScore).toBeNull()
      expect(result.providerCount).toBe(1)
    })

    it('returns an empty map for empty rates', () => {
      const rates = new Map<string, number>()
      const results = detector.detectOutliers('USA-US-MEX-MX', rates)
      expect(results.size).toBe(0)
    })

    it('detects an outlier below the median', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.41],
        ['xoom', 18.39],
        ['western_union', 17.00], // outlier below
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      const wuResult = results.get('western_union')!
      expect(wuResult.detected).toBe(true)
      expect(wuResult.direction).toBe('below')
      expect(wuResult.madScore).toBeGreaterThan(3.0)
    })

    it('handles MAD = 0 when all but one provider report the same rate', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.40],
        ['ria', 18.40],
        ['xoom', 18.40],
        ['western_union', 19.00], // only outlier, MAD will be 0
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      // The outlier should still be detected (MAD=0 edge case)
      const wuResult = results.get('western_union')!
      expect(wuResult.detected).toBe(true)
      expect(wuResult.madScore).toBe(Infinity)
      expect(wuResult.direction).toBe('above')

      // Providers at the median should NOT be anomalous
      const wiseResult = results.get('wise')!
      expect(wiseResult.detected).toBe(false)
      expect(wiseResult.madScore).toBe(0)
      expect(wiseResult.direction).toBe('neutral')
    })

    it('handles all providers reporting the same rate (no anomalies)', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.40],
        ['ria', 18.40],
        ['xoom', 18.40],
      ])

      const results = detector.detectOutliers('USA-US-MEX-MX', rates)

      for (const [, result] of results) {
        expect(result.detected).toBe(false)
        expect(result.madScore).toBe(0)
        expect(result.direction).toBe('neutral')
        expect(result.mad).toBe(0)
      }
    })

    it('respects a custom threshold', () => {
      const rates = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.38],
        ['xoom', 18.60], // moderate deviation
      ])

      // With a very low threshold (1.0), moderate deviations are flagged
      const strictResults = detector.detectOutliers('USA-US-MEX-MX', rates, 1.0)
      const xoomStrict = strictResults.get('xoom')!

      // With a very high threshold (10.0), the same deviation is not flagged
      const lenientResults = detector.detectOutliers('USA-US-MEX-MX', rates, 10.0)
      const xoomLenient = lenientResults.get('xoom')!

      // The madScore is the same regardless of threshold
      expect(xoomStrict.madScore).toBe(xoomLenient.madScore)

      // But detection depends on threshold
      if (xoomStrict.madScore! > 1.0) {
        expect(xoomStrict.detected).toBe(true)
      }
      expect(xoomLenient.detected).toBe(false)
    })

    it('includes correct median and MAD in results', () => {
      const rates = new Map<string, number>([
        ['a', 10],
        ['b', 20],
        ['c', 30],
        ['d', 40],
        ['e', 50],
      ])

      const results = detector.detectOutliers('TEST', rates)

      // Median of [10, 20, 30, 40, 50] = 30
      // Abs deviations: [20, 10, 0, 10, 20]
      // MAD = median of [0, 10, 10, 20, 20] = 10
      for (const [, result] of results) {
        expect(result.median).toBe(30)
        expect(result.mad).toBe(10)
      }
    })
  })

  /* ------------------------------------------------------------------ */
  /*  CrossProviderDetector.checkProvider                                */
  /* ------------------------------------------------------------------ */
  describe('checkProvider', () => {
    it('detects an outlier provider against the cohort', () => {
      const cohort = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.38],
        ['xoom', 18.41],
      ])

      const result = detector.checkProvider(
        'USA-US-MEX-MX',
        'western_union',
        19.50, // far from cohort
        cohort,
      )

      expect(result.detected).toBe(true)
      expect(result.direction).toBe('above')
      expect(result.madScore).toBeGreaterThan(3.0)
      expect(result.currentRate).toBe(19.50)
      expect(result.providerCount).toBe(5) // 4 cohort + 1 checked
    })

    it('returns non-anomalous result for a provider in line with cohort', () => {
      const cohort = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.38],
        ['xoom', 18.41],
      ])

      const result = detector.checkProvider(
        'USA-US-MEX-MX',
        'worldremit',
        18.39,
        cohort,
      )

      expect(result.detected).toBe(false)
      expect(result.providerCount).toBe(5)
    })

    it('handles provider already in the cohort (updates its rate)', () => {
      const cohort = new Map<string, number>([
        ['wise', 18.40],
        ['remitly', 18.42],
        ['ria', 18.38],
      ])

      // Check wise with a new rate that is an outlier
      const result = detector.checkProvider(
        'USA-US-MEX-MX',
        'wise',
        20.00, // new rate far from others
        cohort,
      )

      // The cohort should use the updated rate for wise (20.00), not the old one (18.40)
      expect(result.currentRate).toBe(20.00)
      expect(result.providerCount).toBe(3)
      expect(result.detected).toBe(true)
      expect(result.direction).toBe('above')
    })

    it('returns detected: false when cohort is too small', () => {
      const cohort = new Map<string, number>([
        ['wise', 18.40],
      ])

      const result = detector.checkProvider(
        'USA-US-MEX-MX',
        'remitly',
        19.50,
        cohort,
      )

      // 1 cohort + 1 checked = 2, still below minimum of 3
      expect(result.detected).toBe(false)
      expect(result.madScore).toBeNull()
      expect(result.providerCount).toBe(2)
    })

    it('works with an empty cohort', () => {
      const cohort = new Map<string, number>()

      const result = detector.checkProvider(
        'USA-US-MEX-MX',
        'wise',
        18.40,
        cohort,
      )

      expect(result.detected).toBe(false)
      expect(result.madScore).toBeNull()
      expect(result.providerCount).toBe(1)
    })
  })
})
