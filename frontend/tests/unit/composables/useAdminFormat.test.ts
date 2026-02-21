import { describe, expect, it } from 'vitest'
import { useAdminFormat } from '~/composables/useAdminFormat'

describe('useAdminFormat', () => {
  it('formats numbers with digit shorthand and option objects', () => {
    const { formatNumber } = useAdminFormat()

    expect(formatNumber(1234.567, 2)).toBe('1,234.57')
    expect(formatNumber(1234.567, { maximumFractionDigits: 1 })).toBe('1,234.6')
  })

  it('returns placeholder for invalid numeric values', () => {
    const { formatNumber, formatPercent } = useAdminFormat()

    expect(formatNumber('not-a-number')).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
  })

  it('formats timestamps and keeps invalid values safe', () => {
    const { formatTimestamp } = useAdminFormat()

    expect(formatTimestamp('2026-02-21T10:00:00.000Z')).not.toBe('—')
    expect(formatTimestamp('invalid-date')).toBe('—')
  })
})
