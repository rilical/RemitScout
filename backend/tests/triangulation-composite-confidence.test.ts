import { describe, expect, it } from 'vitest'

import { computeCompositeConfidenceScore } from '../plane-b/src/triangulation/engine'

describe('triangulation composite confidence', () => {
  it('renormalizes confidence downward when signal layers are missing', () => {
    const fullLayerScore = computeCompositeConfidenceScore({
      weightConfidence: 0.8,
      suppressionFlag: false,
      stressScore: 0.1,
      hasPriceSignal: true,
      hasFrictionSignal: true,
      hasVolatilitySignal: true,
      hasStressSignal: true,
    })

    const missingLayerScore = computeCompositeConfidenceScore({
      weightConfidence: 0.8,
      suppressionFlag: false,
      stressScore: 0.1,
      hasPriceSignal: true,
      hasFrictionSignal: false,
      hasVolatilitySignal: false,
      hasStressSignal: false,
    })

    expect(fullLayerScore).toBeGreaterThan(missingLayerScore)
  })

  it('downgrades confidence when suppression and stress are both present', () => {
    const calmScore = computeCompositeConfidenceScore({
      weightConfidence: 0.7,
      suppressionFlag: false,
      stressScore: 0.05,
      hasPriceSignal: true,
      hasFrictionSignal: true,
      hasVolatilitySignal: true,
      hasStressSignal: false,
    })

    const stressedScore = computeCompositeConfidenceScore({
      weightConfidence: 0.7,
      suppressionFlag: true,
      stressScore: 0.8,
      hasPriceSignal: true,
      hasFrictionSignal: true,
      hasVolatilitySignal: true,
      hasStressSignal: true,
    })

    expect(calmScore).toBeGreaterThan(stressedScore)
  })
})
