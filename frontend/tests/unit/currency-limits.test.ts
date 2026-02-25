import { describe, expect, it } from 'vitest'
import {
  getMaxAmount,
  getMinAmount,
  isValidAmount,
  sanitizeAmount,
} from '../../utils/currency-limits'

describe('currency limits', () => {
  it('computes USD min/max with expected bounds', () => {
    expect(getMinAmount('USD')).toBe(50)
    expect(getMaxAmount('USD')).toBe(10000)
  })

  it('sanitizes and clamps amounts when strict', () => {
    const sanitized = sanitizeAmount('10', 'USD')
    expect(sanitized).toBe(50)
    expect(sanitizeAmount(20000, 'USD')).toBe(10000)
  })

  it('validates amounts based on limits', () => {
    expect(isValidAmount(25, 'USD')).toBe(false)
    expect(isValidAmount(500, 'USD')).toBe(true)
  })
})
