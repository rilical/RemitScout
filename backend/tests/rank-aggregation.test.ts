import { describe, it, expect, vi } from 'vitest'

// Mock logger before importing the module under test
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { RankAggregator } from '../plane-b/src/triangulation/rank-aggregation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const aggregator = new RankAggregator()

// ---------------------------------------------------------------------------
// rankWithinDimension
// ---------------------------------------------------------------------------

describe('rankWithinDimension', () => {
  it('ranks corridors by raw score ascending (higher score = higher percentile)', () => {
    const scores = new Map([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ])
    const result = aggregator.rankWithinDimension(scores)

    expect(result.get('A')).toBe(0)    // lowest -> percentile 0
    expect(result.get('B')).toBe(50)   // middle -> percentile 50
    expect(result.get('C')).toBe(100)  // highest -> percentile 100
  })

  it('handles tied values by assigning average rank', () => {
    const scores = new Map([
      ['A', 10],
      ['B', 10],
      ['C', 30],
    ])
    const result = aggregator.rankWithinDimension(scores)

    // A and B are tied at the lowest. Ranks 1 and 2, avg = 1.5
    // percentile = ((1.5 - 1) / (3 - 1)) * 100 = 25
    expect(result.get('A')).toBe(25)
    expect(result.get('B')).toBe(25)
    // C is the highest, rank 3
    // percentile = ((3 - 1) / (3 - 1)) * 100 = 100
    expect(result.get('C')).toBe(100)
  })

  it('returns percentile 100 for a single corridor', () => {
    const scores = new Map([['A', 42]])
    const result = aggregator.rankWithinDimension(scores)
    expect(result.get('A')).toBe(100)
  })

  it('returns empty map for empty input', () => {
    const scores = new Map<string, number>()
    const result = aggregator.rankWithinDimension(scores)
    expect(result.size).toBe(0)
  })

  it('handles reversed input (descending raw scores)', () => {
    const scores = new Map([
      ['A', 30],
      ['B', 20],
      ['C', 10],
    ])
    const result = aggregator.rankWithinDimension(scores)

    expect(result.get('C')).toBe(0)    // lowest raw score
    expect(result.get('B')).toBe(50)   // middle
    expect(result.get('A')).toBe(100)  // highest raw score
  })

  it('handles all tied values', () => {
    const scores = new Map([
      ['A', 5],
      ['B', 5],
      ['C', 5],
    ])
    const result = aggregator.rankWithinDimension(scores)

    // All tied: avg rank = (1+2+3)/3 = 2, percentile = ((2-1)/(3-1))*100 = 50
    expect(result.get('A')).toBe(50)
    expect(result.get('B')).toBe(50)
    expect(result.get('C')).toBe(50)
  })

  it('handles two corridors', () => {
    const scores = new Map([
      ['A', 1],
      ['B', 2],
    ])
    const result = aggregator.rankWithinDimension(scores)

    expect(result.get('A')).toBe(0)
    expect(result.get('B')).toBe(100)
  })

  it('handles negative scores correctly', () => {
    const scores = new Map([
      ['A', -10],
      ['B', 0],
      ['C', 10],
    ])
    const result = aggregator.rankWithinDimension(scores)

    expect(result.get('A')).toBe(0)
    expect(result.get('B')).toBe(50)
    expect(result.get('C')).toBe(100)
  })

  it('handles large number of corridors', () => {
    const scores = new Map<string, number>()
    for (let i = 0; i < 100; i++) {
      scores.set(`corridor-${i}`, i)
    }
    const result = aggregator.rankWithinDimension(scores)

    // Lowest should be 0, highest should be 100
    expect(result.get('corridor-0')).toBeCloseTo(0, 5)
    expect(result.get('corridor-99')).toBeCloseTo(100, 5)
    // Middle should be approximately 50
    expect(result.get('corridor-50')).toBeCloseTo(50.505, 1)
  })
})

// ---------------------------------------------------------------------------
// Scale invariance
// ---------------------------------------------------------------------------

describe('scale invariance', () => {
  it('produces the same ranks when all values are multiplied by a constant', () => {
    const original = new Map([
      ['A', 0.95],
      ['B', 1.0],
      ['C', 1.05],
    ])
    const scaled = new Map([
      ['A', 950],
      ['B', 1000],
      ['C', 1050],
    ])

    const ranksOriginal = aggregator.rankWithinDimension(original)
    const ranksScaled = aggregator.rankWithinDimension(scaled)

    expect(ranksOriginal.get('A')).toBe(ranksScaled.get('A'))
    expect(ranksOriginal.get('B')).toBe(ranksScaled.get('B'))
    expect(ranksOriginal.get('C')).toBe(ranksScaled.get('C'))
  })

  it('produces the same ranks when all values are shifted by a constant', () => {
    const original = new Map([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ])
    const shifted = new Map([
      ['A', 1010],
      ['B', 1020],
      ['C', 1030],
    ])

    const ranksOriginal = aggregator.rankWithinDimension(original)
    const ranksShifted = aggregator.rankWithinDimension(shifted)

    expect(ranksOriginal.get('A')).toBe(ranksShifted.get('A'))
    expect(ranksOriginal.get('B')).toBe(ranksShifted.get('B'))
    expect(ranksOriginal.get('C')).toBe(ranksShifted.get('C'))
  })
})

// ---------------------------------------------------------------------------
// Heterogeneous scale aggregation
// ---------------------------------------------------------------------------

describe('heterogeneous scale aggregation', () => {
  it('produces meaningful composites from TEER [0.9-1.1] and geopolitical risk [0-100]', () => {
    const teerScores = new Map([
      ['US-MX', 0.98],  // good
      ['US-IN', 1.05],  // best
      ['US-NG', 0.92],  // worst
    ])
    const geoRisk = new Map([
      ['US-MX', 30],    // low risk (good)
      ['US-IN', 50],    // medium risk
      ['US-NG', 80],    // high risk (bad... but high numeric value)
    ])

    const dimensionScores = new Map([
      ['teer', teerScores],
      ['geo_risk', geoRisk],
    ])
    const weights = new Map([
      ['teer', 0.6],
      ['geo_risk', 0.4],
    ])

    const result = aggregator.aggregate(dimensionScores, weights)

    // All three corridors get a score
    expect(result.size).toBe(3)

    // Each score is in [0, 100]
    for (const score of result.values()) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }

    // US-IN has best TEER (rank 100) but medium geo_risk (rank 50)
    // US-MX has middle TEER (rank 50) but lowest geo_risk (rank 0)
    // US-NG has worst TEER (rank 0) but highest geo_risk (rank 100)
    // Note: higher geo_risk value = higher percentile, which may or may
    // not be desirable — the caller controls inversion if needed
    const usIn = result.get('US-IN')!
    const usMx = result.get('US-MX')!
    const usNg = result.get('US-NG')!

    // US-IN: 100*0.6 + 50*0.4 = 80
    expect(usIn).toBeCloseTo(80, 5)
    // US-MX: 50*0.6 + 0*0.4 = 30
    expect(usMx).toBeCloseTo(30, 5)
    // US-NG: 0*0.6 + 100*0.4 = 40
    expect(usNg).toBeCloseTo(40, 5)
  })

  it('handles TEER values multiplied by 1000 identically to original', () => {
    const teerOriginal = new Map([
      ['A', 0.95],
      ['B', 1.0],
      ['C', 1.05],
    ])
    const teerScaled = new Map([
      ['A', 950],
      ['B', 1000],
      ['C', 1050],
    ])
    const otherDim = new Map([
      ['A', 50],
      ['B', 30],
      ['C', 70],
    ])

    const weights = new Map([
      ['teer', 0.5],
      ['other', 0.5],
    ])

    const resultOriginal = aggregator.aggregate(
      new Map([['teer', teerOriginal], ['other', otherDim]]),
      weights,
    )
    const resultScaled = aggregator.aggregate(
      new Map([['teer', teerScaled], ['other', otherDim]]),
      weights,
    )

    expect(resultOriginal.get('A')).toBeCloseTo(resultScaled.get('A')!, 5)
    expect(resultOriginal.get('B')).toBeCloseTo(resultScaled.get('B')!, 5)
    expect(resultOriginal.get('C')).toBeCloseTo(resultScaled.get('C')!, 5)
  })
})

// ---------------------------------------------------------------------------
// aggregate
// ---------------------------------------------------------------------------

describe('aggregate', () => {
  it('aggregates a single dimension (result equals percentile ranks)', () => {
    const dim = new Map([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ])
    const dimensionScores = new Map([['dim1', dim]])
    const weights = new Map([['dim1', 1.0]])

    const result = aggregator.aggregate(dimensionScores, weights)

    expect(result.get('A')).toBe(0)
    expect(result.get('B')).toBe(50)
    expect(result.get('C')).toBe(100)
  })

  it('aggregates multiple dimensions with equal weights', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ])
    const dim2 = new Map([
      ['A', 30],
      ['B', 20],
      ['C', 10],
    ])
    const dimensionScores = new Map([
      ['dim1', dim1],
      ['dim2', dim2],
    ])
    const weights = new Map([
      ['dim1', 1.0],
      ['dim2', 1.0],
    ])

    const result = aggregator.aggregate(dimensionScores, weights)

    // dim1: A=0, B=50, C=100
    // dim2: A=100, B=50, C=0
    // avg: A=50, B=50, C=50
    expect(result.get('A')).toBeCloseTo(50, 5)
    expect(result.get('B')).toBeCloseTo(50, 5)
    expect(result.get('C')).toBeCloseTo(50, 5)
  })

  it('respects unequal weights', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
    ])
    const dim2 = new Map([
      ['A', 20],
      ['B', 10],
    ])
    const dimensionScores = new Map([
      ['dim1', dim1],
      ['dim2', dim2],
    ])
    const weights = new Map([
      ['dim1', 3.0],
      ['dim2', 1.0],
    ])

    const result = aggregator.aggregate(dimensionScores, weights)

    // dim1: A=0, B=100
    // dim2: A=100, B=0
    // weighted: A = (0*3 + 100*1)/4 = 25, B = (100*3 + 0*1)/4 = 75
    expect(result.get('A')).toBeCloseTo(25, 5)
    expect(result.get('B')).toBeCloseTo(75, 5)
  })

  it('handles corridors missing from some dimensions (median imputation)', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ])
    // dim2 is missing corridor C
    const dim2 = new Map([
      ['A', 30],
      ['B', 10],
    ])
    const dimensionScores = new Map([
      ['dim1', dim1],
      ['dim2', dim2],
    ])
    const weights = new Map([
      ['dim1', 1.0],
      ['dim2', 1.0],
    ])

    const result = aggregator.aggregate(dimensionScores, weights)

    // dim1: A=0, B=50, C=100
    // dim2: A=100, B=0 (only 2 items). Median percentile = (0+100)/2 = 50
    // C is missing from dim2, imputed with median = 50
    // A: (0+100)/2 = 50
    // B: (50+0)/2 = 25
    // C: (100+50)/2 = 75
    expect(result.get('A')).toBeCloseTo(50, 5)
    expect(result.get('B')).toBeCloseTo(25, 5)
    expect(result.get('C')).toBeCloseTo(75, 5)
  })

  it('returns 50 for all corridors when all weights are zero', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
    ])
    const dimensionScores = new Map([['dim1', dim1]])
    const weights = new Map([['dim1', 0]])

    const result = aggregator.aggregate(dimensionScores, weights)

    expect(result.get('A')).toBe(50)
    expect(result.get('B')).toBe(50)
  })

  it('returns empty map for empty dimension scores', () => {
    const dimensionScores = new Map<string, Map<string, number>>()
    const weights = new Map<string, number>()

    const result = aggregator.aggregate(dimensionScores, weights)
    expect(result.size).toBe(0)
  })

  it('ignores empty dimensions', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
    ])
    const dim2 = new Map<string, number>() // empty
    const dimensionScores = new Map([
      ['dim1', dim1],
      ['dim2', dim2],
    ])
    const weights = new Map([
      ['dim1', 1.0],
      ['dim2', 1.0],
    ])

    const result = aggregator.aggregate(dimensionScores, weights)

    // Only dim1 contributes
    expect(result.get('A')).toBe(0)
    expect(result.get('B')).toBe(100)
  })

  it('ignores dimensions with negative weights', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
    ])
    const dim2 = new Map([
      ['A', 20],
      ['B', 10],
    ])
    const dimensionScores = new Map([
      ['dim1', dim1],
      ['dim2', dim2],
    ])
    const weights = new Map([
      ['dim1', 1.0],
      ['dim2', -1.0],
    ])

    const result = aggregator.aggregate(dimensionScores, weights)

    // Only dim1 contributes (dim2 has negative weight)
    expect(result.get('A')).toBe(0)
    expect(result.get('B')).toBe(100)
  })

  it('handles dimension with no matching weight key', () => {
    const dim1 = new Map([
      ['A', 10],
      ['B', 20],
    ])
    const dimensionScores = new Map([['dim1', dim1]])
    const weights = new Map([['dim_other', 1.0]]) // no 'dim1' key

    const result = aggregator.aggregate(dimensionScores, weights)

    // dim1 has no weight (defaults to 0) -> all corridors get 50
    expect(result.get('A')).toBe(50)
    expect(result.get('B')).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// imputeMissing
// ---------------------------------------------------------------------------

describe('imputeMissing', () => {
  it('returns all values unchanged when none are null', () => {
    const scores = new Map<string, number | null>([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ])
    const result = aggregator.imputeMissing(scores)

    expect(result.get('A')).toBe(10)
    expect(result.get('B')).toBe(20)
    expect(result.get('C')).toBe(30)
  })

  it('replaces null values with median of non-null values', () => {
    const scores = new Map<string, number | null>([
      ['A', 10],
      ['B', null],
      ['C', 30],
      ['D', 20],
    ])
    const result = aggregator.imputeMissing(scores)

    // Non-null values: [10, 30, 20]. Sorted: [10, 20, 30]. Median = 20
    expect(result.get('A')).toBe(10)
    expect(result.get('B')).toBe(20) // imputed
    expect(result.get('C')).toBe(30)
    expect(result.get('D')).toBe(20)
  })

  it('uses 50 as default when all values are null', () => {
    const scores = new Map<string, number | null>([
      ['A', null],
      ['B', null],
      ['C', null],
    ])
    const result = aggregator.imputeMissing(scores)

    expect(result.get('A')).toBe(50)
    expect(result.get('B')).toBe(50)
    expect(result.get('C')).toBe(50)
  })

  it('handles single non-null value', () => {
    const scores = new Map<string, number | null>([
      ['A', null],
      ['B', 42],
      ['C', null],
    ])
    const result = aggregator.imputeMissing(scores)

    expect(result.get('A')).toBe(42) // imputed with sole non-null value
    expect(result.get('B')).toBe(42)
    expect(result.get('C')).toBe(42) // imputed with sole non-null value
  })

  it('returns empty map for empty input', () => {
    const scores = new Map<string, number | null>()
    const result = aggregator.imputeMissing(scores)
    expect(result.size).toBe(0)
  })

  it('computes correct median for even-length non-null values', () => {
    const scores = new Map<string, number | null>([
      ['A', 10],
      ['B', null],
      ['C', 20],
      ['D', 30],
      ['E', 40],
    ])
    const result = aggregator.imputeMissing(scores)

    // Non-null: [10, 20, 30, 40]. Sorted: [10, 20, 30, 40]. Median = (20+30)/2 = 25
    expect(result.get('B')).toBe(25)
  })

  it('handles multiple null values', () => {
    const scores = new Map<string, number | null>([
      ['A', null],
      ['B', 10],
      ['C', null],
      ['D', 30],
    ])
    const result = aggregator.imputeMissing(scores)

    // Non-null: [10, 30]. Median = (10+30)/2 = 20
    expect(result.get('A')).toBe(20)
    expect(result.get('C')).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// Integration: end-to-end aggregation with imputation
// ---------------------------------------------------------------------------

describe('integration', () => {
  it('new RankAggregator instances work independently', () => {
    const agg1 = new RankAggregator()
    const agg2 = new RankAggregator()

    const scores = new Map([['A', 10], ['B', 20]])
    const result1 = agg1.rankWithinDimension(scores)
    const result2 = agg2.rankWithinDimension(scores)

    expect(result1.get('A')).toBe(result2.get('A'))
    expect(result1.get('B')).toBe(result2.get('B'))
  })

  it('full pipeline: impute -> rank -> aggregate', () => {
    const agg = new RankAggregator()

    // Dimension 1: some missing data
    const raw1 = new Map<string, number | null>([
      ['A', 100],
      ['B', null],
      ['C', 300],
    ])
    const imputed1 = agg.imputeMissing(raw1)

    // Dimension 2: complete data
    const dim2 = new Map([
      ['A', 5],
      ['B', 15],
      ['C', 10],
    ])

    const dimensionScores = new Map([
      ['dim1', imputed1],
      ['dim2', dim2],
    ])
    const weights = new Map([
      ['dim1', 1.0],
      ['dim2', 1.0],
    ])

    const result = agg.aggregate(dimensionScores, weights)

    // imputed1: A=100, B=200 (median of [100,300]), C=300
    // dim1 ranks: A=0, B=50, C=100
    // dim2 ranks: A=0, B=100, C=50
    // composite: A=(0+0)/2=0, B=(50+100)/2=75, C=(100+50)/2=75
    expect(result.get('A')).toBeCloseTo(0, 5)
    expect(result.get('B')).toBeCloseTo(75, 5)
    expect(result.get('C')).toBeCloseTo(75, 5)
  })
})
