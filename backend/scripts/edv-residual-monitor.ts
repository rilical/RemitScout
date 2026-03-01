/**
 * EDV Residual Monitor (P5)
 *
 * Tracks systematic residuals between TEER and reference anchors (mid-market rate).
 * Persistent residuals indicate unknown mechanisms affecting the corridor.
 * Transitory residuals indicate microstructure noise.
 *
 * Research source: EDV doc + Validation Agenda (E1)
 *
 * Definitions:
 * - residual_bps: (TEER - mid_market) / mid_market * 10000
 * - persistent: |residual - rolling_avg| > 2 * rolling_stddev for 3+ consecutive days
 */

import { createLogger } from '../shared/logger'

const logger = createLogger('script.edv-residual-monitor')

/**
 * Compute residual between TEER and reference anchor in basis points.
 *
 * Positive residual = TEER above mid-market (providers charge more than FX rate implies).
 * Negative residual = TEER below mid-market (providers offer rates better than mid-market).
 */
export function computeResidualBps(teer: number, midMarket: number): number {
  if (midMarket === 0) return 0
  return ((teer - midMarket) / midMarket) * 10000
}

/**
 * Input for residual classification.
 */
export interface ResidualInput {
  residual_bps: number
  rolling_avg_bps: number
  rolling_std_bps: number
  consecutive_breach_days: number
}

/**
 * Output of residual classification.
 */
export interface ResidualClassification {
  /** True if residual has been persistently breaching for 3+ days */
  is_persistent: boolean
  /** Number of consecutive breach days (0 if not persistent) */
  persistence_days: number
  /** How many standard deviations away from the rolling mean */
  breach_magnitude: number
}

const PERSISTENCE_STDDEV_THRESHOLD = 2.0
const PERSISTENCE_MIN_DAYS = 3

/**
 * Classify a residual as transitory or persistent.
 *
 * A residual is persistent if:
 * 1. Its deviation from the rolling mean exceeds 2 standard deviations
 * 2. This breach has persisted for 3 or more consecutive days
 *
 * This implements the unknown-unknown detection mechanism from the EDV research:
 * persistent, pattern-stable residuals should trigger investigation flags.
 */
export function classifyResidual(input: ResidualInput): ResidualClassification {
  const deviation = Math.abs(input.residual_bps - input.rolling_avg_bps)
  const breach_magnitude = input.rolling_std_bps > 0
    ? deviation / input.rolling_std_bps
    : (deviation > 0 ? Infinity : 0)

  const is_breaching = breach_magnitude >= PERSISTENCE_STDDEV_THRESHOLD
  const is_persistent = is_breaching && input.consecutive_breach_days >= PERSISTENCE_MIN_DAYS

  if (is_persistent) {
    logger.warn('persistent_residual_detected', {
      residual_bps: input.residual_bps,
      rolling_avg_bps: input.rolling_avg_bps,
      rolling_std_bps: input.rolling_std_bps,
      breach_magnitude: breach_magnitude === Infinity ? 'Infinity' : breach_magnitude.toFixed(2),
      consecutive_days: input.consecutive_breach_days,
    })
  }

  return {
    is_persistent,
    persistence_days: is_persistent ? input.consecutive_breach_days : 0,
    breach_magnitude,
  }
}
