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

describe('executability detection (promotional_teaser flag)', () => {
  it('flags quote when promotional_rate diverges > 2% from derived rate', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-IN-USD-INR',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      promotional_rate: 90.0, // derived = 83000/1000 = 83.0; divergence = 8.4%
      base_rate: 83.0,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000002',
      bronze_object_key: 'bronze.provider_raw:2',
    })
    expect(result.quality_flags).toContain('promotional_teaser')
  })

  it('does NOT flag when promotional_rate is within 2% of derived rate', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-IN-USD-INR',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      promotional_rate: 83.5, // derived = 83.0; divergence = 0.6%
      base_rate: 83.0,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000003',
      bronze_object_key: 'bronze.provider_raw:3',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('does NOT flag when no promotional_rate is present', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-IN-USD-INR',
      send_amount: 1000,
      fee_amount: 5,
      receive_amount: 83000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000004',
      bronze_object_key: 'bronze.provider_raw:4',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('does NOT flag when promotional_rate equals derived rate exactly', () => {
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      receive_amount: 1800,
      promotional_rate: 18.0, // derived = 1800/100 = 18.0; divergence = 0%
      base_rate: 17.5,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000005',
      bronze_object_key: 'bronze.provider_raw:5',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('does NOT flag at exactly 2.0% divergence (at boundary, threshold is strictly >2%)', () => {
    // derived = 1800/100 = 18.0; 2.0% of 18.0 = 0.36; promo = 18.36
    // divergence = |18.36 - 18.0| / 18.0 = 0.02 = exactly 2.0%, NOT > 2%
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      receive_amount: 1800,
      promotional_rate: 18.36,
      base_rate: 17.5,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000007',
      bronze_object_key: 'bronze.provider_raw:7',
    })
    expect(result.quality_flags).not.toContain('promotional_teaser')
  })

  it('flags at boundary: promotional_rate diverges exactly 2.1% from derived rate', () => {
    // derived = 1800/100 = 18.0
    // 2.1% of 18.0 = 0.378 => promotional_rate = 18.378
    const result = normalizeQuote({
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      send_amount: 100,
      fee_amount: 2,
      receive_amount: 1800,
      promotional_rate: 18.378,
      base_rate: 17.5,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      collected_at: new Date('2026-01-15T12:00:00.000Z'),
      ingestion_run_id: '00000000-0000-0000-0000-000000000006',
      bronze_object_key: 'bronze.provider_raw:6',
    })
    expect(result.quality_flags).toContain('promotional_teaser')
  })
})
