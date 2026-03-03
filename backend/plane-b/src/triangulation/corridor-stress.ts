import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { config } from '../../../shared/config'
import { sendJsonMessage } from '../../../shared/sqs'
import type { CorridorStressSignal } from '../agents/stress-responder'
import type { StressSignal, StressSignalType } from './engine'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { computeDecayedIntensity } from '../scoring/decay-functions'

const logger = createLogger('plane-b.triangulation.corridor-stress')

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (): Record<string, string> => ({
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  service: 'remit-scout',
})

/**
 * Corridor stress factors contributing to the stress score.
 */
export type StressFactor = {
  name: string
  value: number
  weight: number
  threshold: number
}

/**
 * Multi-signal stress result for a corridor.
 * Combines multiple StressSignal instances into a single composite assessment.
 */
export type MultiSignalStressResult = {
  corridorId: string
  compositeScore: number
  stressLevel: CorridorStressSignal['stressLevel']
  contributingSignals: Array<{
    signalType: StressSignalType
    intensity: number
    weight: number
    weightedContribution: number
  }>
  computedAt: string
}

/**
 * Corridor Stress Calculator — computes stress signals from index volatility and coverage metrics.
 *
 * Stress signals are produced from:
 * - TEER volatility (short-term vs. long-term moving average divergence)
 * - RCI spikes (rapid increase in rate competition index)
 * - Provider coverage drops (fewer providers than expected)
 * - Data freshness degradation (stale quotes)
 * - External factor signals (FX mid-market volatility)
 *
 * Multi-signal computation:
 * When multiple StressSignals are present for a corridor, the calculator
 * combines them using type-specific weights and produces a composite score
 * with hysteresis to prevent rapid state flapping.
 */
export class CorridorStressCalculator {
  private readonly pool: Pool

  // Weights for different stress signal types (higher = more impactful)
  private readonly signalTypeWeights: Record<StressSignalType, number> = {
    rate_deviation: 0.30,
    provider_dropout: 0.20,
    failure_surge: 0.15,
    rci_spike: 0.12,
    freshness_breach: 0.10,
    volume_drop: 0.05,
    volume_spike: 0.04,
    external_fx: 0.04,
  }

  // Hysteresis state: tracks last-known stress level per corridor
  private readonly hysteresisState = new Map<string, {
    level: CorridorStressSignal['stressLevel']
    score: number
    since: number
  }>()

  // Hysteresis thresholds — to escalate you must exceed the threshold,
  // but to de-escalate you must drop further below (deadband).
  private readonly escalateThresholds = { elevated: 0.30, high: 0.60, critical: 0.80 }
  private readonly deescalateThresholds = { calm: 0.20, elevated: 0.45, high: 0.70 }

  // Minimum dwell time (ms) in a level before a de-escalation is allowed
  private readonly minDwellMs = 120_000 // 2 minutes

  constructor(pool: Pool) {
    this.pool = pool
  }

  // ---------------------------------------------------------------------------
  // Multi-signal stress computation
  // ---------------------------------------------------------------------------

  /**
   * Compute a composite stress assessment from multiple StressSignal instances
   * for a single corridor. Applies type-specific weights and hysteresis.
   */
  computeMultiSignalStress(corridorId: string, signals: StressSignal[]): MultiSignalStressResult {
    const now = Date.now()
    const contributions: MultiSignalStressResult['contributingSignals'] = []

    let weightedSum = 0
    let totalWeight = 0

    for (const signal of signals) {
      // TTL is a hard ceiling: signals past their TTL are fully removed regardless
      // of decay state.  Within the TTL window, exponential decay (below) gradually
      // diminishes the signal's intensity based on its type-specific half-life.
      const expiresAt = new Date(signal.detectedAt).getTime() + signal.ttlSeconds * 1000
      if (now >= expiresAt) continue

      const weight = this.signalTypeWeights[signal.signalType] ?? 0.05

      // Exponential decay: intensity decays based on signal-type-specific half-life.
      // The weight (signal-type importance) stays constant; only intensity diminishes.
      const decayedIntensity = computeDecayedIntensity(signal, now)

      const weightedContribution = decayedIntensity * weight
      weightedSum += weightedContribution
      totalWeight += weight

      contributions.push({
        signalType: signal.signalType,
        intensity: decayedIntensity,
        weight,
        weightedContribution,
      })
    }

    // Normalize to [0, 1]
    const compositeScore = totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1) : 0

    // Apply hysteresis to determine final stress level
    const stressLevel = this.classifyWithHysteresis(corridorId, compositeScore, now)

    return {
      corridorId,
      compositeScore,
      stressLevel,
      contributingSignals: contributions.sort((a, b) => b.weightedContribution - a.weightedContribution),
      computedAt: new Date(now).toISOString(),
    }
  }

  /**
   * Classify the composite score into a stress level, applying hysteresis
   * (deadband) to prevent rapid flapping between states.
   */
  private classifyWithHysteresis(
    corridorId: string,
    score: number,
    now: number,
  ): CorridorStressSignal['stressLevel'] {
    const prev = this.hysteresisState.get(corridorId)

    // Raw classification without hysteresis
    const rawLevel = this.classifyRaw(score)

    if (!prev) {
      // No history — use raw classification
      this.hysteresisState.set(corridorId, { level: rawLevel, score, since: now })
      return rawLevel
    }

    const dwellElapsed = now - prev.since

    // Determine ordering for comparison
    const levelOrder: Record<CorridorStressSignal['stressLevel'], number> = {
      calm: 0,
      elevated: 1,
      high: 2,
      critical: 3,
    }

    const prevOrd = levelOrder[prev.level]
    const rawOrd = levelOrder[rawLevel]

    if (rawOrd > prevOrd) {
      // Escalation: use escalation thresholds — must exceed the higher bar
      const requiredLevel = this.classifyByEscalation(score)
      const finalOrd = levelOrder[requiredLevel]
      if (finalOrd > prevOrd) {
        this.hysteresisState.set(corridorId, { level: requiredLevel, score, since: now })
        return requiredLevel
      }
      // Didn't cross escalation threshold — hold at previous level
      return prev.level
    } else if (rawOrd < prevOrd) {
      // De-escalation: require minimum dwell time AND lower threshold
      if (dwellElapsed < this.minDwellMs) {
        // Haven't dwelt long enough — hold at previous level
        return prev.level
      }
      const requiredLevel = this.classifyByDeescalation(score)
      const finalOrd = levelOrder[requiredLevel]
      if (finalOrd < prevOrd) {
        this.hysteresisState.set(corridorId, { level: requiredLevel, score, since: now })
        return requiredLevel
      }
      return prev.level
    }

    // Same level — just update the score
    this.hysteresisState.set(corridorId, { level: prev.level, score, since: prev.since })
    return prev.level
  }

  /** Raw classification (no hysteresis). */
  private classifyRaw(score: number): CorridorStressSignal['stressLevel'] {
    if (score >= 0.80) return 'critical'
    if (score >= 0.60) return 'high'
    if (score >= 0.30) return 'elevated'
    return 'calm'
  }

  /** Classification using stricter escalation thresholds. */
  private classifyByEscalation(score: number): CorridorStressSignal['stressLevel'] {
    if (score >= this.escalateThresholds.critical) return 'critical'
    if (score >= this.escalateThresholds.high) return 'high'
    if (score >= this.escalateThresholds.elevated) return 'elevated'
    return 'calm'
  }

  /** Classification using more lenient de-escalation thresholds. */
  private classifyByDeescalation(score: number): CorridorStressSignal['stressLevel'] {
    if (score >= this.deescalateThresholds.high) return 'critical'
    if (score >= this.deescalateThresholds.elevated) return 'high'
    if (score >= this.deescalateThresholds.calm) return 'elevated'
    return 'calm'
  }

  /**
   * Reset hysteresis state for a corridor. Useful when a corridor
   * is removed or when an operator forces a state reset.
   */
  resetHysteresis(corridorId: string): void {
    this.hysteresisState.delete(corridorId)
  }

  /** Clear all hysteresis state. */
  resetAllHysteresis(): void {
    this.hysteresisState.clear()
  }

  /** Expose the signal type weights for external consumers (e.g. signal combiner). */
  getSignalTypeWeight(signalType: StressSignalType): number {
    return this.signalTypeWeights[signalType] ?? 0.05
  }

  /**
   * Compute stress signals for all active corridors.
   */
  async computeStressSignals(): Promise<CorridorStressSignal[]> {
    const signals: CorridorStressSignal[] = []

    // Get corridors with recent activity
    const { rows: corridors } = await this.pool.query<{ corridor_id: string }>(
      `SELECT DISTINCT corridor_id
       FROM silver.observation
       WHERE type = 'quote' AND observed_at >= NOW() - INTERVAL '24 hours'
         AND corridor_id IS NOT NULL`,
    )

    for (const { corridor_id: corridorId } of corridors) {
      const factors = await this.computeFactors(corridorId)
      const stressScore = this.aggregateStressScore(factors)
      const stressLevel = this.classifyStressLevel(stressScore)

      if (stressLevel !== 'calm') {
        const triggerFactors = factors
          .filter((f) => f.value > f.threshold)
          .map((f) => `${f.name}=${f.value.toFixed(3)}`)

        signals.push({
          corridorId,
          stressScore,
          stressLevel,
          triggerFactors,
          detectedAt: new Date().toISOString(),
        })
      }
    }

    recordCloudWatchMetric({
      name: 'stress_computation_total',
      value: 1,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions(),
    })
    recordCloudWatchMetric({
      name: 'stress_corridors_scanned',
      value: corridors.length,
      unit: 'Count',
      namespace: AGENT_METRIC_NAMESPACE,
      dimensions: agentMetricDimensions(),
    })
    for (const signal of signals) {
      recordCloudWatchMetric({
        name: 'stress_signals_by_level',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: { ...agentMetricDimensions(), stress_level: signal.stressLevel },
      })
    }

    logger.info('stress_signals_computed', {
      corridorsScanned: corridors.length,
      signalsEmitted: signals.length,
    })

    // Emit non-calm signals to the agent-stress SQS queue for the stress responder
    const stressQueueUrl = config.queues.agentStress.url
    if (stressQueueUrl && config.queues.agentStress.mode !== 'off' && signals.length > 0) {
      for (const signal of signals) {
        sendJsonMessage(stressQueueUrl, signal).catch((err) => {
          logger.debug('stress_signal_queue_send_failed', {
            corridorId: signal.corridorId,
            error: err instanceof Error ? err.message : String(err),
          })
        })
      }
    }

    return signals
  }

  /**
   * Compute individual stress factors for a corridor.
   */
  private async computeFactors(corridorId: string): Promise<StressFactor[]> {
    const factors: StressFactor[] = []

    // Factor 1: TEER volatility (1h vs 24h)
    const teerVolatility = await this.computeTeerVolatility(corridorId)
    factors.push({
      name: 'teer_volatility',
      value: teerVolatility,
      weight: 0.3,
      threshold: 0.02, // 2% divergence
    })

    // Factor 2: Provider coverage drop
    const coverageDrop = await this.computeCoverageDrop(corridorId)
    factors.push({
      name: 'coverage_drop',
      value: coverageDrop,
      weight: 0.25,
      threshold: 0.3, // 30% fewer providers than usual
    })

    // Factor 3: Data freshness degradation
    const freshnessDegradation = await this.computeFreshnessDegradation(corridorId)
    factors.push({
      name: 'freshness_degradation',
      value: freshnessDegradation,
      weight: 0.2,
      threshold: 0.5, // 50% staler than SLO
    })

    // Factor 4: RCI spike
    const rciSpike = await this.computeRciSpike(corridorId)
    factors.push({
      name: 'rci_spike',
      value: rciSpike,
      weight: 0.15,
      threshold: 0.05, // 5% RCI increase
    })

    // Factor 5: Failure rate
    const failureRate = await this.computeFailureRate(corridorId)
    factors.push({
      name: 'failure_rate',
      value: failureRate,
      weight: 0.1,
      threshold: 0.2, // 20% failure rate
    })

    return factors
  }

  /**
   * TEER volatility: ratio of 1h stdev to 24h stdev.
   */
  private async computeTeerVolatility(corridorId: string): Promise<number> {
    const { rows } = await this.pool.query<{
      recent_stddev: string | null
      baseline_stddev: string | null
    }>(
      `SELECT
         (SELECT STDDEV((payload->>'exchange_rate')::numeric)
          FROM silver.observation
          WHERE corridor_id = $1 AND type = 'quote'
            AND observed_at >= NOW() - INTERVAL '1 hour') as recent_stddev,
         (SELECT STDDEV((payload->>'exchange_rate')::numeric)
          FROM silver.observation
          WHERE corridor_id = $1 AND type = 'quote'
            AND observed_at >= NOW() - INTERVAL '24 hours') as baseline_stddev`,
      [corridorId],
    )

    if (!rows[0]?.recent_stddev || !rows[0]?.baseline_stddev) return 0
    const recent = parseFloat(rows[0].recent_stddev)
    const baseline = parseFloat(rows[0].baseline_stddev)
    if (baseline === 0) return 0
    return Math.max(0, (recent - baseline) / baseline)
  }

  /**
   * Coverage drop: ratio of current vs. average provider count.
   */
  private async computeCoverageDrop(corridorId: string): Promise<number> {
    const { rows } = await this.pool.query<{
      recent_count: string
      baseline_count: string
    }>(
      `SELECT
         (SELECT COUNT(DISTINCT provider_id)
          FROM silver.observation
          WHERE corridor_id = $1 AND type = 'quote'
            AND observed_at >= NOW() - INTERVAL '1 hour')::text as recent_count,
         (SELECT COUNT(DISTINCT provider_id)
          FROM silver.observation
          WHERE corridor_id = $1 AND type = 'quote'
            AND observed_at >= NOW() - INTERVAL '7 days')::text as baseline_count`,
      [corridorId],
    )

    const recent = parseInt(rows[0]?.recent_count ?? '0', 10)
    const baseline = parseInt(rows[0]?.baseline_count ?? '0', 10)
    if (baseline === 0) return 0
    return Math.max(0, (baseline - recent) / baseline)
  }

  /**
   * Freshness degradation: how stale current data is relative to SLO.
   */
  private async computeFreshnessDegradation(corridorId: string): Promise<number> {
    const sloMinutes = 30

    const { rows } = await this.pool.query<{ max_observed: string | null }>(
      `SELECT MAX(observed_at) as max_observed
       FROM silver.observation
       WHERE corridor_id = $1 AND type = 'quote'`,
      [corridorId],
    )

    if (!rows[0]?.max_observed) return 1
    const ageMinutes = (Date.now() - new Date(rows[0].max_observed).getTime()) / 60_000
    return Math.max(0, (ageMinutes - sloMinutes) / sloMinutes)
  }

  /**
   * RCI spike: recent RCI increase.
   */
  private async computeRciSpike(corridorId: string): Promise<number> {
    const { rows } = await this.pool.query<{
      recent_rci: string | null
      baseline_rci: string | null
    }>(
      `SELECT
         (SELECT STDDEV((payload->>'exchange_rate')::numeric)
            / NULLIF(AVG((payload->>'exchange_rate')::numeric), 0)
          FROM silver.observation
          WHERE corridor_id = $1 AND type = 'quote'
            AND observed_at >= NOW() - INTERVAL '1 hour') as recent_rci,
         (SELECT STDDEV((payload->>'exchange_rate')::numeric)
            / NULLIF(AVG((payload->>'exchange_rate')::numeric), 0)
          FROM silver.observation
          WHERE corridor_id = $1 AND type = 'quote'
            AND observed_at >= NOW() - INTERVAL '24 hours') as baseline_rci`,
      [corridorId],
    )

    if (!rows[0]?.recent_rci || !rows[0]?.baseline_rci) return 0
    const recent = parseFloat(rows[0].recent_rci)
    const baseline = parseFloat(rows[0].baseline_rci)
    return Math.max(0, recent - baseline)
  }

  /**
   * Failure rate: percentage of recent observations that are failures.
   */
  private async computeFailureRate(corridorId: string): Promise<number> {
    const { rows } = await this.pool.query<{
      total: string
      failures: string
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE type = 'failure') as failures
       FROM silver.observation
       WHERE corridor_id = $1
         AND observed_at >= NOW() - INTERVAL '1 hour'`,
      [corridorId],
    )

    const total = parseInt(rows[0]?.total ?? '0', 10)
    const failures = parseInt(rows[0]?.failures ?? '0', 10)
    if (total === 0) return 0
    return failures / total
  }

  /**
   * Aggregate individual factors into a single stress score.
   */
  private aggregateStressScore(factors: StressFactor[]): number {
    let totalWeight = 0
    let weightedSum = 0

    for (const factor of factors) {
      const normalized = Math.min(factor.value / Math.max(factor.threshold, 0.001), 3) / 3
      weightedSum += normalized * factor.weight
      totalWeight += factor.weight
    }

    return totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1) : 0
  }

  /**
   * Classify numeric stress score into a level.
   */
  private classifyStressLevel(score: number): CorridorStressSignal['stressLevel'] {
    if (score >= 0.8) return 'critical'
    if (score >= 0.6) return 'high'
    if (score >= 0.3) return 'elevated'
    return 'calm'
  }
}
