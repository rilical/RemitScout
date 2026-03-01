import { describe, expect, it } from 'vitest'

import {
  providerWeightingInternals,
} from '../scripts/provider-weighting-job'

const baseCounters = () => ({
  resolved: new Map<string, number>(),
  fallback: new Map<string, number>(),
  missing: new Map<string, number>(),
})

describe('provider weighting strategy resolution', () => {
  it('falls back through chain and resolves synthetic seed when reported/inferred are disabled', () => {
    const counters = baseCounters()
    const policy = {
      strategy: 'reported' as const,
      model_version: 'reported_v1',
      fallback_chain: ['reported', 'inferred_proxy', 'synthetic_seed', 'equal_weight'] as const,
      synthetic_seed: {
        default_weight: 0.2,
        default_confidence: 0.8,
        source_note: 'test',
        corridor_overrides: [],
      },
      reported: {
        enabled: false,
        source_ref: null,
        freshness_slo_hours: 24,
      },
      inferred_proxy: {
        enabled: false,
        factor_name: 'volume_proxy',
        lookback_days: 30,
      },
    }

    const resolved = providerWeightingInternals.resolveStrategyAwareWeight({
      policy,
      providerId: 'wise',
      corridorId: 'usd-gbp',
      liveScore: null,
      liveConfidence: 0,
      equalWeightRaw: 0.5,
    }, counters)

    expect(resolved.strategy).toBe('synthetic_seed')
    expect(resolved.modelVersion).toBe('synthetic_seed_v1')
    expect(resolved.rawScore).toBeCloseTo(0.2, 8)
    expect(counters.fallback.get('reported|inferred_proxy|disabled')).toBe(1)
    expect(counters.fallback.get('inferred_proxy|synthetic_seed|disabled')).toBe(1)
  })

  it('blends live score with synthetic seed using live confidence', () => {
    const counters = baseCounters()
    const policy = {
      strategy: 'synthetic_seed' as const,
      model_version: 'synthetic_seed_v1',
      fallback_chain: ['reported', 'inferred_proxy', 'synthetic_seed', 'equal_weight'] as const,
      synthetic_seed: {
        default_weight: 0.3,
        default_confidence: 0.6,
        source_note: 'test',
        corridor_overrides: [],
      },
      reported: {
        enabled: false,
        source_ref: null,
        freshness_slo_hours: 24,
      },
      inferred_proxy: {
        enabled: false,
        factor_name: 'volume_proxy',
        lookback_days: 30,
      },
    }

    const resolved = providerWeightingInternals.resolveStrategyAwareWeight({
      policy,
      providerId: 'wise',
      corridorId: 'usd-gbp',
      liveScore: 0.8,
      liveConfidence: 0.25,
      equalWeightRaw: 0.5,
    }, counters)

    // raw = (live_confidence * live_score) + ((1 - live_confidence) * seed_weight)
    expect(resolved.rawScore).toBeCloseTo(0.425, 8)
    expect(resolved.confidence).toBeCloseTo(0.425, 8)
  })

  it('uses equal_weight when all preceding strategies fail', () => {
    const counters = baseCounters()
    const policy = {
      strategy: 'reported' as const,
      model_version: 'reported_v1',
      fallback_chain: ['reported', 'equal_weight'] as const,
      synthetic_seed: {
        default_weight: 0.3,
        default_confidence: 0.6,
        source_note: 'test',
        corridor_overrides: [],
      },
      reported: {
        enabled: false,
        source_ref: null,
        freshness_slo_hours: 24,
      },
      inferred_proxy: {
        enabled: false,
        factor_name: 'volume_proxy',
        lookback_days: 30,
      },
    }

    const resolved = providerWeightingInternals.resolveStrategyAwareWeight({
      policy,
      providerId: 'wise',
      corridorId: 'usd-gbp',
      liveScore: null,
      liveConfidence: 0,
      equalWeightRaw: 0.2,
    }, counters)

    expect(resolved.strategy).toBe('equal_weight')
    expect(resolved.modelVersion).toBe('equal_weight_v1')
    expect(resolved.rawScore).toBeCloseTo(0.2, 8)
    expect(counters.fallback.get('reported|equal_weight|disabled')).toBe(1)
  })
})
