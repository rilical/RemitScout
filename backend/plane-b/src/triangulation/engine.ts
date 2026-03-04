import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { parseCorridorId } from '../../../shared/corridor'

const logger = createLogger('plane-b.triangulation.engine')

/**
 * Triangulated index result for a corridor.
 */
export type TriangulatedResult = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  date: string
  leg1Corridor: string
  leg2Corridor: string
  leg1Teer: number | null
  leg2Teer: number | null
  triangulatedTeer: number | null
  triangulatedRci: number | null
  stressScore: number | null
  confidence: 'high' | 'medium' | 'low'
  methodologyVersion: string
}

// ---------------------------------------------------------------------------
// Stress Signal types for adaptive probing
// ---------------------------------------------------------------------------

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

/**
 * Triangulation leg — a direct corridor used in the two-leg computation.
 */
type TriangulationLeg = {
  corridorId: string
  teer: number | null
  rci: number | null
  providerCount: number
  freshness: number // minutes since last quote
}

/**
 * Triangulation Engine — computes synthetic corridor indices via two-leg paths.
 *
 * For corridors without enough direct provider coverage, the engine:
 * 1. Finds two-leg paths through a common intermediary (e.g., USD)
 * 2. Combines TEER/RCI from each leg weighted by provider coverage and freshness
 * 3. Produces triangulated index values with confidence scoring
 * 4. Persists results to `gold_export.triangulated_index`
 *
 * Example: GBP→KES can be triangulated via GBP→USD + USD→KES
 */
export class TriangulationEngine {
  private readonly pool: Pool
  private readonly methodologyVersion = 'triangulation_v1'

  // Intermediary currencies for triangulation paths (configurable via TRIANGULATION_INTERMEDIARIES)
  private readonly intermediaries = config.triangulation.intermediaries

  // Minimum provider count per leg for meaningful triangulation
  private readonly minProvidersPerLeg = 2

  // Maximum freshness in minutes for a leg to be considered valid
  private readonly maxFreshnessMinutes = 120

  // ---------------------------------------------------------------------------
  // In-memory stress signal store (keyed by signalId)
  // ---------------------------------------------------------------------------
  private readonly activeSignals = new Map<string, StressSignal>()

  // Limits to prevent unbounded memory growth
  private readonly maxSignalsPerCorridor = 50
  private readonly maxTotalSignals = 2000

  constructor(pool: Pool) {
    this.pool = pool
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
    const now = Date.now()
    const result: StressSignal[] = []

    for (const signal of this.activeSignals.values()) {
      if (signal.corridorId !== corridorId) continue
      const expiresAt = new Date(signal.detectedAt).getTime() + signal.ttlSeconds * 1000
      if (now < expiresAt) {
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
   * Run triangulation for all eligible corridors.
   */
  async triangulate(options: {
    date?: string
    amountBuckets?: number[]
    methodProfile?: string
  } = {}): Promise<TriangulatedResult[]> {
    const date = options.date ?? new Date().toISOString().slice(0, 10)
    const amountBuckets = options.amountBuckets ?? [500]
    const methodProfile = options.methodProfile ?? 'bank_transfer:bank_deposit'
    const results: TriangulatedResult[] = []

    // Find corridors that need triangulation (low direct coverage)
    const eligibleCorridors = await this.findEligibleCorridors(date, amountBuckets[0], methodProfile)

    for (const corridor of eligibleCorridors) {
      for (const amountBucket of amountBuckets) {
        const result = await this.triangulateCorridor(corridor, amountBucket, methodProfile, date)
        if (result) {
          await this.persistResult(result)
          results.push(result)
        }
      }
    }

    logger.info('triangulation_complete', {
      date,
      corridorsProcessed: eligibleCorridors.length,
      resultsProduced: results.length,
    })

    return results
  }

  /**
   * Find corridors eligible for triangulation (insufficient direct data).
   */
  private async findEligibleCorridors(
    date: string,
    amountBucket: number,
    methodProfile: string,
  ): Promise<string[]> {
    // Get all known corridors
    const { rows: allCorridors } = await this.pool.query<{ corridor_id: string }>(
      `SELECT DISTINCT corridor_id FROM silver.observation
       WHERE type = 'quote' AND observed_at >= $1::date - INTERVAL '7 days'`,
      [date],
    )

    // Get corridors with sufficient direct coverage
    const { rows: coveredCorridors } = await this.pool.query<{ corridor_id: string; provider_count: number }>(
      `SELECT corridor_id, COUNT(DISTINCT provider_id) as provider_count
       FROM silver.observation
       WHERE type = 'quote' AND observed_at >= $1::date - INTERVAL '1 day'
         AND amount_bucket = $2
       GROUP BY corridor_id
       HAVING COUNT(DISTINCT provider_id) >= 3`,
      [date, amountBucket],
    )

    const coveredSet = new Set(coveredCorridors.map((r) => r.corridor_id))
    return allCorridors
      .map((r) => r.corridor_id)
      .filter((c) => !coveredSet.has(c))
  }

  /**
   * Triangulate a single corridor via two-leg paths.
   */
  private async triangulateCorridor(
    corridorId: string,
    amountBucket: number,
    methodProfile: string,
    date: string,
  ): Promise<TriangulatedResult | null> {
    // Corridor ID is 4-part: sourceCountry-destCountry-sourceCurrency-destCurrency
    // e.g. "US-PH-USD-PHP" — extract currency codes at positions 2 and 3
    const parsed = parseCorridorId(corridorId)
    if (!parsed) return null
    const { sourceCurrency: sendCurrency, destCurrency: receiveCurrency } = parsed

    let bestResult: TriangulatedResult | null = null
    let bestConfidenceScore = 0

    for (const intermediary of this.intermediaries) {
      if (intermediary === sendCurrency || intermediary === receiveCurrency) continue

      const leg1Id = `${sendCurrency}-${intermediary}`
      const leg2Id = `${intermediary}-${receiveCurrency}`

      const leg1 = await this.loadLeg(leg1Id, amountBucket, date)
      const leg2 = await this.loadLeg(leg2Id, amountBucket, date)

      if (!leg1 || !leg2) continue
      if (leg1.providerCount < this.minProvidersPerLeg || leg2.providerCount < this.minProvidersPerLeg) continue
      if (leg1.freshness > this.maxFreshnessMinutes || leg2.freshness > this.maxFreshnessMinutes) continue

      // Combine legs
      const triangulatedTeer = leg1.teer !== null && leg2.teer !== null
        ? this.combineTeer(leg1.teer, leg2.teer)
        : null

      const triangulatedRci = leg1.rci !== null && leg2.rci !== null
        ? this.combineRci(leg1.rci, leg2.rci, leg1.providerCount, leg2.providerCount)
        : null

      const stressScore = this.computeStressScore(corridorId, leg1, leg2)
      const confidence = this.assessConfidence(corridorId, leg1, leg2)
      const confidenceScore = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1

      if (confidenceScore > bestConfidenceScore) {
        bestConfidenceScore = confidenceScore
        bestResult = {
          corridorId,
          amountBucket,
          methodProfile,
          date,
          leg1Corridor: leg1Id,
          leg2Corridor: leg2Id,
          leg1Teer: leg1.teer,
          leg2Teer: leg2.teer,
          triangulatedTeer,
          triangulatedRci,
          stressScore,
          confidence,
          methodologyVersion: this.methodologyVersion,
        }
      }
    }

    return bestResult
  }

  /**
   * Load index data for a single leg identified by a currency pair.
   *
   * The legId is a 2-part string like "USD-EUR" (sourceCurrency-destCurrency).
   * Since corridor_id in the database is 4-part ("US-GB-USD-GBP"), we join
   * through silver.corridor to match by source_currency and dest_currency.
   */
  private async loadLeg(legId: string, amountBucket: number, date: string): Promise<TriangulationLeg | null> {
    const legParts = legId.split('-')
    if (legParts.length !== 2 || !legParts[0] || !legParts[1]) return null
    const [legSourceCurrency, legDestCurrency] = legParts

    const { rows } = await this.pool.query<{
      teer: string | null
      rci: string | null
      provider_count: string
      max_observed: string
    }>(
      `SELECT
         AVG(CASE WHEN (payload->>'exchange_rate')::numeric > 0 THEN (payload->>'exchange_rate')::numeric END) as teer,
         STDDEV(CASE WHEN (payload->>'exchange_rate')::numeric > 0 THEN (payload->>'exchange_rate')::numeric END)
           / NULLIF(AVG(CASE WHEN (payload->>'exchange_rate')::numeric > 0 THEN (payload->>'exchange_rate')::numeric END), 0) as rci,
         COUNT(DISTINCT o.provider_id) as provider_count,
         MAX(o.observed_at) as max_observed
       FROM silver.observation o
       JOIN silver.corridor c ON c.corridor_id = o.corridor_id
       WHERE c.source_currency = $1 AND c.dest_currency = $2
         AND o.type = 'quote' AND o.amount_bucket = $3
         AND o.observed_at >= $4::date - INTERVAL '1 day'
         AND o.confidence IN ('high', 'medium')`,
      [legSourceCurrency, legDestCurrency, amountBucket, date],
    )

    if (rows.length === 0 || !rows[0].provider_count || rows[0].provider_count === '0') {
      return null
    }

    const maxObserved = rows[0].max_observed ? new Date(rows[0].max_observed) : null
    const freshness = maxObserved ? (Date.now() - maxObserved.getTime()) / 60_000 : Infinity

    return {
      corridorId: legId,
      teer: rows[0].teer ? parseFloat(rows[0].teer) : null,
      rci: rows[0].rci ? parseFloat(rows[0].rci) : null,
      providerCount: parseInt(rows[0].provider_count, 10),
      freshness,
    }
  }

  /**
   * Combine TEER from two legs (multiply exchange rates).
   */
  private combineTeer(leg1Teer: number, leg2Teer: number): number {
    return leg1Teer * leg2Teer
  }

  /**
   * Combine RCI from two legs (root-sum-square weighted by provider count).
   */
  private combineRci(leg1Rci: number, leg2Rci: number, leg1Providers: number, leg2Providers: number): number {
    const totalProviders = leg1Providers + leg2Providers
    const w1 = leg1Providers / totalProviders
    const w2 = leg2Providers / totalProviders
    return Math.sqrt(w1 * leg1Rci * leg1Rci + w2 * leg2Rci * leg2Rci)
  }

  /**
   * Compute corridor stress score from leg metrics and active stress signals.
   *
   * The score combines three components:
   * 1. RCI volatility from each leg (up to 0.3 each)
   * 2. Data freshness from each leg (up to 0.1 each)
   * 3. Active stress signals for the corridor and its legs (up to 0.2)
   */
  private computeStressScore(corridorId: string, leg1: TriangulationLeg, leg2: TriangulationLeg): number {
    let score = 0

    // RCI contribution (higher RCI = more volatile = more stress)
    if (leg1.rci !== null) score += Math.min(leg1.rci * 2, 0.3)
    if (leg2.rci !== null) score += Math.min(leg2.rci * 2, 0.3)

    // Freshness contribution (staler data = more uncertain = more stress)
    score += Math.min(leg1.freshness / this.maxFreshnessMinutes, 1) * 0.1
    score += Math.min(leg2.freshness / this.maxFreshnessMinutes, 1) * 0.1

    // Active stress signal contribution
    const corridorSignals = this.getActiveSignalsForCorridor(corridorId)
    const leg1Signals = this.getActiveSignalsForCorridor(leg1.corridorId)
    const leg2Signals = this.getActiveSignalsForCorridor(leg2.corridorId)
    const allSignals = [...corridorSignals, ...leg1Signals, ...leg2Signals]

    if (allSignals.length > 0) {
      // Take the max intensity across all related signals, capped at 0.2
      const maxIntensity = Math.max(...allSignals.map((s) => s.intensity))
      score += Math.min(maxIntensity * 0.2, 0.2)
    }

    return Math.min(score, 1)
  }

  /**
   * Assess confidence in the triangulated result.
   *
   * Confidence is downgraded when active stress signals indicate
   * corridor instability (e.g. provider dropouts or rate deviations).
   */
  private assessConfidence(corridorId: string, leg1: TriangulationLeg, leg2: TriangulationLeg): 'high' | 'medium' | 'low' {
    const minProviders = Math.min(leg1.providerCount, leg2.providerCount)
    const maxFreshness = Math.max(leg1.freshness, leg2.freshness)

    let confidence: 'high' | 'medium' | 'low'
    if (minProviders >= 5 && maxFreshness <= 30) confidence = 'high'
    else if (minProviders >= 3 && maxFreshness <= 60) confidence = 'medium'
    else confidence = 'low'

    // Downgrade confidence if high-intensity stress signals are active
    const signals = [
      ...this.getActiveSignalsForCorridor(corridorId),
      ...this.getActiveSignalsForCorridor(leg1.corridorId),
      ...this.getActiveSignalsForCorridor(leg2.corridorId),
    ]
    const highIntensityCount = signals.filter((s) => s.intensity >= 0.7).length
    if (highIntensityCount >= 2 && confidence === 'high') confidence = 'medium'
    if (highIntensityCount >= 3) confidence = 'low'

    return confidence
  }

  /**
   * Persist a triangulated result to the database.
   */
  private async persistResult(result: TriangulatedResult): Promise<void> {
    await this.pool.query(
      `INSERT INTO gold_export.triangulated_index
       (corridor_id, amount_bucket, method_profile, date,
        leg1_corridor, leg2_corridor, leg1_teer, leg2_teer,
        triangulated_teer, triangulated_rci, stress_score,
        confidence, methodology_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (corridor_id, amount_bucket, method_profile, date)
       DO UPDATE SET
         leg1_corridor = EXCLUDED.leg1_corridor,
         leg2_corridor = EXCLUDED.leg2_corridor,
         leg1_teer = EXCLUDED.leg1_teer,
         leg2_teer = EXCLUDED.leg2_teer,
         triangulated_teer = EXCLUDED.triangulated_teer,
         triangulated_rci = EXCLUDED.triangulated_rci,
         stress_score = EXCLUDED.stress_score,
         confidence = EXCLUDED.confidence,
         methodology_version = EXCLUDED.methodology_version`,
      [
        result.corridorId, result.amountBucket, result.methodProfile, result.date,
        result.leg1Corridor, result.leg2Corridor, result.leg1Teer, result.leg2Teer,
        result.triangulatedTeer, result.triangulatedRci, result.stressScore,
        result.confidence, result.methodologyVersion,
      ],
    )
  }
}
