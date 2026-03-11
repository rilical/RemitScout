// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { formatExchangeRateLabel, formatExchangeRateValue } from '~/lib/exchangeRateFormat'

describe('exchangeRateFormat', () => {
  it('truncates exchange rates to 3 decimals instead of rounding up', () => {
    expect(formatExchangeRateValue(0.8699)).toBe('0.869')
    expect(formatExchangeRateValue(1.2799)).toBe('1.279')
  })

  it('pads trailing zeroes to keep 3 decimal places', () => {
    expect(formatExchangeRateValue(0.86)).toBe('0.860')
    expect(formatExchangeRateLabel(0.86, 'USD', 'EUR')).toBe('1 USD -> 0.860 EUR')
  })
})
