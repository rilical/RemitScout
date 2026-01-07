import { describe, it, expect } from 'vitest'

describe('providers route utilities', () => {
  describe('normalizeToken', () => {
    const normalizeToken = (value: string): string => {
      if (!value || typeof value !== 'string') return ''
      return value
        .trim()
        .toLowerCase()
        .replace(/[\s\-._/]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    }

    it('normalizes simple string', () => {
      expect(normalizeToken('Bank Transfer')).toBe('bank_transfer')
    })

    it('handles empty string', () => {
      expect(normalizeToken('')).toBe('')
    })

    it('handles null/undefined', () => {
      expect(normalizeToken(null as any)).toBe('')
      expect(normalizeToken(undefined as any)).toBe('')
    })

    it('replaces spaces and dashes with underscores', () => {
      expect(normalizeToken('bank-transfer')).toBe('bank_transfer')
      expect(normalizeToken('bank transfer')).toBe('bank_transfer')
      expect(normalizeToken('bank.transfer')).toBe('bank_transfer')
    })

    it('collapses multiple underscores', () => {
      expect(normalizeToken('bank__transfer')).toBe('bank_transfer')
      expect(normalizeToken('bank___transfer')).toBe('bank_transfer')
    })

    it('removes leading/trailing underscores', () => {
      expect(normalizeToken('_bank_transfer_')).toBe('bank_transfer')
      expect(normalizeToken('__bank__')).toBe('bank')
    })

    it('converts to lowercase', () => {
      expect(normalizeToken('BANK TRANSFER')).toBe('bank_transfer')
      expect(normalizeToken('Bank Transfer')).toBe('bank_transfer')
    })
  })

  describe('toCanonicalPayinMethod', () => {
    const canonicalPayinMethods: readonly string[] = [
      'bank_transfer',
      'debit_card',
      'credit_card',
      'apple_pay',
      'google_pay',
      'cash',
      'other',
    ]

    const toCanonicalPayinMethod = (value?: string | null): string => {
      if (!value) return 'other'
      const token = value
        .trim()
        .toLowerCase()
        .replace(/[\s\-._/]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      if (canonicalPayinMethods.includes(token)) {
        return token
      }
      return 'other'
    }

    it('returns canonical method for valid input', () => {
      expect(toCanonicalPayinMethod('bank_transfer')).toBe('bank_transfer')
      expect(toCanonicalPayinMethod('debit_card')).toBe('debit_card')
      expect(toCanonicalPayinMethod('credit_card')).toBe('credit_card')
    })

    it('normalizes input before checking', () => {
      expect(toCanonicalPayinMethod('Bank Transfer')).toBe('bank_transfer')
      expect(toCanonicalPayinMethod('bank-transfer')).toBe('bank_transfer')
      expect(toCanonicalPayinMethod('BANK_TRANSFER')).toBe('bank_transfer')
    })

    it('returns other for invalid input', () => {
      expect(toCanonicalPayinMethod('invalid_method')).toBe('other')
      expect(toCanonicalPayinMethod('unknown')).toBe('other')
    })

    it('returns other for null/undefined', () => {
      expect(toCanonicalPayinMethod(null)).toBe('other')
      expect(toCanonicalPayinMethod(undefined)).toBe('other')
    })
  })

  describe('toCanonicalPayoutMethod', () => {
    const canonicalPayoutMethods: readonly string[] = [
      'bank_deposit',
      'cash_pickup',
      'mobile_wallet',
      'airtime',
      'other',
    ]

    const toCanonicalPayoutMethod = (value?: string | null): string => {
      if (!value) return 'other'
      const token = value
        .trim()
        .toLowerCase()
        .replace(/[\s\-._/]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      if (canonicalPayoutMethods.includes(token)) {
        return token
      }
      return 'other'
    }

    it('returns canonical method for valid input', () => {
      expect(toCanonicalPayoutMethod('bank_deposit')).toBe('bank_deposit')
      expect(toCanonicalPayoutMethod('cash_pickup')).toBe('cash_pickup')
      expect(toCanonicalPayoutMethod('mobile_wallet')).toBe('mobile_wallet')
    })

    it('normalizes input before checking', () => {
      expect(toCanonicalPayoutMethod('Bank Deposit')).toBe('bank_deposit')
      expect(toCanonicalPayoutMethod('cash-pickup')).toBe('cash_pickup')
      expect(toCanonicalPayoutMethod('MOBILE_WALLET')).toBe('mobile_wallet')
    })

    it('returns other for invalid input', () => {
      expect(toCanonicalPayoutMethod('invalid_method')).toBe('other')
      expect(toCanonicalPayoutMethod('unknown')).toBe('other')
    })

    it('returns other for null/undefined', () => {
      expect(toCanonicalPayoutMethod(null)).toBe('other')
      expect(toCanonicalPayoutMethod(undefined)).toBe('other')
    })
  })

  describe('formatTransferTime', () => {
    const formatTransferTime = (minMinutes: number | null, maxMinutes: number | null) => {
      if (minMinutes === null && maxMinutes === null) {
        return { min: 0, max: 0, label: 'Unknown' }
      }
      if (minMinutes === null) minMinutes = maxMinutes || 0
      if (maxMinutes === null) maxMinutes = minMinutes

      const minHrs = Math.round(minMinutes / 60)
      const maxHrs = Math.round(maxMinutes / 60)

      let label = ''
      if (minHrs === 0 && maxHrs === 0) {
        label = 'Instant'
      } else if (minHrs === maxHrs) {
        label = `${minHrs} ${minHrs === 1 ? 'hour' : 'hours'}`
      } else {
        label = `${minHrs}-${maxHrs} ${maxHrs === 1 ? 'hour' : 'hours'}`
      }

      return { min: minHrs, max: maxHrs, label }
    }

    it('returns Unknown for null values', () => {
      const result = formatTransferTime(null, null)
      expect(result).toEqual({ min: 0, max: 0, label: 'Unknown' })
    })

    it('returns Instant for zero minutes', () => {
      const result = formatTransferTime(0, 0)
      expect(result).toEqual({ min: 0, max: 0, label: 'Instant' })
    })

    it('formats single hour correctly', () => {
      const result = formatTransferTime(60, 60)
      expect(result).toEqual({ min: 1, max: 1, label: '1 hour' })
    })

    it('formats multiple hours correctly', () => {
      const result = formatTransferTime(120, 120)
      expect(result).toEqual({ min: 2, max: 2, label: '2 hours' })
    })

    it('formats range correctly', () => {
      const result = formatTransferTime(60, 120)
      expect(result).toEqual({ min: 1, max: 2, label: '1-2 hours' })
    })

    it('handles null minMinutes', () => {
      const result = formatTransferTime(null, 120)
      expect(result).toEqual({ min: 2, max: 2, label: '2 hours' })
    })

    it('handles null maxMinutes', () => {
      const result = formatTransferTime(60, null)
      expect(result).toEqual({ min: 1, max: 1, label: '1 hour' })
    })

    it('rounds minutes to hours', () => {
      const result = formatTransferTime(90, 90)
      expect(result).toEqual({ min: 2, max: 2, label: '2 hours' })
    })
  })
})



