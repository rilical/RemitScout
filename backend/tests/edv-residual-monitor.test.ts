import { describe, it, expect } from 'vitest'
import {
  computeResidualBps,
  classifyResidual,
  type ResidualInput,
} from '../scripts/edv-residual-monitor'

describe('computeResidualBps', () => {
  it('computes negative residual when TEER < mid-market', () => {
    // (83.5 - 84.0) / 84.0 * 10000 = -59.52 bps
    const result = computeResidualBps(83.5, 84.0)
    expect(result).toBeCloseTo(-59.52, 0)
  })

  it('computes positive residual when TEER > mid-market', () => {
    // (84.5 - 84.0) / 84.0 * 10000 = 59.52 bps
    const result = computeResidualBps(84.5, 84.0)
    expect(result).toBeCloseTo(59.52, 0)
  })

  it('returns zero when TEER equals mid-market', () => {
    const result = computeResidualBps(84.0, 84.0)
    expect(result).toBe(0)
  })

  it('returns zero when mid-market is zero (division guard)', () => {
    const result = computeResidualBps(83.5, 0)
    expect(result).toBe(0)
  })
})

describe('classifyResidual', () => {
  it('classifies as transitory when residual is within 2 stddev', () => {
    const input: ResidualInput = {
      residual_bps: 30,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,     // deviation = |30 - 20| = 10, threshold = 2*25 = 50
      consecutive_breach_days: 1,
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(false)
    expect(result.persistence_days).toBe(0)
  })

  it('classifies as transitory when breaching but < 3 consecutive days', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,     // deviation = 60, threshold = 50 -> breaching
      consecutive_breach_days: 2,  // but only 2 days
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(false)
  })

  it('classifies as persistent when exceeding 2 stddev for 3+ consecutive days', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,     // deviation = 60, threshold = 50 -> breaching
      consecutive_breach_days: 4,  // 4 consecutive days
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(true)
    expect(result.persistence_days).toBe(4)
  })

  it('classifies as persistent at exactly 3 consecutive breach days', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 25,
      consecutive_breach_days: 3,
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(true)
    expect(result.persistence_days).toBe(3)
  })

  it('handles zero stddev gracefully (any deviation is infinite breach)', () => {
    const input: ResidualInput = {
      residual_bps: 50,
      rolling_avg_bps: 50,
      rolling_std_bps: 0,
      consecutive_breach_days: 5,
    }
    const result = classifyResidual(input)
    // deviation = 0, so breach_magnitude = 0 (no actual deviation)
    // Not breaching because there's no deviation from mean
    expect(result.is_persistent).toBe(false)
  })

  it('handles zero stddev with actual deviation (Infinity magnitude)', () => {
    const input: ResidualInput = {
      residual_bps: 60,
      rolling_avg_bps: 50,
      rolling_std_bps: 0,       // deviation = 10, stddev = 0 -> Infinity magnitude
      consecutive_breach_days: 5,
    }
    const result = classifyResidual(input)
    expect(result.is_persistent).toBe(true)
    expect(result.breach_magnitude).toBe(Infinity)
  })

  it('computes correct breach magnitude', () => {
    const input: ResidualInput = {
      residual_bps: 80,
      rolling_avg_bps: 20,
      rolling_std_bps: 10,     // deviation = 60, magnitude = 60/10 = 6.0
      consecutive_breach_days: 4,
    }
    const result = classifyResidual(input)
    expect(result.breach_magnitude).toBeCloseTo(6.0, 2)
  })
})
