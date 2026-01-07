import { describe, it, expect } from 'vitest'
import { evaluatePublisherGates } from '../plane-c/src/services/publisher-gates'

describe('Publisher gates guardrails', () => {
  it('N>=3 provider requirement', () => {
    const result2 = evaluatePublisherGates({
      contributor_count: 2,
      top_provider_share: 0.3,
      top_two_share: 0.5,
    })
    expect(result2.allowed).toBe(false)
    expect(result2.reasons).toContain('insufficient_contributors')

    const result3 = evaluatePublisherGates({
      contributor_count: 3,
      top_provider_share: 0.3,
      top_two_share: 0.5,
    })
    expect(result3.allowed).toBe(true)
    expect(result3.reasons).toHaveLength(0)

    const result4 = evaluatePublisherGates({
      contributor_count: 4,
      top_provider_share: 0.25,
      top_two_share: 0.45,
    })
    expect(result4.allowed).toBe(true)
  })

  it('dominance check prevents publishing', () => {
    const resultTopProvider = evaluatePublisherGates({
      contributor_count: 3,
      top_provider_share: 0.51,
      top_two_share: 0.7,
    })
    expect(resultTopProvider.allowed).toBe(false)
    expect(resultTopProvider.reasons).toContain('dominance_top_provider')

    const resultTopTwo = evaluatePublisherGates({
      contributor_count: 3,
      top_provider_share: 0.4,
      top_two_share: 0.76,
    })
    expect(resultTopTwo.allowed).toBe(false)
    expect(resultTopTwo.reasons).toContain('dominance_top_two')

    const resultBalanced = evaluatePublisherGates({
      contributor_count: 3,
      top_provider_share: 0.35,
      top_two_share: 0.65,
    })
    expect(resultBalanced.allowed).toBe(true)
    expect(resultBalanced.reasons).toHaveLength(0)
  })

  it('publisher gates applied in Plane C', () => {
    const missingCount = evaluatePublisherGates({
      top_provider_share: 0.3,
      top_two_share: 0.5,
    })
    expect(missingCount.allowed).toBe(false)
    expect(missingCount.reasons).toContain('missing_contributor_count')

    const missingDominance = evaluatePublisherGates({
      contributor_count: 3,
    })
    expect(missingDominance.allowed).toBe(false)
    expect(missingDominance.reasons).toContain('missing_dominance_metrics')

    const valid = evaluatePublisherGates({
      contributor_count: 3,
      top_provider_share: 0.33,
      top_two_share: 0.66,
    })
    expect(valid.allowed).toBe(true)
  })

  it('all gates must pass for publishing', () => {
    const allFail = evaluatePublisherGates({
      contributor_count: 2,
      top_provider_share: 0.6,
      top_two_share: 0.8,
    })
    expect(allFail.allowed).toBe(false)
    expect(allFail.reasons).toContain('insufficient_contributors')
    expect(allFail.reasons).toContain('dominance_top_provider')
    expect(allFail.reasons).toContain('dominance_top_two')

    const allPass = evaluatePublisherGates({
      contributor_count: 5,
      top_provider_share: 0.25,
      top_two_share: 0.45,
    })
    expect(allPass.allowed).toBe(true)
    expect(allPass.reasons).toHaveLength(0)
  })
})




