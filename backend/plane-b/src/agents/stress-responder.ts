import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { recordCloudWatchMetric } from '../../../shared/cloudwatch-metrics'
import { notifyAgent } from '../../../shared/agent-notifications'
import { addBreadcrumb } from '../../../shared/error-tracker'

const AGENT_METRIC_NAMESPACE = 'RemitScout/Agents'
const agentMetricDimensions = (): Record<string, string> => ({
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  service: 'remit-scout',
})

const logger = createLogger('plane-b.agents.stress-responder')

/**
 * Minimum collection interval enforced on any cadence override.
 * No provider may be collected more than once every 20 seconds (3 req/min).
 */
const MIN_INTERVAL_MS = 20_000

/**
 * Maximum number of entries retained in the escalation tracker (and the
 * lastOverrideAt cooldown map).  Entries beyond this cap are evicted by age
 * (oldest-first) to bound in-process memory growth.
 */
const ESCALATION_TRACKER_MAX_SIZE = 1_000

/**
 * Time-to-live for escalation tracker entries.  Corridors whose last-detected
 * timestamp is older than this value are evicted on the next write.
 */
const ESCALATION_TRACKER_TTL_MS = 60 * 60 * 1_000 // 1 hour

/**
 * Corridor stress signal.
 */
export type CorridorStressSignal = {
  corridorId: string
  stressScore: number
  stressLevel: 'calm' | 'elevated' | 'high' | 'critical'
  triggerFactors: string[]
  detectedAt: string
}

/**
 * Cadence override — temporary adjustment to collection frequency.
 */
export type CadenceOverride = {
  moduleId: string
  corridorId: string
  originalIntervalMs: number
  overrideIntervalMs: number
  reason: string
  expiresAt: string
}

/**
 * Escalation record — tracks sustained high-stress corridors.
 */
export type EscalationRecord = {
  corridorId: string
  escalationLevel: 'watch' | 'alert' | 'incident'
  consecutiveHighCount: number
  firstDetectedAt: string
  lastDetectedAt: string
  notifiedAt: string | null
}

/**
 * Stress Responder — adjusts collection cadence in response to corridor stress signals.
 *
 * When corridor stress is detected (via TEER/RCI/RVI volatility, volume spikes, etc.),
 * the stress responder:
 * 1. Increases collection frequency for affected corridors (escalation)
 * 2. Decreases frequency when stress subsides (de-escalation)
 * 3. Manages cadence override TTLs in Redis
 * 4. Enforces cooldown logic to prevent over-reaction
 * 5. Escalates sustained high-stress corridors through watch -> alert -> incident
 *
 * This is the adaptive probing component of the agent-native platform.
 */
export class StressResponder {
  private readonly pool: Pool

  // Stress thresholds
  private readonly elevatedThreshold = 0.3
  private readonly highThreshold = 0.6
  private readonly criticalThreshold = 0.8

  // Cadence multipliers — applied as: overrideIntervalMs = baseIntervalMs * multiplier.
  // A value < 1 shortens the interval (increases collection frequency).
  //   elevated:  60 s * 0.75 = 45 s  →  25 % faster  ✓
  //   high:      60 s * 0.50 = 30 s  →  50 % faster  ✓
  //   critical:  60 s * 0.25 = 15 s  →  75 % faster  ✓ (clamped to MIN_INTERVAL_MS = 20 s)
  private readonly elevatedMultiplier = 0.75  // 25% faster
  private readonly highMultiplier = 0.5       // 50% faster
  private readonly criticalMultiplier = 0.25  // 75% faster (floor: MIN_INTERVAL_MS)

  // Override TTLs
  private readonly defaultOverrideTtlMs = 300_000  // 5 minutes
  private readonly criticalOverrideTtlMs = 600_000 // 10 minutes

  // ---------------------------------------------------------------------------
  // Cooldown logic — prevent over-reaction to rapid signal bursts
  // ---------------------------------------------------------------------------

  /** Minimum time (ms) between override applications for the same corridor */
  private readonly cooldownMs = 60_000 // 1 minute

  /** Tracks the last time an override was applied per corridor */
  private readonly lastOverrideAt = new Map<string, number>()

  // ---------------------------------------------------------------------------
  // Escalation tracking — sustained high stress triggers escalation path
  // ---------------------------------------------------------------------------

  /** Consecutive high/critical signal count per corridor */
  private readonly escalationTracker = new Map<string, EscalationRecord>()

  /** Thresholds for escalation levels (consecutive high/critical signal count) */
  private readonly watchThreshold = 3
  private readonly alertThreshold = 6
  private readonly incidentThreshold = 10

  constructor(pool: Pool) {
    this.pool = pool
  }

  /**
   * Process corridor stress signals and apply cadence overrides.
   *
   * Includes cooldown enforcement: if the same corridor was overridden
   * within the cooldown window, the override is skipped unless the
   * stress level has escalated (e.g. elevated -> critical).
   */
  async processStressSignals(signals: CorridorStressSignal[]): Promise<CadenceOverride[]> {
    const overrides: CadenceOverride[] = []

    for (const signal of signals) {
      if (signal.stressLevel === 'calm') {
        // Remove any existing overrides for this corridor
        await this.clearOverrides(signal.corridorId)
        // Reset escalation tracking when stress subsides
        this.escalationTracker.delete(signal.corridorId)
        continue
      }

      // Check cooldown: skip if recently overridden at same or lower level
      if (this.isInCooldown(signal)) {
        logger.debug('stress_responder_cooldown_skip', {
          corridorId: signal.corridorId,
          stressLevel: signal.stressLevel,
        })
        // Still track for escalation even during cooldown
        this.trackEscalation(signal)
        continue
      }

      // Find modules covering this corridor
      const { rows: modules } = await this.pool.query<{
        module_id: string
        policy: Record<string, unknown>
      }>(
        `SELECT module_id, policy
         FROM silver.module_registry
         WHERE status IN ('production', 'beta')
           AND $1 = ANY(supported_corridors)`,
        [signal.corridorId],
      )

      for (const mod of modules) {
        const multiplier = this.getMultiplier(signal.stressLevel)
        const ttlMs = signal.stressLevel === 'critical' ? this.criticalOverrideTtlMs : this.defaultOverrideTtlMs
        const baseIntervalMs = 60_000 // Default base interval (1 minute)
        // Clamp to MIN_INTERVAL_MS so no provider is collected more than
        // once every 20 seconds regardless of the stress multiplier.
        const overrideIntervalMs = Math.max(MIN_INTERVAL_MS, Math.round(baseIntervalMs * multiplier))

        const override: CadenceOverride = {
          moduleId: mod.module_id,
          corridorId: signal.corridorId,
          originalIntervalMs: baseIntervalMs,
          overrideIntervalMs,
          reason: `Stress level '${signal.stressLevel}' (score: ${signal.stressScore.toFixed(3)}) — factors: ${signal.triggerFactors.join(', ')}`,
          expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        }

        await this.applyCadenceOverride(override)
        overrides.push(override)
      }

      // Record cooldown timestamp
      this.lastOverrideAt.set(signal.corridorId, Date.now())

      // Track escalation for sustained high stress
      this.trackEscalation(signal)

      // Record the stress event
      await this.recordStressEvent(signal)

      // Check if escalation action is needed
      await this.processEscalation(signal.corridorId)
    }

    if (overrides.length > 0) {
      logger.info('cadence_overrides_applied', { count: overrides.length })
    }

    return overrides
  }

  /**
   * Compute stress level from a numeric score.
   */
  computeStressLevel(score: number): CorridorStressSignal['stressLevel'] {
    if (score >= this.criticalThreshold) return 'critical'
    if (score >= this.highThreshold) return 'high'
    if (score >= this.elevatedThreshold) return 'elevated'
    return 'calm'
  }

  // ---------------------------------------------------------------------------
  // Cooldown logic
  // ---------------------------------------------------------------------------

  /**
   * Check whether the corridor is within the cooldown window.
   *
   * The cooldown is bypassed when the stress level has escalated
   * compared to the last known level (allows fast reaction to worsening conditions).
   */
  private isInCooldown(signal: CorridorStressSignal): boolean {
    const lastAt = this.lastOverrideAt.get(signal.corridorId)
    if (!lastAt) return false

    const elapsed = Date.now() - lastAt
    if (elapsed >= this.cooldownMs) return false

    // Allow bypass if stress is escalating
    const existing = this.escalationTracker.get(signal.corridorId)
    if (existing) {
      const levelOrder: Record<CorridorStressSignal['stressLevel'], number> = {
        calm: 0, elevated: 1, high: 2, critical: 3,
      }
      const existingOrd = levelOrder[existing.escalationLevel === 'incident' ? 'critical' : existing.escalationLevel === 'alert' ? 'high' : 'elevated']
      const newOrd = levelOrder[signal.stressLevel]
      if (newOrd > existingOrd) {
        // Escalation — bypass cooldown
        return false
      }
    }

    return true
  }

  // ---------------------------------------------------------------------------
  // Escalation path for sustained high stress
  // ---------------------------------------------------------------------------

  /**
   * Track consecutive high/critical signals for a corridor.
   *
   * Runs TTL eviction and size-cap enforcement before mutating the map so
   * memory growth is bounded on every write path.
   */
  private trackEscalation(signal: CorridorStressSignal): void {
    // Housekeeping first — keep the in-process maps within bounds.
    this.evictStaleTrackerEntries()

    if (signal.stressLevel !== 'high' && signal.stressLevel !== 'critical') {
      // Only track high/critical for escalation; elevated resets the counter
      const existing = this.escalationTracker.get(signal.corridorId)
      if (existing && signal.stressLevel === 'elevated') {
        // Partial de-escalation — reduce counter but don't reset
        existing.consecutiveHighCount = Math.max(0, existing.consecutiveHighCount - 1)
        existing.lastDetectedAt = signal.detectedAt
      }
      return
    }

    const existing = this.escalationTracker.get(signal.corridorId)
    if (existing) {
      existing.consecutiveHighCount += 1
      existing.lastDetectedAt = signal.detectedAt
      // Update escalation level based on count
      if (existing.consecutiveHighCount >= this.incidentThreshold) {
        existing.escalationLevel = 'incident'
      } else if (existing.consecutiveHighCount >= this.alertThreshold) {
        existing.escalationLevel = 'alert'
      } else if (existing.consecutiveHighCount >= this.watchThreshold) {
        existing.escalationLevel = 'watch'
      }
    } else {
      this.escalationTracker.set(signal.corridorId, {
        corridorId: signal.corridorId,
        escalationLevel: 'watch',
        consecutiveHighCount: 1,
        firstDetectedAt: signal.detectedAt,
        lastDetectedAt: signal.detectedAt,
        notifiedAt: null,
      })
    }
  }

  /**
   * Process escalation: if a corridor has sustained high stress, record
   * escalation observations for ops visibility and potential automated response.
   */
  private async processEscalation(corridorId: string): Promise<void> {
    const record = this.escalationTracker.get(corridorId)
    if (!record) return

    // Only act when crossing a threshold boundary and not already notified at this level
    const shouldNotify =
      record.consecutiveHighCount === this.watchThreshold ||
      record.consecutiveHighCount === this.alertThreshold ||
      record.consecutiveHighCount === this.incidentThreshold

    if (!shouldNotify) return

    // Record escalation as an observation
    await this.pool.query(
      `INSERT INTO silver.observation
       (module_id, provider_id, owner_kind, owner_id, type, signal_layer, capture_method,
        parser_version, source_ref, corridor_id, confidence, observed_at, ingestion_run_id,
        payload, lineage, schema_version)
       VALUES ('system:stress-responder', 'system', 'signal_source', 'system:stress-responder',
               'event', 'stress', 'derived',
               NULL, NULL, $1, 'high', NOW(), $2,
               $3, $4, 1)`,
      [
        corridorId,
        `escalation-${Date.now()}`,
        JSON.stringify({
          event_type: 'stress_escalation',
          escalation_level: record.escalationLevel,
          consecutive_high_count: record.consecutiveHighCount,
          first_detected_at: record.firstDetectedAt,
          last_detected_at: record.lastDetectedAt,
        }),
        JSON.stringify({
          owner_id: 'system:stress-responder',
          corridor_id: corridorId,
        }),
      ],
    )

    record.notifiedAt = new Date().toISOString()

    // Emit stress escalation metric when reaching incident level
    if (record.escalationLevel === 'incident') {
      recordCloudWatchMetric({
        name: 'stress_escalation_incident',
        value: 1,
        unit: 'Count',
        namespace: AGENT_METRIC_NAMESPACE,
        dimensions: agentMetricDimensions(),
      })
    }

    // Notify #agent-ops for alert and incident escalations
    if (record.escalationLevel === 'alert' || record.escalationLevel === 'incident') {
      notifyAgent({
        type: 'stress_escalation',
        title: `Corridor ${corridorId} escalated to ${record.escalationLevel}`,
        severity: record.escalationLevel === 'incident' ? 'critical' : 'warning',
        details: {
          corridorId,
          escalationLevel: record.escalationLevel,
          consecutiveHighCount: record.consecutiveHighCount,
          firstDetectedAt: record.firstDetectedAt,
        },
      }).catch(() => {})
    }

    logger.warn('stress_escalation', {
      corridorId,
      escalationLevel: record.escalationLevel,
      consecutiveHighCount: record.consecutiveHighCount,
    })
  }

  /**
   * Get the current escalation record for a corridor, if any.
   */
  getEscalationRecord(corridorId: string): EscalationRecord | null {
    return this.escalationTracker.get(corridorId) ?? null
  }

  // ---------------------------------------------------------------------------
  // Tracker housekeeping — TTL eviction + size cap
  // ---------------------------------------------------------------------------

  /**
   * Evict stale entries from `escalationTracker` and `lastOverrideAt`.
   *
   * Two criteria, applied in order:
   *  1. TTL — remove entries whose `lastDetectedAt` is older than
   *     ESCALATION_TRACKER_TTL_MS (1 hour).
   *  2. Size cap — if the tracker still exceeds ESCALATION_TRACKER_MAX_SIZE
   *     after TTL eviction, remove the oldest entries (by lastDetectedAt) until
   *     the cap is satisfied.
   *
   * Called from `trackEscalation` before inserting a new entry so the maps
   * are trimmed on every write path without a separate timer.
   */
  private evictStaleTrackerEntries(): void {
    const now = Date.now()
    const cutoff = now - ESCALATION_TRACKER_TTL_MS

    // --- Pass 1: TTL eviction ---
    let ttlEvicted = 0
    for (const [corridorId, record] of this.escalationTracker) {
      if (new Date(record.lastDetectedAt).getTime() < cutoff) {
        this.escalationTracker.delete(corridorId)
        this.lastOverrideAt.delete(corridorId)
        ttlEvicted++
      }
    }

    // --- Pass 2: size cap (oldest-first) ---
    const overCap = this.escalationTracker.size - ESCALATION_TRACKER_MAX_SIZE
    if (overCap > 0) {
      // Sort ascending by lastDetectedAt so we drop the oldest first.
      const sorted = [...this.escalationTracker.entries()].sort(
        ([, a], [, b]) =>
          new Date(a.lastDetectedAt).getTime() - new Date(b.lastDetectedAt).getTime(),
      )
      let capEvicted = 0
      for (const [corridorId] of sorted) {
        if (capEvicted >= overCap) break
        this.escalationTracker.delete(corridorId)
        this.lastOverrideAt.delete(corridorId)
        capEvicted++
      }
      logger.warn('escalation_tracker_cap_eviction', {
        evicted: capEvicted,
        remaining: this.escalationTracker.size,
      })
    }

    if (ttlEvicted > 0) {
      logger.debug('escalation_tracker_ttl_eviction', {
        evicted: ttlEvicted,
        remaining: this.escalationTracker.size,
      })
    }
  }

  /**
   * Apply a cadence override. Stores in the dispatch queue with adjusted scheduling.
   */
  private async applyCadenceOverride(override: CadenceOverride): Promise<void> {
    // Record the override as a dispatch queue entry
    await this.pool.query(
      `INSERT INTO silver.dispatch_queue
       (queue_name, module_id, priority, payload, scheduled_at, expires_at)
       VALUES ('cadence-override', $1, 5, $2, NOW(), $3)
       ON CONFLICT DO NOTHING`,
      [
        override.moduleId,
        JSON.stringify({
          corridorId: override.corridorId,
          overrideIntervalMs: override.overrideIntervalMs,
          reason: override.reason,
        }),
        override.expiresAt,
      ],
    )

    addBreadcrumb(`Cadence override: ${override.corridorId} -> ${override.overrideIntervalMs}ms`, 'agent.stress-responder', 'info')
    logger.debug('cadence_override_applied', {
      moduleId: override.moduleId,
      corridorId: override.corridorId,
      intervalMs: override.overrideIntervalMs,
    })
  }

  /**
   * Clear cadence overrides for a corridor.
   */
  private async clearOverrides(corridorId: string): Promise<void> {
    await this.pool.query(
      `UPDATE silver.dispatch_queue
       SET status = 'expired', updated_at = NOW()
       WHERE queue_name = 'cadence-override'
         AND status = 'pending'
         AND payload->>'corridorId' = $1`,
      [corridorId],
    )
  }

  /**
   * Record a stress event as an observation.
   */
  private async recordStressEvent(signal: CorridorStressSignal): Promise<void> {
    await this.pool.query(
      `INSERT INTO silver.observation
       (module_id, provider_id, owner_kind, owner_id, type, signal_layer, capture_method,
        parser_version, source_ref, corridor_id, confidence, observed_at, ingestion_run_id,
        payload, lineage, schema_version)
       VALUES ('system:stress-responder', 'system', 'signal_source', 'system:stress-responder',
               'event', 'stress', 'derived',
               NULL, NULL, $1, 'high', $2, $3,
               $4, $5, 1)`,
      [
        signal.corridorId,
        signal.detectedAt,
        `stress-${Date.now()}`,
        JSON.stringify({
          event_type: 'corridor_stress',
          stress_score: signal.stressScore,
          stress_level: signal.stressLevel,
          trigger_factors: signal.triggerFactors,
        }),
        JSON.stringify({
          owner_id: 'system:stress-responder',
          corridor_id: signal.corridorId,
        }),
      ],
    )
  }

  private getMultiplier(level: CorridorStressSignal['stressLevel']): number {
    switch (level) {
      case 'critical': return this.criticalMultiplier
      case 'high': return this.highMultiplier
      case 'elevated': return this.elevatedMultiplier
      default: return 1
    }
  }
}
