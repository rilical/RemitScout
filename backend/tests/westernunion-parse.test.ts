import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import {
  extractWesternUnionMethodPairs,
  parseWesternUnionPayload,
} from '../plane-b/src/providers/westernunion/parse'

type WUPayGroup = {
  fund_in?: string | null
  fx_rate?: number | string | null
  promotional_fx_rate?: number | string | null
  promo_fx_rate?: number | string | null
  gross_fee?: number | string | null
  net_fee?: number | string | null
  send_amount?: number | string | null
  receive_amount?: number | string | null
}

type WUServiceGroup = {
  service?: string | null
  service_name?: string | null
  speed_days?: number | string | null
  pay_groups?: WUPayGroup[] | null
}

type WUResponse = {
  response_status?: { status?: number | null } | null
  services_groups?: WUServiceGroup[] | null
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'westernunion',
  'fixtures',
  'corridors',
)

const corridorId = 'US-MX-USD-MXN'

const loadPayload = (corridor: string): WUResponse => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as WUResponse
}

const buildRequest = (payin_method: string, payout_method: string): CollectorRequest => ({
  provider_id: 'westernunion',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method,
  payout_method,
  send_amount: 100,
  locale: 'en-US',
})

describe('westernunion parse', () => {
  it('extracts method pairs and promo cash pickup rates', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractWesternUnionMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'credit_card', payout_method: 'cash_pickup' },
        { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'google_pay', payout_method: 'mobile_wallet' },
      ]),
    )

    const parsed = parseWesternUnionPayload(payload, buildRequest('credit_card', 'cash_pickup'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.promotional_rate).toBe(17.8)
    expect(parsed.base_rate).toBe(17.2)
    expect(parsed.fee_amount).toBe(2.99)
    expect(parsed.promotional_fee_amount).toBe(2.5)
    expect(parsed.delivery_time_min_minutes).toBe(15)
    expect(parsed.delivery_time_max_minutes).toBe(60)
  })

  it('uses promo_fx_rate for bank deposit delivery windows', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseWesternUnionPayload(payload, buildRequest('debit_card', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.promotional_rate).toBe(17.6)
    expect(parsed.base_rate).toBe(17.1)
    expect(parsed.promotional_fee_amount).toBeNull()
    expect(parsed.delivery_time_min_minutes).toBe(60)
    expect(parsed.delivery_time_max_minutes).toBe(24 * 60)
  })

  it('falls back to the best fx option when exact pair is missing', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseWesternUnionPayload(payload, buildRequest('cash', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.parse_flags).toContain('partial_data')
    expect(parsed.base_rate).toBe(17.3)
  })
})
