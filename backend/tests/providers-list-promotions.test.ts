import { describe, expect, it } from 'vitest'

import type { LatestQuoteByCorridorRecord } from '../plane-a/src/repositories/interfaces/latest-quote-repository.interface'
import { __providersListTestables } from '../plane-a/src/routes/providers/providers-list'

const baseQuote: LatestQuoteByCorridorRecord = {
  provider_id: 'remitly',
  corridor_id: 'US-AL-USD-ALL',
  amount_bucket: 500,
  payin: 'debit_card',
  payout: 'bank_deposit',
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  delivery_time_min_minutes: 15,
  delivery_time_max_minutes: 60,
  collected_at: '2026-03-11T12:00:00.000Z',
  send_amount: 500,
  fee_amount: 1.99,
  total_debit_amount: 500,
  promotional_fee_amount: 0,
  receive_amount: 42000,
  implied_fx_rate: 84,
  promotional_rate: 84,
  base_rate: 82.76,
  promotional_cap_amount: 500,
  quality_flags: [],
  updated_at: '2026-03-11T12:00:00.000Z',
}

describe('providers list promo display selection', () => {
  it('uses base_rate and derived standard receive amount for canonical comparison metrics', () => {
    const result = __providersListTestables.resolveStandardQuoteDisplay(baseQuote)

    expect(result.rate).toBe(82.76)
    expect(result.receivedAmount).toBeCloseTo(41380, 6)
  })

  it('keeps the promotional receive amount attached to promo metadata', () => {
    const standard = __providersListTestables.resolveStandardQuoteDisplay(baseQuote)
    const promo = __providersListTestables.resolvePromoQuoteDisplay(
      baseQuote,
      standard.rate,
      standard.receivedAmount,
    )

    expect(promo).not.toBeNull()
    expect(promo?.rate).toBe(84)
    expect(promo?.receivedAmount).toBe(42000)
  })
})
