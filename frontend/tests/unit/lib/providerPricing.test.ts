// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { resolveComparableProviderPricing } from '~/lib/providerPricing'

describe('resolveComparableProviderPricing', () => {
  it('keeps new-customer promo pricing out of canonical comparison math', () => {
    const pricing = resolveComparableProviderPricing({
      feeAmount: 1.99,
      fxRate: 82.76,
      hasPromo: true,
      promoInfo: {
        fee: 0,
        rate: 84,
        newCustomersOnly: true,
      },
    })

    expect(pricing).toEqual({
      providerRate: 82.76,
      upfrontFee: 1.99,
    })
  })

  it('still allows universally applicable promo pricing to override the base quote', () => {
    const pricing = resolveComparableProviderPricing({
      feeAmount: 2.99,
      fxRate: 80,
      hasPromo: true,
      promoInfo: {
        fee: 0,
        rate: 81.5,
        newCustomersOnly: false,
      },
    })

    expect(pricing).toEqual({
      providerRate: 81.5,
      upfrontFee: 0,
    })
  })
})
