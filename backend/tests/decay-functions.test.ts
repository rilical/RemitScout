import { describe, it, expect, vi } from 'vitest'

// Mock logger before importing the module under test
vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import {
  exponentialDecay,
  getSignalHalfLife,
  computeDecayedIntensity,
  SIGNAL_HALF_LIVES,
} from '../plane-b/src/scoring/decay-functions'
import type { StressSignal, StressSignalType } from '../plane-b/src/triangulation/engine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_TIME = new Date('2026-03-01T12:00:00.000Z').getTime()

const makeSignal = (overrides: Partial<StressSignal> = {}): StressSignal => ({
  signalId: overrides.signalId ?? 'sig-test',
  corridorId: overrides.corridorId ?? 'US-MX-USD-MXN',
  signalType: overrides.signalType ?? 'rate_deviation',
  intensity: overrides.intensity ?? 1.0,
  detectedAt: overrides.detectedAt ?? new Date(BASE_TIME).toISOString(),
  ttlSeconds: overrides.ttlSeconds ?? 600,
  source: overrides.source ?? 'test',
})

// ---------------------------------------------------------------------------
// exponentialDecay
// ---------------------------------------------------------------------------

describe('exponentialDecay', () => {
  it('returns full intensity when elapsed is 0', () => {
    expect(exponentialDecay(1.0, 300, 0)).toBe(1.0)
  })

  it('returns ~50% intensity at exactly one half-life', () => {
    const result = exponentialDecay(1.0, 300, 300)
    expect(result).toBeCloseTo(0.5, 5)
  })

  it('returns ~25% intensity at two half-lives', () => {
    const result = exponentialDecay(1.0, 300, 600)
    expect(result).toBeCloseTo(0.25, 5)
  })

  it('returns ~12.5% intensity at three half-lives', () => {
    const result = exponentialDecay(1.0, 300, 900)
    expect(result).toBeCloseTo(0.125, 5)
  })

  it('scales proportionally with initial intensity', () => {
    const result = exponentialDecay(0.8, 300, 300)
    expect(result).toBeCloseTo(0.4, 5)
  })

  it('returns near-zero for very large elapsed time', () => {
    // 20 half-lives: 1.0 * 2^(-20) ~ 9.54e-7
    const result = exponentialDecay(1.0, 300, 300 * 20)
    expect(result).toBeLessThan(0.00001)
    expect(result).toBeGreaterThan(0)
  })

  it('returns full intensity when elapsed is negative', () => {
    expect(exponentialDecay(1.0, 300, -100)).toBe(1.0)
  })

  it('returns 0 when halfLife is 0 or negative', () => {
    expect(exponentialDecay(1.0, 0, 100)).toBe(0)
    expect(exponentialDecay(1.0, -10, 100)).toBe(0)
  })

  it('returns 0 when initial intensity is 0', () => {
    expect(exponentialDecay(0, 300, 150)).toBe(0)
  })

  it('handles fractional seconds correctly', () => {
    const result = exponentialDecay(1.0, 300, 150)
    // At half the half-life: e^(-ln2 * 0.5) ~ 0.7071
    expect(result).toBeCloseTo(Math.SQRT1_2, 5)
  })
})

// ---------------------------------------------------------------------------
// getSignalHalfLife
// ---------------------------------------------------------------------------

describe('getSignalHalfLife', () => {
  it('returns correct half-life for rate_deviation', () => {
    expect(getSignalHalfLife('rate_deviation')).toBe(300)
  })

  it('returns correct half-life for volume_spike', () => {
    expect(getSignalHalfLife('volume_spike')).toBe(600)
  })

  it('returns correct half-life for volume_drop', () => {
    expect(getSignalHalfLife('volume_drop')).toBe(1800)
  })

  it('returns correct half-life for provider_dropout', () => {
    expect(getSignalHalfLife('provider_dropout')).toBe(3600)
  })

  it('returns correct half-life for freshness_breach', () => {
    expect(getSignalHalfLife('freshness_breach')).toBe(1800)
  })

  it('returns correct half-life for rci_spike', () => {
    expect(getSignalHalfLife('rci_spike')).toBe(900)
  })

  it('returns correct half-life for external_fx', () => {
    expect(getSignalHalfLife('external_fx')).toBe(7200)
  })

  it('returns correct half-life for failure_surge', () => {
    expect(getSignalHalfLife('failure_surge')).toBe(3600)
  })

  it('returns all eight known signal types in SIGNAL_HALF_LIVES', () => {
    const expectedTypes: StressSignalType[] = [
      'rate_deviation',
      'volume_spike',
      'volume_drop',
      'provider_dropout',
      'freshness_breach',
      'rci_spike',
      'external_fx',
      'failure_surge',
    ]
    for (const t of expectedTypes) {
      expect(SIGNAL_HALF_LIVES[t]).toBeGreaterThan(0)
    }
    expect(Object.keys(SIGNAL_HALF_LIVES)).toHaveLength(expectedTypes.length)
  })

  it('returns default 300s for an unknown signal type', () => {
    expect(getSignalHalfLife('some_future_type' as StressSignalType)).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// computeDecayedIntensity
// ---------------------------------------------------------------------------

describe('computeDecayedIntensity', () => {
  it('returns full intensity when signal was just detected', () => {
    const signal = makeSignal({ detectedAt: new Date(BASE_TIME).toISOString() })
    expect(computeDecayedIntensity(signal, BASE_TIME)).toBe(1.0)
  })

  it('returns ~50% at signal type half-life (rate_deviation = 300s)', () => {
    const signal = makeSignal({ signalType: 'rate_deviation', intensity: 1.0 })
    const now = BASE_TIME + 300 * 1000
    expect(computeDecayedIntensity(signal, now)).toBeCloseTo(0.5, 5)
  })

  it('returns ~50% at signal type half-life (provider_dropout = 3600s)', () => {
    const signal = makeSignal({ signalType: 'provider_dropout', intensity: 1.0 })
    const now = BASE_TIME + 3600 * 1000
    expect(computeDecayedIntensity(signal, now)).toBeCloseTo(0.5, 5)
  })

  it('different signal types decay at different rates', () => {
    const elapsed = 600 // 10 minutes in seconds
    const now = BASE_TIME + elapsed * 1000

    const rateDevSignal = makeSignal({ signalType: 'rate_deviation', intensity: 1.0 })
    const providerDropoutSignal = makeSignal({ signalType: 'provider_dropout', intensity: 1.0 })

    const rateDevDecayed = computeDecayedIntensity(rateDevSignal, now)
    const providerDropoutDecayed = computeDecayedIntensity(providerDropoutSignal, now)

    // rate_deviation (half-life 300s) at 600s = 2 half-lives = 25%
    expect(rateDevDecayed).toBeCloseTo(0.25, 5)
    // provider_dropout (half-life 3600s) at 600s = 1/6 of a half-life ~ 89%
    expect(providerDropoutDecayed).toBeGreaterThan(0.85)
    // rate_deviation should have decayed much more than provider_dropout
    expect(rateDevDecayed).toBeLessThan(providerDropoutDecayed)
  })

  it('scales with initial intensity', () => {
    const signal = makeSignal({ signalType: 'rate_deviation', intensity: 0.6 })
    const now = BASE_TIME + 300 * 1000 // one half-life
    expect(computeDecayedIntensity(signal, now)).toBeCloseTo(0.3, 5)
  })

  it('returns near-zero for a very old signal', () => {
    const signal = makeSignal({ signalType: 'rate_deviation', intensity: 1.0 })
    // 10 half-lives: 1.0 * 2^(-10) ~ 0.000977
    const now = BASE_TIME + 300 * 10 * 1000
    expect(computeDecayedIntensity(signal, now)).toBeLessThan(0.001)
    expect(computeDecayedIntensity(signal, now)).toBeGreaterThan(0)
  })

  it('handles now === detectedAt (elapsed = 0)', () => {
    const signal = makeSignal({ intensity: 0.75 })
    expect(computeDecayedIntensity(signal, BASE_TIME)).toBe(0.75)
  })
})

// ---------------------------------------------------------------------------
// Comparison with old linear decay model
// ---------------------------------------------------------------------------

describe('exponential vs linear decay comparison', () => {
  it('signal at half-life has ~50% intensity (not ~65% like linear model)', () => {
    // Old linear model: decayedWeight = weight * (0.3 + 0.7 * remainingRatio)
    // At half-life (remainingRatio = 0.5): 0.3 + 0.7 * 0.5 = 0.65
    // New exponential model at half-life: exactly 0.5

    const signal = makeSignal({
      signalType: 'rate_deviation',
      intensity: 1.0,
      ttlSeconds: 600, // TTL doesn't affect exponential decay
    })

    const halfLife = getSignalHalfLife('rate_deviation') // 300s
    const now = BASE_TIME + halfLife * 1000

    const decayed = computeDecayedIntensity(signal, now)
    expect(decayed).toBeCloseTo(0.5, 5)
    // Verify it is NOT the old linear value of 0.65
    expect(Math.abs(decayed - 0.65)).toBeGreaterThan(0.1)
  })

  it('signal near expiry has much lower intensity under exponential decay', () => {
    // With rate_deviation (half-life 300s) at 570s (95% of 600s TTL):
    // Linear: 0.3 + 0.7 * 0.05 = 0.335
    // Exponential: e^(-ln2 / 300 * 570) ~ 0.264

    const signal = makeSignal({
      signalType: 'rate_deviation',
      intensity: 1.0,
      ttlSeconds: 600,
    })

    const now = BASE_TIME + 570 * 1000
    const decayed = computeDecayedIntensity(signal, now)
    expect(decayed).toBeLessThan(0.335) // should be less than the old linear model
    expect(decayed).toBeCloseTo(0.264, 2)
  })
})
