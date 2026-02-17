// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { planToPulseLevel } from '~/composables/useEntitlements'

describe('useEntitlements helpers', () => {
  it('planToPulseLevel maps free -> none', () => {
    expect(planToPulseLevel('free')).toBe('none')
  })

  it('planToPulseLevel maps plus -> lite', () => {
    expect(planToPulseLevel('plus')).toBe('lite')
  })

  it('planToPulseLevel maps enterprise -> pro', () => {
    expect(planToPulseLevel('enterprise')).toBe('pro')
  })
})
