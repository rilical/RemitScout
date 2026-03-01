import type { Pool } from 'pg'
import { createLogger } from '../../../shared/logger'
import { CorridorStressCalculator } from './corridor-stress'
import { StressResponder } from '../agents/stress-responder'
import type { CorridorStressSignal } from '../agents/stress-responder'

const logger = createLogger('plane-b.triangulation.stress-events')

/**
 * Stress event history entry.
 */
export type StressEvent = {
  corridorId: string
  stressScore: number
  stressLevel: string
  triggerFactors: string[]
  overridesApplied: number
  detectedAt: string
}

/**
 * Stress Events Pipeline — orchestrates the full stress detection → response cycle.
 *
 * This is the top-level coordinator that:
 * 1. Runs the CorridorStressCalculator to detect stress signals
 * 2. Passes signals to the StressResponder for cadence adjustment
 * 3. Records events for observability and analysis
 * 4. Manages hysteresis (avoids rapid flip-flopping between states)
 */
export class StressEventsPipeline {
  private readonly pool: Pool
  private readonly calculator: CorridorStressCalculator
  private readonly responder: StressResponder

  // Hysteresis: track recent stress levels to prevent rapid state changes
  private readonly recentLevels = new Map<string, { level: string; since: number }>()
  private readonly hysteresisMs = 60_000 // 1 minute cooldown between state changes

  constructor(pool: Pool) {
    this.pool = pool
    this.calculator = new CorridorStressCalculator(pool)
    this.responder = new StressResponder(pool)
  }

  /**
   * Run a full stress detection and response cycle.
   */
  async runCycle(): Promise<StressEvent[]> {
    const startedAt = Date.now()
    const events: StressEvent[] = []

    // Step 1: Detect stress signals
    const signals = await this.calculator.computeStressSignals()

    // Step 2: Apply hysteresis filtering
    const filteredSignals = this.applyHysteresis(signals)

    if (filteredSignals.length === 0) {
      logger.debug('stress_cycle_no_signals')
      return events
    }

    // Step 3: Process signals through responder
    const overrides = await this.responder.processStressSignals(filteredSignals)

    // Step 4: Record events
    for (const signal of filteredSignals) {
      const overrideCount = overrides.filter((o) => o.corridorId === signal.corridorId).length

      const event: StressEvent = {
        corridorId: signal.corridorId,
        stressScore: signal.stressScore,
        stressLevel: signal.stressLevel,
        triggerFactors: signal.triggerFactors,
        overridesApplied: overrideCount,
        detectedAt: signal.detectedAt,
      }

      events.push(event)
    }

    logger.info('stress_cycle_complete', {
      durationMs: Date.now() - startedAt,
      signalsDetected: signals.length,
      signalsAfterHysteresis: filteredSignals.length,
      overridesApplied: overrides.length,
    })

    return events
  }

  /**
   * Apply hysteresis to prevent rapid state flip-flopping.
   */
  private applyHysteresis(signals: CorridorStressSignal[]): CorridorStressSignal[] {
    const now = Date.now()
    const filtered: CorridorStressSignal[] = []

    for (const signal of signals) {
      const recent = this.recentLevels.get(signal.corridorId)

      if (recent && recent.level === signal.stressLevel && now - recent.since < this.hysteresisMs) {
        // Same level within cooldown — skip
        continue
      }

      // Update recent level tracking
      this.recentLevels.set(signal.corridorId, { level: signal.stressLevel, since: now })
      filtered.push(signal)
    }

    // Cleanup old entries
    for (const [corridorId, entry] of this.recentLevels) {
      if (now - entry.since > this.hysteresisMs * 10) {
        this.recentLevels.delete(corridorId)
      }
    }

    return filtered
  }
}
