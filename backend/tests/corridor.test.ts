import { describe, it, expect } from 'vitest'
import {
  parseCorridorId,
  requireCorridorId,
  formatCorridorId,
  type ParsedCorridorId,
} from '../shared/corridor'

describe('corridor', () => {
  describe('parseCorridorId', () => {
    it('parses valid corridor ID', () => {
      const result = parseCorridorId('US-MX-USD-MXN')

      expect(result).toEqual({
        sourceCountry: 'US',
        destCountry: 'MX',
        sourceCurrency: 'USD',
        destCurrency: 'MXN',
      })
    })

    it('returns null for empty string', () => {
      const result = parseCorridorId('')

      expect(result).toBeNull()
    })

    it('returns null for invalid format (too few parts)', () => {
      const result = parseCorridorId('US-MX-USD')

      expect(result).toBeNull()
    })

    it('returns null for invalid format (too many parts)', () => {
      const result = parseCorridorId('US-MX-USD-MXN-EXTRA')

      expect(result).toBeNull()
    })

    it('returns null for missing parts', () => {
      expect(parseCorridorId('US--USD-MXN')).toBeNull()
      expect(parseCorridorId('-MX-USD-MXN')).toBeNull()
      expect(parseCorridorId('US-MX--MXN')).toBeNull()
      expect(parseCorridorId('US-MX-USD-')).toBeNull()
    })

    it('handles various country codes', () => {
      const result = parseCorridorId('GB-PH-GBP-PHP')

      expect(result).toEqual({
        sourceCountry: 'GB',
        destCountry: 'PH',
        sourceCurrency: 'GBP',
        destCurrency: 'PHP',
      })
    })

    it('handles various currency codes', () => {
      const result = parseCorridorId('CA-IN-CAD-INR')

      expect(result).toEqual({
        sourceCountry: 'CA',
        destCountry: 'IN',
        sourceCurrency: 'CAD',
        destCurrency: 'INR',
      })
    })
  })

  describe('requireCorridorId', () => {
    it('returns parsed corridor ID for valid input', () => {
      const result = requireCorridorId('US-MX-USD-MXN')

      expect(result).toEqual({
        sourceCountry: 'US',
        destCountry: 'MX',
        sourceCurrency: 'USD',
        destCurrency: 'MXN',
      })
    })

    it('throws error for invalid corridor ID', () => {
      expect(() => requireCorridorId('invalid')).toThrow(
        'invalid corridor_id: invalid',
      )
    })

    it('throws error for empty string', () => {
      expect(() => requireCorridorId('')).toThrow('invalid corridor_id: ')
    })

    it('throws error for malformed corridor ID', () => {
      expect(() => requireCorridorId('US-MX')).toThrow(
        'invalid corridor_id: US-MX',
      )
    })
  })

  describe('formatCorridorId', () => {
    it('formats parsed corridor ID', () => {
      const parsed: ParsedCorridorId = {
        sourceCountry: 'US',
        destCountry: 'MX',
        sourceCurrency: 'USD',
        destCurrency: 'MXN',
      }

      const result = formatCorridorId(parsed)

      expect(result).toBe('US-MX-USD-MXN')
    })

    it('formats various country and currency combinations', () => {
      const parsed: ParsedCorridorId = {
        sourceCountry: 'GB',
        destCountry: 'PH',
        sourceCurrency: 'GBP',
        destCurrency: 'PHP',
      }

      const result = formatCorridorId(parsed)

      expect(result).toBe('GB-PH-GBP-PHP')
    })

    it('round-trips with parseCorridorId', () => {
      const original = 'US-MX-USD-MXN'
      const parsed = parseCorridorId(original)!

      expect(parsed).not.toBeNull()
      const formatted = formatCorridorId(parsed)

      expect(formatted).toBe(original)
    })

    it('round-trips with requireCorridorId', () => {
      const original = 'CA-IN-CAD-INR'
      const parsed = requireCorridorId(original)
      const formatted = formatCorridorId(parsed)

      expect(formatted).toBe(original)
    })
  })
})


