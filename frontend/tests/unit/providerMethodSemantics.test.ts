import { describe, expect, it } from 'vitest'
import {
  normalizeProviderMethod,
  orderProviderMethods,
  resolvePayoutMethodSelection,
  shouldCacheProviderSuccess,
} from '~/utils/providerMethodSemantics'

describe('providerMethodSemantics', () => {
  it('normalizes provider methods into the supported UI set', () => {
    expect(normalizeProviderMethod('bank_deposit')).toBe('bank')
    expect(normalizeProviderMethod('cash-pickup')).toBe('cash')
    expect(normalizeProviderMethod('mobile_wallet')).toBe('wallet')
    expect(normalizeProviderMethod('home_delivery')).toBe('home')
    expect(normalizeProviderMethod('debit_card')).toBe('card')
  })

  it('orders and deduplicates methods without inventing a fallback', () => {
    expect(orderProviderMethods(['wallet', 'bank', 'wallet', 'cash_pickup'])).toEqual(['bank', 'cash', 'wallet'])
    expect(orderProviderMethods([])).toEqual([])
  })

  it('keeps the current payout method when no quote-backed methods are available', () => {
    expect(resolvePayoutMethodSelection('bank', [])).toBe('bank')
    expect(resolvePayoutMethodSelection('bank', ['wallet'])).toBe('wallet')
  })

  it('does not cache successful warming payloads as the last quote-backed success', () => {
    expect(shouldCacheProviderSuccess({
      data: [],
      error: { code: 'quotes_unavailable' },
    })).toBe(false)

    expect(shouldCacheProviderSuccess({
      data: [{ provider: 'wise' }],
      error: null,
    })).toBe(true)
  })
})
