import { describe, expect, it } from 'vitest'
import { BASE_CURRENCIES, getAvailableCurrencies, getCountryCurrencies } from '~/utils/countries-currencies'

describe('countries-currencies', () => {
  it('keeps country-bound currency lists strict', () => {
    expect(getCountryCurrencies('BN')).toEqual(['BND'])
    expect(getAvailableCurrencies('BN')).toEqual(['BND'])
    expect(getAvailableCurrencies('US')).toEqual(['USD'])
  })

  it('falls back to base currencies only when no country mapping exists', () => {
    expect(getCountryCurrencies('ZZ')).toEqual([])
    expect(getAvailableCurrencies('ZZ')).toEqual(BASE_CURRENCIES)
  })
})
