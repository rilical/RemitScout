// @vitest-environment jsdom
import { flushPromises } from '@vue/test-utils'
import { effectScope, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request,
  }),
}))

import { useCorridorCurrencies } from '~/composables/useCorridorCurrencies'

describe('useCorridorCurrencies', () => {
  beforeEach(() => {
    request.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('removes unsupported receive currencies from a corridor and resets invalid selections', async () => {
    request.mockResolvedValue({
      from: 'US',
      to: 'BN',
      fromCurrencies: ['USD'],
      toCurrencies: ['BND'],
      pairs: [
        { fromCurrency: 'USD', toCurrency: 'BND' },
      ],
    })

    const fromCountry = ref('US')
    const toCountry = ref('BN')
    const fromCurrency = ref('USD')
    const toCurrency = ref('USD')
    const scope = effectScope()
    const state = scope.run(() =>
      useCorridorCurrencies(fromCountry, toCountry, fromCurrency, toCurrency),
    )

    await flushPromises()

    expect(request).toHaveBeenCalledWith('/corridor-currencies', expect.objectContaining({
      query: { from: 'US', to: 'BN' },
    }))
    expect(state?.availableFromCurrencies.value).toEqual(['USD'])
    expect(state?.availableToCurrencies.value).toEqual(['BND'])
    expect(toCurrency.value).toBe('BND')

    scope.stop()
  })

  it('falls back to country currencies when the corridor lookup fails', async () => {
    request.mockRejectedValue(new Error('network down'))

    const scope = effectScope()
    const state = scope.run(() =>
      useCorridorCurrencies(ref('US'), ref('BN')),
    )

    await flushPromises()

    expect(state?.availableFromCurrencies.value).toEqual(['USD'])
    expect(state?.availableToCurrencies.value).toEqual(['BND'])

    scope.stop()
  })
})
