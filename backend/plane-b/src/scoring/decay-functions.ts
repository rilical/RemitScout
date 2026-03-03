import type { StressSignalType, StressSignal } from '../triangulation/engine'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-b.scoring.decay-functions')

/**
 * Per-signal-type half-lives in seconds.
 *
 * Each signal type decays at a rate matching its expected real-world persistence:
 * - Transient pricing blips (rate_deviation) resolve quickly -> short half-life
 * - Infrastructure issues (provider_dropout, failure_surge) linger -> long half-life
 * - FX volatility (external_fx) can persist for hours -> longest half-life
 */
export const SIGNAL_HALF_LIVES: Record<StressSignalType, number> = {
  rate_deviation: 300, // 5 min  -- transient pricing blips
  volume_spike: 600, // 10 min -- usually short-lived
  volume_drop: 1800, // 30 min -- could indicate sustained issue
  provider_dropout: 3600, // 1 hour -- providers go down for a while
  freshness_breach: 1800, // 30 min -- stale data concern
  rci_spike: 900, // 15 min -- rate competition shifts
  external_fx: 7200, // 2 hours -- FX volatility persists
  failure_surge: 3600, // 1 hour -- collection failures cluster
}

/**
 * Compute exponential decay for a given initial intensity.
 *
 * Uses the formula: I(t) = I_0 * e^(-ln(2) / halfLife * elapsed)
 *
 * At t = halfLife the intensity is exactly 50% of the initial value.
 * At t = 2 * halfLife it is 25%, at t = 3 * halfLife it is 12.5%, etc.
 *
 * @param initialIntensity  Starting intensity (0-1)
 * @param halfLife          Time in seconds for intensity to halve
 * @param elapsed           Seconds since signal was detected
 * @returns Decayed intensity, always >= 0
 */
export function exponentialDecay(
  initialIntensity: number,
  halfLife: number,
  elapsed: number,
): number {
  if (halfLife <= 0) {
    logger.warn('exponential_decay_invalid_half_life', { halfLife })
    return 0
  }
  if (elapsed <= 0) return initialIntensity
  return initialIntensity * Math.exp((-Math.LN2 / halfLife) * elapsed)
}

/**
 * Look up the half-life (in seconds) for a given stress signal type.
 *
 * Returns a sensible default (300s / 5 min) for any unknown signal type
 * so the system degrades gracefully if new types are introduced before
 * the half-life map is updated.
 */
export function getSignalHalfLife(signalType: StressSignalType): number {
  return SIGNAL_HALF_LIVES[signalType] ?? 300
}

/**
 * Compute the decayed intensity of a stress signal at a given point in time.
 *
 * Convenience wrapper that extracts the signal's type and detection time,
 * looks up the appropriate half-life, and applies exponential decay.
 *
 * @param signal  The stress signal to decay
 * @param now     Current timestamp in milliseconds (Date.now())
 * @returns Decayed intensity in [0, initialIntensity]
 */
export function computeDecayedIntensity(signal: StressSignal, now: number): number {
  const halfLife = getSignalHalfLife(signal.signalType)
  const elapsed = (now - new Date(signal.detectedAt).getTime()) / 1000
  return exponentialDecay(signal.intensity, halfLife, elapsed)
}
