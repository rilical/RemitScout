import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { createLogger } from '../../../shared/logger'
import { CorridorStressCalculator } from './corridor-stress'

const logger = createLogger('plane-b.triangulation.engine')

/**
 * Corridor-level composite signal used by the triangulation API/job.
 */
export type TriangulatedSignal = {
  signalKey: string
  signalLayer: 'price' | 'friction' | 'volatility' | 'stress'
  source: string
  value: number | null
  confidence: number
  weightedContribution: number
}

export type TriangulatedResult = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  date: string
  teer: number | null
  rci: number | null
  rviBps: number | null
  leg1Corridor: string
  leg2Corridor: string
  leg1Teer: number | null
  leg2Teer: number | null
  triangulatedTeer: number | null
  triangulatedRci: number | null
  stressScore: number | null
  confidence: 'high' | 'medium' | 'low'
  contributingSignals: TriangulatedSignal[]
  methodologyVersion: string
}

/**
 * Signal type categories indicating the nature of the stress source.
 */
export type StressSignalType =
  | 'rate_deviation'       // TEER deviates from mid-market beyond threshold
  | 'volume_spike'         // Unusual surge in quote volume
  | 'volume_drop'          // Significant decrease in quote volume
  | 'provider_dropout'     // One or more providers stopped responding
  | 'freshness_breach'     // Data staleness exceeds SLO
  | 'rci_spike'            // Rapid increase in rate competition index
  | 'external_fx'          // External FX mid-market volatility signal
  | 'failure_surge'        // Spike in collection failures

/**
 * Stress signal — a discrete event indicating corridor stress.
 *
 * Signals are ingested by the triangulation engine, validated,
 * and automatically expired after their TTL elapses.
 */
export type StressSignal = {
  /** Unique signal identifier */
  signalId: string
  /** Corridor this signal relates to */
  corridorId: string
  /** Type of stress observed */
  signalType: StressSignalType
  /** Intensity of the signal, normalized to 0-1 */
  intensity: number
  /** ISO 8601 timestamp when the signal was detected */
  detectedAt: string
  /** How long (in seconds) the signal remains active before expiring */
  ttlSeconds: number
  /** Origin of the signal (e.g. module or subsystem that emitted it) */
  source: string
}


type CompositeIndexRow = {
  corridor_id: string
  amount_bucket: number
  method_profile: string
  date: string
  teer_rate: number | null
  rci_ratio: number | null
  rvi_bps: number | null
  provider_count: number
  suppression_flag: boolean
  suppression_reason: string | null
  weight_confidence: number | null
}

type FactorRow = {
  name: string
  source: string
  value: number
  confidence: string
  observed_at: string
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

const resolveUtcDayBounds = (date: string) => {
  const start = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid triangulation date: ${date}`)
  }
  return {
    start,
    end: new Date(start.getTime() + 86_400_000 - 1),
  }
}

const factorConfidenceToScore = (confidence: string): number => {
  switch (confidence) {
    case 'authoritative':
      return 1
    case 'high':
      return 0.85
    case 'medium':
      return 0.65
    case 'low':
      return 0.35
    case 'estimated':
      return 0.2
    default:
      return 0.25
  }
}

const classifyFactorLayer = (
  source: string,
): TriangulatedSignal['signalLayer'] | null => {
  if (source === 'fx_mid_market' || source === 'fx_card_network' || source === 'fx_interbank') {
    return 'price'
  }
  if (source === 'regulatory' || source === 'infrastructure' || source === 'economic_indicator') {
    return 'friction'
  }
  if (source === 'geopolitical') {
    return 'stress'
  }
  return null
}

export const computeCompositeConfidenceScore = (input: {
  weightConfidence: number | null
  suppressionFlag: boolean
  stressScore: number
  hasPriceSignal: boolean
  hasFrictionSignal: boolean
  hasVolatilitySignal: boolean
  hasStressSignal: boolean
}): number => {
  const base = clamp01(input.weightConfidence ?? 0.5)
  const layerCoverage =
    (input.hasPriceSignal ? 0.35 : 0) +
    (input.hasFrictionSignal ? 0.25 : 0) +
    (input.hasVolatilitySignal ? 0.25 : 0) +
    (input.hasStressSignal ? 0.15 : 0)
  const suppressionPenalty = input.suppressionFlag ? 0.2 : 0
  const stressPenalty = clamp01(input.stressScore) * 0.2
  return clamp01((base * 0.55) + (layerCoverage * 0.45) - suppressionPenalty - stressPenalty)
}

const confidenceLevelFromScore = (
  score: number,
): TriangulatedResult['confidence'] => {
  if (score >= 0.75) return 'high'
  if (score >= 0.45) return 'medium'
  return 'low'
}

/**
 * Triangulation Engine — persists corridor-level composite outputs for the
 * triangulated index API surface.
 *
 * The persisted row keeps the legacy table shape but no longer treats
 * currency-pair legs as corridor legs. Instead it reads the canonical daily
 * corridor indices plus factor/stress context and stores a composite result
 * with explicit contributing signals.
 */
export class TriangulationEngine {
  private readonly pool: Pool
  private readonly methodologyVersion = 'triangulation_v2_corridor_composite'
  private readonly stressCalculator: CorridorStressCalculator

  // ---------------------------------------------------------------------------
  // In-memory stress signal store (keyed by signalId)
  // ---------------------------------------------------------------------------
  private readonly activeSignals = new Map<string, StressSignal>()

  // Limits to prevent unbounded memory growth
  private readonly maxSignalsPerCorridor = 50
  private readonly maxTotalSignals = 2000

  constructor(pool: Pool) {
    this.pool = pool
    this.stressCalculator = new CorridorStressCalculator(pool)
  }

  // ---------------------------------------------------------------------------
  // Stress signal ingestion & management
  // ---------------------------------------------------------------------------

  /**
   * Ingest a stress signal after validation.
   *
   * Returns the validated signal (with a generated signalId if omitted)
   * or null when validation fails.
   */
  ingestSignal(raw: Partial<StressSignal> & Pick<StressSignal, 'corridorId' | 'signalType' | 'intensity' | 'source'>): StressSignal | null {
    const validated = this.validateSignal(raw)
    if (!validated) return null

    // Enforce per-corridor cap: evict oldest signal when limit is reached
    const corridorSignals = this.getActiveSignalsForCorridor(validated.corridorId)
    if (corridorSignals.length >= this.maxSignalsPerCorridor) {
      const oldest = corridorSignals.sort(
        (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime(),
      )[0]
      if (oldest) this.activeSignals.delete(oldest.signalId)
    }

    // Enforce global cap
    if (this.activeSignals.size >= this.maxTotalSignals) {
      this.purgeExpiredSignals()
      // If still over limit after purge, drop the oldest signal globally
      if (this.activeSignals.size >= this.maxTotalSignals) {
        const allSorted = [...this.activeSignals.values()].sort(
          (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime(),
        )
        if (allSorted[0]) this.activeSignals.delete(allSorted[0].signalId)
      }
    }

    this.activeSignals.set(validated.signalId, validated)

    // Write-through to DB for persistence across restarts (fire-and-forget)
    const expiresAt = new Date(new Date(validated.detectedAt).getTime() + validated.ttlSeconds * 1000).toISOString()
    this.pool.query(
      `INSERT INTO silver.stress_signal (signal_id, corridor_id, signal_type, intensity, source, detected_at, expires_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (signal_id) DO NOTHING`,
      [validated.signalId, validated.corridorId, validated.signalType, validated.intensity, validated.source, validated.detectedAt, expiresAt, '{}'],
    ).catch((err: unknown) => {
      logger.warn('stress_signal_persist_failed', {
        signalId: validated.signalId,
        error: err instanceof Error ? err.message : String(err),
      })
    })

    logger.debug('stress_signal_ingested', {
      signalId: validated.signalId,
      corridorId: validated.corridorId,
      signalType: validated.signalType,
      intensity: validated.intensity,
      ttlSeconds: validated.ttlSeconds,
    })

    return validated
  }

  /**
   * Validate and normalize a raw stress signal.
   *
   * Returns a fully populated StressSignal or null when validation fails.
   */
  private validateSignal(
    raw: Partial<StressSignal> & Pick<StressSignal, 'corridorId' | 'signalType' | 'intensity' | 'source'>,
  ): StressSignal | null {
    // Corridor ID must be a non-empty string matching either:
    // - 4-part format: "XX-YY-XXX-YYY" (sourceCountry-destCountry-sourceCurrency-destCurrency)
    // - 2-part format: "XXX-YYY" (currency pair, used for triangulation legs)
    if (
      !raw.corridorId ||
      (!/^[A-Z]{2,3}-[A-Z]{2,3}-[A-Z]{3}-[A-Z]{3}$/.test(raw.corridorId) &&
       !/^[A-Z]{3}-[A-Z]{3}$/.test(raw.corridorId))
    ) {
      logger.warn('stress_signal_invalid_corridor', { corridorId: raw.corridorId })
      return null
    }

    // Intensity must be in [0, 1]
    if (typeof raw.intensity !== 'number' || raw.intensity < 0 || raw.intensity > 1 || Number.isNaN(raw.intensity)) {
      logger.warn('stress_signal_invalid_intensity', { intensity: raw.intensity })
      return null
    }

    // Signal type must be one of the known types
    const validTypes: StressSignalType[] = [
      'rate_deviation', 'volume_spike', 'volume_drop', 'provider_dropout',
      'freshness_breach', 'rci_spike', 'external_fx', 'failure_surge',
    ]
    if (!validTypes.includes(raw.signalType)) {
      logger.warn('stress_signal_invalid_type', { signalType: raw.signalType })
      return null
    }

    // Source must be a non-empty string
    if (!raw.source || typeof raw.source !== 'string') {
      logger.warn('stress_signal_invalid_source', { source: raw.source })
      return null
    }

    const ttlSeconds = raw.ttlSeconds != null && raw.ttlSeconds > 0 ? raw.ttlSeconds : 300 // default 5 min

    return {
      signalId: raw.signalId ?? randomUUID(),
      corridorId: raw.corridorId,
      signalType: raw.signalType,
      intensity: raw.intensity,
      detectedAt: raw.detectedAt ?? new Date().toISOString(),
      ttlSeconds,
      source: raw.source,
    }
  }

  /**
   * Remove all expired signals from the active store and DB.
   */
  purgeExpiredSignals(): number {
    const now = Date.now()
    let purged = 0

    for (const [signalId, signal] of this.activeSignals) {
      const expiresAt = new Date(signal.detectedAt).getTime() + signal.ttlSeconds * 1000
      if (now >= expiresAt) {
        this.activeSignals.delete(signalId)
        purged++
      }
    }

    if (purged > 0) {
      logger.debug('stress_signals_purged', { count: purged, remaining: this.activeSignals.size })

      // Delete expired rows from DB (fire-and-forget)
      this.pool.query(
        `DELETE FROM silver.stress_signal WHERE expires_at <= $1`,
        [new Date(now).toISOString()],
      ).catch((err: unknown) => {
        logger.warn('stress_signal_db_purge_failed', {
          error: err instanceof Error ? err.message : String(err),
        })
      })
    }

    return purged
  }

  /**
   * Hydrate the in-memory signal map from the database.
   *
   * Call this once during engine initialization so that signals
   * persisted before a restart are restored into the hot-path map.
   */
  async hydrateFromDb(): Promise<number> {
    try {
      const { rows } = await this.pool.query<{
        signal_id: string
        corridor_id: string
        signal_type: string
        intensity: string
        source: string
        detected_at: string
        expires_at: string
      }>(
        `SELECT signal_id, corridor_id, signal_type, intensity, source, detected_at, expires_at
         FROM silver.stress_signal
         WHERE expires_at > NOW()
         ORDER BY detected_at ASC`,
      )

      let loaded = 0
      for (const row of rows) {
        const detectedAt = new Date(row.detected_at)
        const expiresAt = new Date(row.expires_at)
        const ttlSeconds = Math.max(0, Math.round((expiresAt.getTime() - detectedAt.getTime()) / 1000))

        const signal: StressSignal = {
          signalId: row.signal_id,
          corridorId: row.corridor_id,
          signalType: row.signal_type as StressSignalType,
          intensity: parseFloat(row.intensity),
          detectedAt: detectedAt.toISOString(),
          ttlSeconds,
          source: row.source,
        }

        this.activeSignals.set(signal.signalId, signal)
        loaded++
      }

      if (loaded > 0) {
        logger.info('stress_signals_hydrated', { count: loaded })
      }

      return loaded
    } catch (err) {
      logger.warn('stress_signal_hydrate_failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      return 0
    }
  }

  /**
   * Get all non-expired active signals for a corridor.
   */
  getActiveSignalsForCorridor(corridorId: string): StressSignal[] {
    return this.getSignalsActiveAt(corridorId, new Date())
  }

  private getSignalsActiveAt(corridorId: string, asOf: Date): StressSignal[] {
    const asOfMs = asOf.getTime()
    const result: StressSignal[] = []

    for (const signal of this.activeSignals.values()) {
      if (signal.corridorId !== corridorId) continue
      const detectedAtMs = new Date(signal.detectedAt).getTime()
      const expiresAt = new Date(signal.detectedAt).getTime() + signal.ttlSeconds * 1000
      if (detectedAtMs <= asOfMs && asOfMs < expiresAt) {
        result.push(signal)
      }
    }

    return result
  }

  /**
   * Get all non-expired active signals across all corridors.
   */
  getAllActiveSignals(): StressSignal[] {
    this.purgeExpiredSignals()
    return [...this.activeSignals.values()]
  }

  /**
   * Check whether a specific signal is still active (not expired).
   */
  isSignalActive(signalId: string): boolean {
    const signal = this.activeSignals.get(signalId)
    if (!signal) return false
    const expiresAt = new Date(signal.detectedAt).getTime() + signal.ttlSeconds * 1000
    if (Date.now() >= expiresAt) {
      this.activeSignals.delete(signalId)
      return false
    }
    return true
  }

  /**
   * Run corridor-level composite generation for the selected amount buckets.
   */
  async triangulate(options: {
    date?: string
    amountBuckets?: number[]
    methodProfile?: string
  } = {}): Promise<TriangulatedResult[]> {
    const date = options.date ?? new Date().toISOString().slice(0, 10)
    const amountBuckets = options.amountBuckets ?? [500]
    const methodProfile = options.methodProfile ?? 'standard_bank'
    const results: TriangulatedResult[] = []

    for (const amountBucket of amountBuckets) {
      const baseRows = await this.loadCompositeRows(date, amountBucket, methodProfile)
      for (const row of baseRows) {
        const result = await this.buildCompositeResult(row)
        if (result) {
          await this.persistResult(result)
          results.push(result)
        }
      }
    }

    logger.info('triangulation_complete', {
      date,
      corridorsProcessed: results.length,
      resultsProduced: results.length,
    })

    return results
  }

  /**
   * Load the most recent corridor-level Gold rows on or before the requested date.
   */
  private async loadCompositeRows(
    date: string,
    amountBucket: number,
    methodProfile: string,
  ): Promise<CompositeIndexRow[]> {
    const { rows } = await this.pool.query<CompositeIndexRow>(
      `SELECT DISTINCT ON (corridor_id)
              corridor_id,
              amount_bucket::int AS amount_bucket,
              method_profile,
              date::text AS date,
              teer_rate::double precision AS teer_rate,
              rci_ratio::double precision AS rci_ratio,
              rvi_bps::double precision AS rvi_bps,
              provider_count::int AS provider_count,
              suppression_flag,
              suppression_reason,
              weight_confidence::double precision AS weight_confidence
         FROM gold_export.cdp_daily
        WHERE amount_bucket = $1
          AND method_profile = $2
          AND date <= $3::date
        ORDER BY corridor_id, date DESC`,
      [amountBucket, methodProfile, date],
    )
    return rows
  }

  /**
   * Build a corridor-level composite result using Gold indices, factor signals,
   * and active stress signals.
   */
  private async buildCompositeResult(
    row: CompositeIndexRow,
  ): Promise<TriangulatedResult | null> {
    const asOf = resolveUtcDayBounds(row.date).end
    const asOfIso = asOf.toISOString()
    const [factorRows, dbStressRows] = await Promise.all([
      this.loadFactors(row.corridor_id, row.date),
      this.pool.query<{
        signal_id: string
        corridor_id: string
        signal_type: string
        intensity: string
        source: string
        detected_at: string
        expires_at: string
      }>(
        `SELECT signal_id, corridor_id, signal_type, intensity, source, detected_at, expires_at
           FROM silver.stress_signal
          WHERE corridor_id = $1
            AND detected_at <= $2
            AND expires_at > $2
          ORDER BY detected_at DESC`,
        [row.corridor_id, asOfIso],
      ),
    ])

    const activeSignals = [
      ...this.getSignalsActiveAt(row.corridor_id, asOf),
      ...dbStressRows.rows.map((signal) => {
        const detectedAt = new Date(signal.detected_at)
        const expiresAt = new Date(signal.expires_at)
        return {
          signalId: signal.signal_id,
          corridorId: signal.corridor_id,
          signalType: signal.signal_type as StressSignalType,
          intensity: parseFloat(signal.intensity),
          detectedAt: detectedAt.toISOString(),
          ttlSeconds: Math.max(0, Math.round((expiresAt.getTime() - detectedAt.getTime()) / 1000)),
          source: signal.source,
        } satisfies StressSignal
      }),
    ]

    const seenStressSignals = new Set<string>()
    const dedupedSignals = activeSignals.filter((signal) => {
      if (seenStressSignals.has(signal.signalId)) return false
      seenStressSignals.add(signal.signalId)
      return true
    })

    const stressAssessment = this.stressCalculator.computeMultiSignalStress(
      row.corridor_id,
      dedupedSignals,
      { asOf },
    )
    const stressScore = stressAssessment.compositeScore

    const contributingSignals: TriangulatedSignal[] = []
    if (row.teer_rate !== null) {
      contributingSignals.push({
        signalKey: 'teer_baseline',
        signalLayer: 'price',
        source: 'gold_export.cdp_daily',
        value: row.teer_rate,
        confidence: clamp01(row.weight_confidence ?? 0.5),
        weightedContribution: 0.35,
      })
    }
    if (row.rci_ratio !== null) {
      contributingSignals.push({
        signalKey: 'rci_baseline',
        signalLayer: 'friction',
        source: 'gold_export.cdp_daily',
        value: row.rci_ratio,
        confidence: clamp01(row.weight_confidence ?? 0.5),
        weightedContribution: 0.25,
      })
    }
    if (row.rvi_bps !== null) {
      contributingSignals.push({
        signalKey: 'rvi_baseline',
        signalLayer: 'volatility',
        source: 'gold_export.cdp_daily',
        value: row.rvi_bps,
        confidence: clamp01(row.weight_confidence ?? 0.5),
        weightedContribution: 0.25,
      })
    }

    for (const factor of factorRows) {
      const layer = classifyFactorLayer(factor.source)
      if (!layer) continue
      const confidence = factorConfidenceToScore(factor.confidence)
      contributingSignals.push({
        signalKey: `${factor.source}:${factor.name}`,
        signalLayer: layer,
        source: factor.source,
        value: factor.value,
        confidence,
        weightedContribution: layer === 'price' ? confidence * 0.1 : layer === 'friction' ? confidence * 0.08 : confidence * 0.05,
      })
    }

    for (const signal of stressAssessment.contributingSignals) {
      contributingSignals.push({
        signalKey: `stress:${signal.signalType}`,
        signalLayer: 'stress',
        source: 'silver.stress_signal',
        value: signal.intensity,
        confidence: clamp01(signal.weight),
        weightedContribution: clamp01(signal.weightedContribution),
      })
    }

    const confidenceScore = computeCompositeConfidenceScore({
      weightConfidence: row.weight_confidence,
      suppressionFlag: row.suppression_flag,
      stressScore,
      hasPriceSignal: contributingSignals.some((signal) => signal.signalLayer === 'price'),
      hasFrictionSignal: contributingSignals.some((signal) => signal.signalLayer === 'friction'),
      hasVolatilitySignal: contributingSignals.some((signal) => signal.signalLayer === 'volatility'),
      hasStressSignal: contributingSignals.some((signal) => signal.signalLayer === 'stress'),
    })

    return {
      corridorId: row.corridor_id,
      amountBucket: row.amount_bucket,
      methodProfile: row.method_profile,
      date: row.date,
      teer: row.teer_rate,
      rci: row.rci_ratio,
      rviBps: row.rvi_bps,
      leg1Corridor: row.corridor_id,
      leg2Corridor: row.corridor_id,
      leg1Teer: row.teer_rate,
      leg2Teer: null,
      triangulatedTeer: row.teer_rate,
      triangulatedRci: row.rci_ratio,
      stressScore,
      confidence: confidenceLevelFromScore(confidenceScore),
      contributingSignals: contributingSignals.sort((a, b) => b.weightedContribution - a.weightedContribution),
      methodologyVersion: this.methodologyVersion,
    }
  }

  private async loadFactors(corridorId: string, date: string): Promise<FactorRow[]> {
    const { rows } = await this.pool.query<FactorRow>(
      `SELECT
         name,
         source,
         value::double precision AS value,
         confidence,
         observed_at::text AS observed_at
       FROM gold_export.factor
       WHERE corridor_id = $1
         AND observed_at >= $2::date - INTERVAL '3 days'
         AND observed_at < $2::date + INTERVAL '1 day'
       ORDER BY observed_at DESC
       LIMIT 25`,
      [corridorId, date],
    )
    return rows
  }

  /**
   * Persist a corridor-level composite result to the database.
   */
  private async persistResult(result: TriangulatedResult): Promise<void> {
    await this.pool.query(
      `INSERT INTO gold_export.triangulated_index
       (corridor_id, amount_bucket, method_profile, date,
        leg1_corridor, leg2_corridor, leg1_teer, leg2_teer,
        triangulated_teer, triangulated_rci, composite_rvi_bps, stress_score,
        confidence, contributing_signals, lineage, methodology_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16)
       ON CONFLICT (corridor_id, amount_bucket, method_profile, date)
       DO UPDATE SET
         leg1_corridor = EXCLUDED.leg1_corridor,
         leg2_corridor = EXCLUDED.leg2_corridor,
         leg1_teer = EXCLUDED.leg1_teer,
         leg2_teer = EXCLUDED.leg2_teer,
         triangulated_teer = EXCLUDED.triangulated_teer,
         triangulated_rci = EXCLUDED.triangulated_rci,
         composite_rvi_bps = EXCLUDED.composite_rvi_bps,
         stress_score = EXCLUDED.stress_score,
         confidence = EXCLUDED.confidence,
         contributing_signals = EXCLUDED.contributing_signals,
         lineage = EXCLUDED.lineage,
         methodology_version = EXCLUDED.methodology_version`,
      [
        result.corridorId, result.amountBucket, result.methodProfile, result.date,
        result.leg1Corridor, result.leg2Corridor, result.leg1Teer, result.leg2Teer,
        result.triangulatedTeer, result.triangulatedRci, result.rviBps, result.stressScore,
        result.confidence, JSON.stringify(result.contributingSignals), JSON.stringify({
          source: 'gold_export.cdp_daily',
          corridor_id: result.corridorId,
          method_profile: result.methodProfile,
          methodology_version: result.methodologyVersion,
        }), result.methodologyVersion,
      ],
    )
  }
}
