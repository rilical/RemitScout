import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import {
  extractWorldRemitMethodPairs,
  parseWorldRemitPayload,
} from '../plane-b/src/providers/worldremit/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'worldremit',
  'fixtures',
  'corridors',
)

const corridorId = 'US-KE-USD-KES'

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (payin_method: string, payout_method: string): CollectorRequest => ({
  provider_id: 'worldremit',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method,
  payout_method,
  send_amount: 100,
  locale: 'en-US',
})

describe('worldremit parse', () => {
  it('extracts method pairs and promo fields', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractWorldRemitMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'debit_card', payout_method: 'mobile_wallet' },
        { payin_method: 'credit_card', payout_method: 'mobile_wallet' },
      ]),
    )

    const parsed = parseWorldRemitPayload(payload, buildRequest('bank_transfer', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('debit_card')
    expect(parsed.payout_method).toBe('mobile_wallet')
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.promotional_fee_amount).toBeNull()
    expect(parsed.total_debit_amount).toBe(100)
    expect(parsed.promotional_rate).toBeCloseTo(130.0354, 4)
    expect(parsed.base_rate).toBeCloseTo(127.4584, 4)
    expect(parsed.delivery_time_min_minutes).toBe(0)
    expect(parsed.delivery_time_max_minutes).toBe(5)
  })

  it('selects the requested payin method when available', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseWorldRemitPayload(payload, buildRequest('debit_card', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('debit_card')
    expect(parsed.total_debit_amount).toBe(100)
  })

  it('uses the selected payin total when fees differ', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseWorldRemitPayload(payload, buildRequest('credit_card', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('credit_card')
    expect(parsed.fee_amount).toBe(3)
    expect(parsed.total_debit_amount).toBe(103)
  })
  })
