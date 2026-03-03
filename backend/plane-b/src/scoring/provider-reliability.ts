import { createLogger } from '../../../shared/logger'
import { GLOBAL_WEIGHT_CORRIDOR_ID } from '../../../shared/weighting-model'

const logger = createLogger('plane-b.scoring.provider-reliability')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Operational data for a single provider-corridor pair, sourced from
 * silver.ingestion_run, silver.observation, silver.failure_bundle,
 * and silver.module_registry by the calling job/service.
 *
 * The scorer itself never touches the DB — it receives pre-queried data.
 */
export type ProviderOperationalData = {
  /** Provider identifier (e.g. "wise") */
  providerId: string
  /** Corridor identifier (e.g. "USA-US-MEX-MX"). Null for global scores. */
  corridorId: string | null

  // --- Success-rate inputs (from silver.ingestion_run) ---
  /** Number of successful ingestion runs in the lookback window */
  successCount: number
  /** Total ingestion runs (success + failed + blocked) in the lookback window */
  totalCount: number

  // --- Freshness inputs (from silver.observation / silver.module_registry) ---
  /** Seconds since the most recent observation for this provider-corridor */
  lastObservationAgeSeconds: number

  // --- Consistency inputs (derived from silver.observation rates) ---
  /** Standard deviation of observed rates within the lookback window */
  rateStddev: number
  /** Median observed rate within the lookback window */
  medianRate: number

  // --- Repair-speed inputs (from silver.failure_bundle) ---
  /** Mean time to repair in seconds (avg time from first_failure_at to repair_outcome = 'applied') */
  avgMttrSeconds: number
}

/**
 * Breakdown of a provider-corridor reliability score.
 */
export type ReliabilityScore = {
  /** Composite reliability score in [0, 1] */
  overall: number

  /** Component scores, each in [0, 1] */
  components: {
    successRate: number
    freshness: number
    consistency: number
    repairSpeed: number
  }

  /** Provider and corridor this score applies to */
  providerId: string
  corridorId: string | null
}

/**
 * Configurable weights and thresholds for the reliability computation.
 * All weights must sum to 1.0.
 */
export type ReliabilityConfig = {
  /** Weight for the success-rate component (default: 0.4) */
  successRateWeight: number
  /** Weight for the freshness component (default: 0.3) */
  freshnessWeight: number
  /** Weight for the consistency component (default: 0.2) */
  consistencyWeight: number
  /** Weight for the repair-speed component (default: 0.1) */
  repairSpeedWeight: number

  /**
   * Maximum acceptable observation age in seconds.
   * Beyond this age, the freshness score is 0.
   * Default: 3600 (1 hour)
   */
  maxAcceptableAgeSeconds: number

  /**
   * Maximum acceptable mean-time-to-repair in seconds.
   * Beyond this MTTR, the repair-speed score is 0.
   * Default: 7200 (2 hours)
   */
  maxAcceptableMttrSeconds: number

  /**
   * Coefficient of variation threshold above which consistency decays to 0.
   * Default: 0.1 (10% CV)
   */
  maxAcceptableCv: number

  /**
   * Floor multiplier — reliability will never reduce a weight below
   * this fraction of its accuracy-based value. Prevents a temporarily-
   * unreliable provider from being zeroed out entirely.
   * Default: 0.1
   */
  reliabilityFloor: number
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_RELIABILITY_CONFIG: ReliabilityConfig = {
  successRateWeight: 0.4,
  freshnessWeight: 0.3,
  consistencyWeight: 0.2,
  repairSpeedWeight: 0.1,
  maxAcceptableAgeSeconds: 3600,
  maxAcceptableMttrSeconds: 7200,
  maxAcceptableCv: 0.1,
  reliabilityFloor: 0.1,
}

// ---------------------------------------------------------------------------
// Component score functions (all pure, all return values in [0, 1])
// ---------------------------------------------------------------------------

/**
 * Success rate: ratio of successful runs to total runs.
 *
 * Returns 1.0 when all runs succeed, 0.0 when all fail.
 * Returns 0.0 when there are no runs (no data = no trust).
 */
export function computeSuccessRate(successCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  if (successCount < 0) return 0
  return Math.min(1, successCount / totalCount)
}

/**
 * Freshness score: linear decay from 1.0 (just observed) to 0.0 (stale).
 *
 * Simple and predictable: score = 1 - (age / maxAge).
 *
 * - age = 0       -> 1.0
 * - age = maxAge/2 -> 0.5
 * - age >= maxAge  -> 0.0
 */
export function computeFreshnessScore(
  lastObservationAgeSeconds: number,
  maxAcceptableAgeSeconds: number,
): number {
  if (maxAcceptableAgeSeconds <= 0) return 0
  if (lastObservationAgeSeconds <= 0) return 1.0

  if (lastObservationAgeSeconds >= maxAcceptableAgeSeconds) return 0

  // Linear decay: simple and predictable. 1.0 at age=0, 0.0 at age=max.
  return 1.0 - lastObservationAgeSeconds / maxAcceptableAgeSeconds
}

/**
 * Consistency score: based on the coefficient of variation (CV = stddev / median).
 *
 * A low CV means the provider's rates are stable relative to the median.
 * Score decays linearly from 1.0 (CV = 0, perfectly consistent) to 0.0 (CV >= maxCv).
 *
 * Edge cases:
 * - medianRate = 0 or stddev = 0 -> CV = 0, score = 1.0 (no variance detected)
 * - negative medianRate -> uses absolute value
 */
export function computeConsistencyScore(
  rateStddev: number,
  medianRate: number,
  maxAcceptableCv: number = DEFAULT_RELIABILITY_CONFIG.maxAcceptableCv,
): number {
  if (maxAcceptableCv <= 0) return 0
  if (rateStddev <= 0) return 1.0

  const absMedian = Math.abs(medianRate)
  if (absMedian === 0) return 1.0

  const cv = rateStddev / absMedian
  if (cv >= maxAcceptableCv) return 0

  return 1.0 - cv / maxAcceptableCv
}

/**
 * Repair speed score: rewards providers whose failure bundles are resolved quickly.
 *
 * Linear decay from 1.0 (instant repair, MTTR = 0) to 0.0 (MTTR >= max).
 *
 * When no repairs have been attempted, the provider has never failed —
 * this is a positive signal, so we return 1.0.
 */
export function computeRepairSpeedScore(
  avgMttrSeconds: number,
  maxAcceptableMttrSeconds: number,
): number {
  if (maxAcceptableMttrSeconds <= 0) return 0

  // No failures ever = perfect repair speed (never needed one)
  if (avgMttrSeconds <= 0) return 1.0

  if (avgMttrSeconds >= maxAcceptableMttrSeconds) return 0

  return 1.0 - avgMttrSeconds / maxAcceptableMttrSeconds
}

// ---------------------------------------------------------------------------
// ProviderReliabilityScorer
// ---------------------------------------------------------------------------

/**
 * Computes rolling reliability scores for providers from operational data.
 *
 * The reliability score is a weighted composite of four components:
 *   reliability = success_rate * 0.4 + freshness * 0.3 + consistency * 0.2 + repair_speed * 0.1
 *
 * This class performs pure computation — no DB access. The caller is responsible
 * for querying silver.ingestion_run, silver.observation, silver.failure_bundle,
 * and silver.module_registry, then passing the results as ProviderOperationalData.
 *
 * The reliability score feeds into the existing dynamic weighting pipeline
 * (provider-weighting-job.ts) as a multiplier on accuracy-based weights.
 */
export class ProviderReliabilityScorer {
  private readonly config: ReliabilityConfig

  constructor(config: Partial<ReliabilityConfig> = {}) {
    this.config = { ...DEFAULT_RELIABILITY_CONFIG, ...config }

    const weightSum =
      this.config.successRateWeight +
      this.config.freshnessWeight +
      this.config.consistencyWeight +
      this.config.repairSpeedWeight

    if (Math.abs(weightSum - 1.0) > 1e-6) {
      throw new Error(
        `Reliability config weights must sum to 1.0, got ${weightSum}`,
      )
    }
  }

  /**
   * Compute reliability for a single provider-corridor pair.
   *
   * All component scores are clamped to [0, 1], and the composite is a
   * weighted sum of the components.
   */
  computeReliability(data: ProviderOperationalData): ReliabilityScore {
    const successRate = computeSuccessRate(data.successCount, data.totalCount)
    const freshness = computeFreshnessScore(
      data.lastObservationAgeSeconds,
      this.config.maxAcceptableAgeSeconds,
    )
    const consistency = computeConsistencyScore(
      data.rateStddev,
      data.medianRate,
      this.config.maxAcceptableCv,
    )
    const repairSpeed = computeRepairSpeedScore(
      data.avgMttrSeconds,
      this.config.maxAcceptableMttrSeconds,
    )

    const overall =
      successRate * this.config.successRateWeight +
      freshness * this.config.freshnessWeight +
      consistency * this.config.consistencyWeight +
      repairSpeed * this.config.repairSpeedWeight

    logger.debug('reliability_computed', {
      provider_id: data.providerId,
      corridor_id: data.corridorId,
      overall,
      success_rate: successRate,
      freshness,
      consistency,
      repair_speed: repairSpeed,
    })

    return {
      overall,
      components: {
        successRate,
        freshness,
        consistency,
        repairSpeed,
      },
      providerId: data.providerId,
      corridorId: data.corridorId,
    }
  }

  /**
   * Bulk compute reliability for multiple provider-corridor pairs.
   *
   * Returns a nested map: providerId -> corridorId -> ReliabilityScore.
   */
  computeAll(
    dataPoints: ProviderOperationalData[],
  ): Map<string, Map<string, ReliabilityScore>> {
    const result = new Map<string, Map<string, ReliabilityScore>>()

    for (const data of dataPoints) {
      const score = this.computeReliability(data)
      let providerMap = result.get(data.providerId)
      if (!providerMap) {
        providerMap = new Map<string, ReliabilityScore>()
        result.set(data.providerId, providerMap)
      }
      providerMap.set(data.corridorId ?? GLOBAL_WEIGHT_CORRIDOR_ID, score)
    }

    logger.info('reliability_bulk_computed', {
      providers: result.size,
      total_scores: dataPoints.length,
    })

    return result
  }

  /**
   * Adjust accuracy-based weights using reliability scores as a multiplier.
   *
   * For each provider:
   *   adjusted_raw = accuracy_weight * (floor + (1 - floor) * reliability)
   *
   * Then all weights are renormalized to sum to 1.0.
   *
   * The floor ensures that even a provider with 0 reliability retains
   * a minimum fraction of its accuracy weight, preventing total dropout.
   *
   * @param accuracyWeights  Map of providerId -> accuracy-based weight (sum = 1.0)
   * @param reliabilityScores  Map of providerId -> reliability score [0, 1]
   * @returns Map of providerId -> adjusted weight (sum = 1.0)
   */
  adjustWeights(
    accuracyWeights: Map<string, number>,
    reliabilityScores: Map<string, number>,
  ): Map<string, number> {
    const floor = this.config.reliabilityFloor
    const adjusted = new Map<string, number>()
    let total = 0

    for (const [providerId, accuracyWeight] of accuracyWeights) {
      const reliability = reliabilityScores.get(providerId) ?? 1.0
      // Apply reliability as a multiplier with a floor
      const multiplier = floor + (1 - floor) * reliability
      const adjustedRaw = accuracyWeight * multiplier
      adjusted.set(providerId, adjustedRaw)
      total += adjustedRaw
    }

    // Renormalize so weights sum to 1.0
    if (total > 0) {
      for (const [providerId, weight] of adjusted) {
        adjusted.set(providerId, weight / total)
      }
    } else {
      // Fallback: equal weights if total is 0
      const equalWeight = accuracyWeights.size > 0 ? 1 / accuracyWeights.size : 0
      for (const providerId of accuracyWeights.keys()) {
        adjusted.set(providerId, equalWeight)
      }
    }

    logger.debug('weights_adjusted_by_reliability', {
      provider_count: adjusted.size,
      floor,
    })

    return adjusted
  }
}
