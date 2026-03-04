import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.triangulation.rank-aggregation')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of ranking corridors within a single dimension.
 * Keys are corridor IDs, values are percentiles in [0, 100].
 */
export type RankResult = Map<string, number>

/**
 * Result of aggregating multiple ranked dimensions into a composite score.
 * Keys are corridor IDs, values are composite percentiles in [0, 100].
 */
export type AggregationResult = Map<string, number>

// ---------------------------------------------------------------------------
// RankAggregator
// ---------------------------------------------------------------------------

/**
 * Rank-based aggregation for heterogeneous scoring dimensions.
 *
 * When combining data from sources on completely different scales (e.g.,
 * TEER at 0.9-1.1 vs geopolitical risk at 0-100), raw weighted averages
 * are meaningless. Rank aggregation solves this:
 *
 * 1. Convert raw scores to percentile ranks within each dimension (0-100)
 * 2. Compute weighted average of percentile ranks across dimensions
 *
 * This makes the composite score scale-agnostic: adding a new data source
 * with values in any range "just works" — it gets ranked against its peers
 * and contributes meaningfully to the composite.
 *
 * This class performs pure computation — no DB access. The caller is
 * responsible for querying dimension scores and passing them in.
 */
export class RankAggregator {
  /**
   * Rank corridors within a single dimension by converting raw scores
   * to percentiles (0-100).
   *
   * Higher raw score = higher percentile.
   *
   * Ties are handled by assigning the average rank of all tied positions.
   * For example, if two corridors share the lowest score, they each
   * receive the average of ranks 1 and 2 = 1.5, then that rank is
   * converted to a percentile.
   *
   * Percentile formula: ((rank - 1) / (n - 1)) * 100
   *   - The lowest-ranked corridor gets percentile 0
   *   - The highest-ranked corridor gets percentile 100
   *   - Single corridor -> percentile 50 (neutral; no peers to compare against)
   *   - Empty map -> empty result
   *
   * @param scores  Map of corridorId -> raw score
   * @returns Map of corridorId -> percentile in [0, 100]
   */
  rankWithinDimension(scores: Map<string, number>): RankResult {
    const result: RankResult = new Map()
    const n = scores.size

    if (n === 0) return result

    // Single corridor edge case: with no peers, percentile ranking is
    // meaningless. Return 50 (neutral midpoint) instead of 100 to avoid
    // inflating the composite score of corridors that happen to appear
    // alone in a dimension. A single corridor is neither "best" nor
    // "worst" — it simply has no ranking context.
    if (n === 1) {
      const [corridorId] = scores.entries().next().value as [string, number]
      result.set(corridorId, 50)
      logger.debug('rank_within_dimension', { corridors: 1, single: true, percentile: 50 })
      return result
    }

    // Sort corridors by raw score ascending (lower score = lower rank)
    const entries = [...scores.entries()].sort((a, b) => a[1] - b[1])

    // Assign ranks with tie-handling (average rank for tied values)
    const ranks = new Map<string, number>()
    let i = 0
    while (i < entries.length) {
      const currentValue = entries[i]![1]
      let j = i

      // Find all corridors with the same score
      while (j < entries.length && entries[j]![1] === currentValue) {
        j++
      }

      // Average rank for this group (1-based ranks)
      const avgRank = (i + 1 + j) / 2
      for (let k = i; k < j; k++) {
        ranks.set(entries[k]![0], avgRank)
      }
      i = j
    }

    // Convert ranks to percentiles: ((rank - 1) / (n - 1)) * 100
    for (const [corridorId, rank] of ranks) {
      const percentile = ((rank - 1) / (n - 1)) * 100
      result.set(corridorId, percentile)
    }

    logger.debug('rank_within_dimension', {
      corridors: n,
      unique_values: new Set(scores.values()).size,
    })

    return result
  }

  /**
   * Aggregate multiple dimensions into a composite score using weighted
   * percentile rank averaging.
   *
   * Steps:
   * 1. Rank each dimension independently using `rankWithinDimension`
   * 2. For corridors missing in a dimension, impute with the median
   *    percentile of that dimension's ranked corridors
   * 3. Compute weighted average of percentile ranks across dimensions
   *
   * @param dimensionScores  Map of dimensionId -> (corridorId -> rawScore)
   * @param weights          Map of dimensionId -> weight (non-negative)
   * @returns Map of corridorId -> composite score in [0, 100]
   */
  aggregate(
    dimensionScores: Map<string, Map<string, number>>,
    weights: Map<string, number>,
  ): AggregationResult {
    const result: AggregationResult = new Map()

    // Collect all corridor IDs across all dimensions
    const allCorridors = new Set<string>()
    for (const dimScores of dimensionScores.values()) {
      for (const corridorId of dimScores.keys()) {
        allCorridors.add(corridorId)
      }
    }

    if (allCorridors.size === 0) return result

    // Rank each dimension and compute median percentile for imputation
    const rankedDimensions = new Map<string, RankResult>()
    const dimensionMedians = new Map<string, number>()

    for (const [dimId, dimScores] of dimensionScores) {
      if (dimScores.size === 0) continue
      const ranked = this.rankWithinDimension(dimScores)
      rankedDimensions.set(dimId, ranked)
      dimensionMedians.set(dimId, this.computeMedianOfValues(ranked))
    }

    // Compute effective total weight (only dimensions with data contribute)
    let totalWeight = 0
    for (const [dimId, weight] of weights) {
      if (rankedDimensions.has(dimId) && weight > 0) {
        totalWeight += weight
      }
    }

    if (totalWeight === 0) {
      // No dimensions with positive weight have data — return 50 for all
      for (const corridorId of allCorridors) {
        result.set(corridorId, 50)
      }
      logger.warn('aggregate_zero_total_weight', {
        corridors: allCorridors.size,
        dimensions: dimensionScores.size,
      })
      return result
    }

    // Weighted average of percentile ranks
    for (const corridorId of allCorridors) {
      let weightedSum = 0

      for (const [dimId, ranked] of rankedDimensions) {
        const weight = weights.get(dimId) ?? 0
        if (weight < 0) {
          logger.warn('aggregate_negative_weight_ignored', { dimId, weight })
          continue
        }
        if (weight === 0) continue

        const percentile = ranked.get(corridorId) ?? dimensionMedians.get(dimId) ?? 50
        weightedSum += percentile * weight
      }

      result.set(corridorId, weightedSum / totalWeight)
    }

    logger.info('aggregate_computed', {
      corridors: result.size,
      dimensions: rankedDimensions.size,
      total_weight: totalWeight,
    })

    return result
  }

  /**
   * Replace null values with the median of non-null values.
   *
   * Median imputation is conservative — it does not bias the missing value
   * toward the top or bottom of the distribution.
   *
   * Edge cases:
   * - No nulls: returns all values unchanged
   * - All nulls: returns all values as 50 (neutral default)
   * - Single non-null value: that value becomes the median for all nulls
   *
   * @param scores  Map of corridorId -> score (null for missing)
   * @returns Map of corridorId -> imputed score (no nulls)
   */
  imputeMissing(scores: Map<string, number | null>): Map<string, number> {
    const result = new Map<string, number>()

    // Collect non-null values
    const nonNullValues: number[] = []
    for (const value of scores.values()) {
      if (value !== null) {
        nonNullValues.push(value)
      }
    }

    // Compute median of non-null values, default to 50 if all null
    const median = nonNullValues.length > 0
      ? this.computeMedianOfArray(nonNullValues)
      : 50

    const nullCount = scores.size - nonNullValues.length
    if (nullCount > 0) {
      logger.debug('impute_missing', {
        total: scores.size,
        null_count: nullCount,
        imputed_value: median,
      })
    }

    for (const [corridorId, value] of scores) {
      result.set(corridorId, value !== null ? value : median)
    }

    return result
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Compute median of values in a Map<string, number>.
   */
  private computeMedianOfValues(map: Map<string, number>): number {
    const values = [...map.values()]
    return this.computeMedianOfArray(values)
  }

  /**
   * Compute median of a numeric array.
   * Returns 50 for empty arrays (neutral default).
   */
  private computeMedianOfArray(values: number[]): number {
    if (values.length === 0) return 50

    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1]! + sorted[mid]!) / 2
    }

    return sorted[mid]!
  }
}
