import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import type { FactorSource } from '../../../shared/types/factor'
import type { StressSignal, StressSignalType } from './engine'

const logger = createLogger('plane-b.triangulation.signal-combiner')

/**
 * Combined signal for a corridor on a given date.
 */
export type CombinedSignal = {
  corridorId: string
  date: string
  teerSignal: number | null
  rciSignal: number | null
  factorSignals: FactorSignalSummary[]
  compositeScore: number
  confidence: 'high' | 'medium' | 'low'
}

export type FactorSignalSummary = {
  source: FactorSource
  name: string
  value: number
  weight: number
  confidence: string
}

// ---------------------------------------------------------------------------
// Multi-stress-signal composition types
// ---------------------------------------------------------------------------

/**
 * Input for weighted stress signal combination.
 * Each entry represents one stress signal with its metadata.
 */
export type WeightedStressInput = {
  signalType: StressSignalType
  intensity: number
  /** Override weight — if omitted, the default type weight is used */
  weight?: number
  /** Confidence multiplier (0-1) — scales the effective contribution */
  confidenceMultiplier?: number
}

/**
 * Result of multi-signal composition.
 */
export type CompositeStressResult = {
  /** Normalized composite score in [0, 1] */
  compositeScore: number
  /** Per-signal breakdown */
  breakdown: Array<{
    signalType: StressSignalType
    rawIntensity: number
    effectiveWeight: number
    contribution: number
  }>
  /** Number of signals that contributed to the composite */
  signalCount: number
  /** Dominant signal type (highest individual contribution) */
  dominantSignalType: StressSignalType | null
}

/**
 * Signal Combiner — merges multiple signal sources into composite corridor metrics.
 *
 * Inputs:
 * - Direct TEER/RCI from gold index computation
 * - Triangulated TEER/RCI from the triangulation engine
 * - External factors from the Factor Normalization Plane
 * - Stress signals from the adaptive probing subsystem
 *
 * Output: Composite score representing overall corridor health and pricing accuracy.
 */
export class SignalCombiner {
  private readonly pool: Pool

  // Weights for different signal sources
  private readonly directWeight = 0.5
  private readonly triangulatedWeight = 0.2
  private readonly factorWeight = 0.3

  /**
   * Default weights per stress signal type.
   * Rate deviation is weighted highest because it most directly reflects
   * pricing anomalies; volume changes are lower as they may be benign.
   */
  private readonly defaultStressWeights: Record<StressSignalType, number> = {
    rate_deviation: 0.25,
    provider_dropout: 0.18,
    failure_surge: 0.15,
    rci_spike: 0.12,
    freshness_breach: 0.10,
    volume_drop: 0.08,
    external_fx: 0.07,
    volume_spike: 0.05,
  }

  constructor(pool: Pool) {
    this.pool = pool
  }

  // ---------------------------------------------------------------------------
  // Multi-stress-signal weighted combination
  // ---------------------------------------------------------------------------

  /**
   * Combine multiple stress signals into a single normalized composite score.
   *
   * The method:
   * 1. Resolves effective weight per signal (explicit override or default type weight)
   * 2. Applies confidence multipliers when available
   * 3. Produces a weighted-average composite normalized to [0, 1]
   * 4. Returns a per-signal breakdown for observability
   */
  combineStressSignals(inputs: WeightedStressInput[]): CompositeStressResult {
    if (inputs.length === 0) {
      return { compositeScore: 0, breakdown: [], signalCount: 0, dominantSignalType: null }
    }

    const breakdown: CompositeStressResult['breakdown'] = []
    let weightedSum = 0
    let totalWeight = 0

    for (const input of inputs) {
      const baseWeight = input.weight ?? this.defaultStressWeights[input.signalType] ?? 0.05
      const confidence = input.confidenceMultiplier ?? 1
      const effectiveWeight = baseWeight * Math.max(0, Math.min(1, confidence))
      const contribution = Math.max(0, Math.min(1, input.intensity)) * effectiveWeight

      weightedSum += contribution
      totalWeight += effectiveWeight

      breakdown.push({
        signalType: input.signalType,
        rawIntensity: input.intensity,
        effectiveWeight,
        contribution,
      })
    }

    // Normalize: weighted average ensures the composite stays in [0, 1]
    const compositeScore = totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1) : 0

    // Sort breakdown by contribution (highest first)
    breakdown.sort((a, b) => b.contribution - a.contribution)

    const dominantSignalType = breakdown.length > 0 ? breakdown[0].signalType : null

    logger.debug('stress_signals_combined', {
      signalCount: inputs.length,
      compositeScore: compositeScore.toFixed(4),
      dominantSignalType,
    })

    return {
      compositeScore,
      breakdown,
      signalCount: inputs.length,
      dominantSignalType,
    }
  }

  /**
   * Convenience: combine raw StressSignal objects into a composite result.
   * Filters out expired signals automatically.
   */
  combineRawStressSignals(signals: StressSignal[]): CompositeStressResult {
    const now = Date.now()

    const inputs: WeightedStressInput[] = signals
      .filter((s) => {
        const expiresAt = new Date(s.detectedAt).getTime() + s.ttlSeconds * 1000
        return now < expiresAt
      })
      .map((s) => ({
        signalType: s.signalType,
        intensity: s.intensity,
        // No explicit weight override — use default type weights
      }))

    return this.combineStressSignals(inputs)
  }

  /**
   * Get the default weight for a given stress signal type.
   */
  getDefaultStressWeight(signalType: StressSignalType): number {
    return this.defaultStressWeights[signalType] ?? 0.05
  }

  /**
   * Combine signals for a set of corridors.
   */
  async combineSignals(corridorIds: string[], date: string): Promise<CombinedSignal[]> {
    const signals: CombinedSignal[] = []

    for (const corridorId of corridorIds) {
      const signal = await this.combineForCorridor(corridorId, date)
      if (signal) signals.push(signal)
    }

    return signals
  }

  /**
   * Combine all signal sources for a single corridor.
   */
  private async combineForCorridor(corridorId: string, date: string): Promise<CombinedSignal | null> {
    // Load direct index data
    const directTeer = await this.loadDirectTeer(corridorId, date)

    // Load triangulated data
    const triangulatedTeer = await this.loadTriangulatedTeer(corridorId, date)

    // Load factor signals
    const factorSignals = await this.loadFactorSignals(corridorId, date)

    // Compute TEER signal (weighted blend of direct and triangulated)
    let teerSignal: number | null = null
    if (directTeer !== null && triangulatedTeer !== null) {
      const totalWeight = this.directWeight + this.triangulatedWeight
      teerSignal = (directTeer * this.directWeight + triangulatedTeer * this.triangulatedWeight) / totalWeight
    } else {
      teerSignal = directTeer ?? triangulatedTeer
    }

    // Compute composite score
    const compositeScore = this.computeCompositeScore(teerSignal, factorSignals)
    const confidence = this.assessConfidence(directTeer, triangulatedTeer, factorSignals)

    return {
      corridorId,
      date,
      teerSignal,
      rciSignal: null, // computed separately from observation data
      factorSignals,
      compositeScore,
      confidence,
    }
  }

  /**
   * Load direct TEER from gold indices.
   */
  private async loadDirectTeer(corridorId: string, date: string): Promise<number | null> {
    const { rows } = await this.pool.query<{ teer: string | null }>(
      `SELECT teer FROM gold_export.gold_indices
       WHERE corridor_id = $1 AND date = $2
       ORDER BY created_at DESC LIMIT 1`,
      [corridorId, date],
    )

    return rows.length > 0 && rows[0].teer ? parseFloat(rows[0].teer) : null
  }

  /**
   * Load triangulated TEER.
   */
  private async loadTriangulatedTeer(corridorId: string, date: string): Promise<number | null> {
    const { rows } = await this.pool.query<{ triangulated_teer: string | null }>(
      `SELECT triangulated_teer FROM gold_export.triangulated_index
       WHERE corridor_id = $1 AND date = $2
       ORDER BY created_at DESC LIMIT 1`,
      [corridorId, date],
    )

    return rows.length > 0 && rows[0].triangulated_teer ? parseFloat(rows[0].triangulated_teer) : null
  }

  /**
   * Load relevant factor signals for a corridor.
   */
  private async loadFactorSignals(corridorId: string, date: string): Promise<FactorSignalSummary[]> {
    const { rows } = await this.pool.query<{
      name: string
      source: string
      value: string
      confidence: string
    }>(
      `SELECT name, source, value, confidence
       FROM gold_export.factor
       WHERE (corridor_id = $1 OR corridor_id IS NULL)
         AND observed_at >= $2::date - INTERVAL '1 day'
         AND observed_at < $2::date + INTERVAL '1 day'
       ORDER BY observed_at DESC`,
      [corridorId, date],
    )

    return rows.map((r) => ({
      source: r.source as FactorSource,
      name: r.name,
      value: parseFloat(r.value),
      weight: this.getFactorWeight(r.source as FactorSource),
      confidence: r.confidence,
    }))
  }

  /**
   * Compute composite corridor score.
   */
  private computeCompositeScore(
    teerSignal: number | null,
    factorSignals: FactorSignalSummary[],
  ): number {
    // Normalize TEER into a 0-1 health score (lower divergence = healthier)
    let teerHealth = 0.5 // neutral if no data
    if (teerSignal !== null) {
      // TEER close to mid-market = healthy
      teerHealth = Math.max(0, 1 - Math.abs(1 - teerSignal) * 10)
    }

    // Average factor health
    let factorHealth = 0.5
    if (factorSignals.length > 0) {
      const weightedSum = factorSignals.reduce((sum, f) => sum + f.value * f.weight, 0)
      const totalWeight = factorSignals.reduce((sum, f) => sum + f.weight, 0)
      factorHealth = totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1) : 0.5
    }

    return teerHealth * 0.6 + factorHealth * 0.4
  }

  /**
   * Assess confidence in the combined signal.
   */
  private assessConfidence(
    directTeer: number | null,
    triangulatedTeer: number | null,
    factorSignals: FactorSignalSummary[],
  ): 'high' | 'medium' | 'low' {
    const sources = [directTeer !== null, triangulatedTeer !== null, factorSignals.length > 0]
      .filter(Boolean).length

    if (sources >= 3) return 'high'
    if (sources >= 2) return 'medium'
    return 'low'
  }

  /**
   * Factor weight by source type.
   */
  private getFactorWeight(source: FactorSource): number {
    switch (source) {
      case 'fx_mid_market': return 0.3
      case 'fx_card_network': return 0.2
      case 'fx_interbank': return 0.25
      case 'economic_indicator': return 0.1
      case 'regulatory': return 0.15
      case 'volume_proxy': return 0.1
      case 'geopolitical': return 0.05
      case 'infrastructure': return 0.05
      default: return 0.1
    }
  }
}
