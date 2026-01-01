import { describe, expect, it } from 'vitest'

import { destinationCountries, sourceCountries } from '../plane-b/src/providers/remitly/catalog'

describe('remitly catalog', () => {
  it('keeps base source countries stable', () => {
    const expectedSources = [
      'AE',
      'AT',
      'AU',
      'BE',
      'CA',
      'CY',
      'CZ',
      'DE',
      'DK',
      'ES',
      'FI',
      'FR',
      'GB',
      'GR',
      'IE',
      'IT',
      'LI',
      'LT',
      'LV',
      'MT',
      'NL',
      'NO',
      'NZ',
      'PL',
      'PT',
      'RO',
      'SE',
      'SG',
      'SK',
      'US',
    ]

    expect(sourceCountries).toEqual(expectedSources)
    expect(new Set(sourceCountries).size).toBe(sourceCountries.length)
  })

  it('ships with a non-empty destination list', () => {
    expect(destinationCountries.length).toBeGreaterThan(0)
    expect(new Set(destinationCountries).size).toBe(destinationCountries.length)
    expect(destinationCountries).toEqual(expect.arrayContaining(['PH', 'LB', 'KE']))
  })
})
