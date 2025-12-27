import { describe, it, expect } from 'vitest'
import { getEntitlementsForPlan } from '../plane-a/src/services/entitlements'

describe('entitlements mapping', () => {
  it('returns free defaults for unknown plans', () => {
    const entitlements = getEntitlementsForPlan('unknown')
    expect(entitlements.exports_enabled).toBe(false)
    expect(entitlements.pulse_access).toBe('none')
  })

  it('returns plus entitlements', () => {
    const entitlements = getEntitlementsForPlan('plus')
    expect(entitlements.exports_enabled).toBe(true)
    expect(entitlements.pulse_access).toBe('full')
  })

  it('returns enterprise entitlements', () => {
    const entitlements = getEntitlementsForPlan('enterprise')
    expect(entitlements.exports_enabled).toBe(true)
    expect(entitlements.pulse_access).toBe('full')
  })
})
