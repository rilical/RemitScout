import { describe, expect, it } from 'vitest'

import { normalizeQuote } from '../plane-b/src/normalize/quote-normalizer'

describe('normalizeQuote promo fields', () => {
  it('keeps promotional fields when valid', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      total_debit_amount: 102,
      receive_amount: 1800,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2025-01-01T00:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000001',
      bronze_object_key: 'bronze.provider_raw:1',
      promotional_rate: 18.03,
      base_rate: 17.21,
      promotional_cap_amount: 1000,
      promotional_fee_amount: 1.25,
    })

    expect(result.promotional_rate).toBe(18.03)
    expect(result.base_rate).toBe(17.21)
    expect(result.promotional_cap_amount).toBe(1000)
    expect(result.promotional_fee_amount).toBe(1.25)
  })

  it('coerces invalid promotional fields to null', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      total_debit_amount: 102,
      receive_amount: 1800,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2025-01-01T00:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000001',
      bronze_object_key: 'bronze.provider_raw:1',
      promotional_rate: Number.NaN,
      base_rate: Number.NaN,
      promotional_cap_amount: Number.NaN,
      promotional_fee_amount: Number.NaN,
    })

    expect(result.promotional_rate).toBeNull()
    expect(result.base_rate).toBeNull()
    expect(result.promotional_cap_amount).toBeNull()
    expect(result.promotional_fee_amount).toBeNull()
  })
})
