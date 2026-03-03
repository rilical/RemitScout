import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.signals.cross-provider-detector')

/**
 * Minimum number of providers required to compute a meaningful MAD score.
 * With fewer than 3 providers, cross-sectional comparison is unreliable.
 */
const MIN_PROVIDER_COUNT = 3

/**
 * Default MAD threshold for outlier detection.
 * A score of 3.0 means the provider's rate is 3 MADs from the median,
 * analogous to a 3-sigma threshold in Gaussian statistics.
 */
const DEFAULT_MAD_THRESHOLD = 3.0

/**
 * Normalization constant that makes MAD comparable to standard deviation
 * for normally distributed data. Equals 1 / Phi^{-1}(3/4) where Phi^{-1}
 * is the quantile function of the standard normal distribution.
 */
const MAD_NORMALIZATION_FACTOR = 1.4826

export type CrossProviderAnomalyResult = {
  detected: boolean
  madScore: number | null         // MAD-normalized score (like z-score but robust)
  direction: 'above' | 'below' | 'neutral' | null
  currentRate: number
  median: number | null
  mad: number | null
  providerCount: number
}

/**
 * Computes the median of a sorted array of numbers.
 *
 * For odd-length arrays, returns the middle element.
 * For even-length arrays, returns the average of the two middle elements.
 *
 * @param values - Array of numbers (a copy is sorted internally; original is not mutated)
 * @returns The median value
 * @throws If the array is empty
 */
export function computeMedian(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot compute median of empty array')
  }

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }

  return sorted[mid]!
}

/**
 * Computes the Median Absolute Deviation (MAD) of a set of values
 * around a given median.
 *
 * MAD = median(|x_i - median(X)|) for all x_i in X
 *
 * MAD is a robust measure of statistical dispersion that is more
 * resilient to outliers than standard deviation.
 *
 * @param values - Array of numbers
 * @param median - The precomputed median of the values
 * @returns The MAD value
 */
export function computeMAD(values: number[], median: number): number {
  if (values.length === 0) {
    return 0
  }

  const absoluteDeviations = values.map(v => Math.abs(v - median))
  return computeMedian(absoluteDeviations)
}

/**
 * Cross-provider anomaly detector using Median Absolute Deviation (MAD).
 *
 * Unlike the single-provider z-score detector (anomaly-detector.ts) which
 * compares a provider against its own historical baseline, this detector
 * compares each provider against ALL other providers for the same corridor
 * at the same point in time.
 *
 * This is useful for detecting:
 * - Stale/cached rates that haven't updated with market moves
 * - Data quality issues where one provider reports an incorrect rate
 * - Legitimate price advantages that may indicate arbitrage opportunities
 *
 * **Why MAD instead of Z-score?**
 * MAD is a robust statistic — it is not influenced by the very outliers
 * we're trying to detect. A single extreme rate cannot inflate the MAD
 * the way it inflates standard deviation, making detection more reliable.
 */
export class CrossProviderDetector {
  /**
   * Detect outlier providers given a map of provider rates for a corridor.
   *
   * For each provider, computes a MAD-normalized anomaly score and flags
   * those exceeding the threshold.
   *
   * @param corridorId - Corridor identifier (e.g., "USA-US-MEX-MX")
   * @param rates - Map of providerId to current implied FX rate
   * @param threshold - MAD threshold for outlier detection (default: 3.0)
   * @returns Map of providerId to anomaly result
   */
  detectOutliers(
    corridorId: string,
    rates: Map<string, number>,
    threshold: number = DEFAULT_MAD_THRESHOLD,
  ): Map<string, CrossProviderAnomalyResult> {
    const results = new Map<string, CrossProviderAnomalyResult>()

    if (rates.size === 0) {
      return results
    }

    const rateValues = [...rates.values()]
    const providerCount = rateValues.length

    // Insufficient providers for meaningful cross-sectional analysis
    if (providerCount < MIN_PROVIDER_COUNT) {
      for (const [providerId, rate] of rates) {
        results.set(providerId, {
          detected: false,
          madScore: null,
          direction: null,
          currentRate: rate,
          median: null,
          mad: null,
          providerCount,
        })
      }
      return results
    }

    const median = computeMedian(rateValues)
    const mad = computeMAD(rateValues, median)

    for (const [providerId, rate] of rates) {
      const result = this.computeResult(
        corridorId,
        providerId,
        rate,
        median,
        mad,
        providerCount,
        threshold,
      )
      results.set(providerId, result)
    }

    return results
  }

  /**
   * Check a single provider's rate against a cohort of current provider rates.
   *
   * This is useful when evaluating a newly-arrived quote against the current
   * market snapshot without recomputing scores for all providers.
   *
   * @param corridorId - Corridor identifier
   * @param providerId - Provider to check
   * @param currentRate - The provider's current rate
   * @param allRates - Map of all provider rates (may or may not include this provider)
   * @returns Anomaly result for the specified provider
   */
  checkProvider(
    corridorId: string,
    providerId: string,
    currentRate: number,
    allRates: Map<string, number>,
    threshold: number = DEFAULT_MAD_THRESHOLD,
  ): CrossProviderAnomalyResult {
    // Build a complete rate set including the provider being checked
    const completeRates = new Map(allRates)
    completeRates.set(providerId, currentRate)

    const rateValues = [...completeRates.values()]
    const providerCount = rateValues.length

    if (providerCount < MIN_PROVIDER_COUNT) {
      return {
        detected: false,
        madScore: null,
        direction: null,
        currentRate,
        median: null,
        mad: null,
        providerCount,
      }
    }

    const median = computeMedian(rateValues)
    const mad = computeMAD(rateValues, median)

    return this.computeResult(
      corridorId,
      providerId,
      currentRate,
      median,
      mad,
      providerCount,
      threshold,
    )
  }

  /**
   * Compute the anomaly result for a single provider given precomputed statistics.
   */
  private computeResult(
    corridorId: string,
    providerId: string,
    rate: number,
    median: number,
    mad: number,
    providerCount: number,
    threshold: number,
  ): CrossProviderAnomalyResult {
    // MAD = 0 means all providers report the same (or nearly the same) rate.
    // Division by zero would produce Infinity, so we treat this as no anomaly.
    if (mad === 0) {
      const deviation = Math.abs(rate - median)
      // If MAD is 0 but this provider differs from the median, it IS an outlier
      // (all others agree, this one doesn't). Use a sentinel score.
      if (deviation > 0) {
        const direction: 'above' | 'below' = rate > median ? 'above' : 'below'
        logger.warn('cross_provider_anomaly_detected_mad_zero', {
          corridor_id: corridorId,
          provider_id: providerId,
          direction,
          current_rate: rate,
          median,
          mad: 0,
          provider_count: providerCount,
        })
        return {
          detected: true,
          madScore: Infinity,
          direction,
          currentRate: rate,
          median,
          mad: 0,
          providerCount,
        }
      }

      return {
        detected: false,
        madScore: 0,
        direction: 'neutral',
        currentRate: rate,
        median,
        mad: 0,
        providerCount,
      }
    }

    const normalizedMad = MAD_NORMALIZATION_FACTOR * mad
    const madScore = Math.abs(rate - median) / normalizedMad

    const detected = madScore > threshold

    const diff = rate - median
    const direction: 'above' | 'below' | 'neutral' =
      diff > 0 ? 'above' : diff < 0 ? 'below' : 'neutral'

    if (detected) {
      logger.warn('cross_provider_anomaly_detected', {
        corridor_id: corridorId,
        provider_id: providerId,
        mad_score: madScore,
        direction,
        current_rate: rate,
        median,
        mad,
        normalized_mad: normalizedMad,
        provider_count: providerCount,
        threshold,
      })
    }

    return {
      detected,
      madScore,
      direction,
      currentRate: rate,
      median,
      mad,
      providerCount,
    }
  }
}
