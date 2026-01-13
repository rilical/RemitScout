import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractRiaMethodPairs, parseRiaPayload } from '../plane-b/src/providers/ria/parse'

type RiaPayload = {
  quote?: {
    individualQuotes?: Array<{
      settlementMethod?: string | null
      deliveryMethod?: string | null
      rate?: string | number | null
      buyAmount?: string | number | null
      transferFee?: string | number | null
      leadTime?: string | null
      isEnabled?: boolean | null
    }>
    availableSettlementProxies?: Array<{
      name?: string | null
      defaultSettlementMethod?: string | null
    }>
    errorMessages?: Record<string, { message?: string }> | null
  } | null
  errorMessages?: Record<string, { message?: string }> | null
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'ria',
  'fixtures',
  'corridors',
)

const corridorId = 'US-MX-USD-MXN'

const loadPayload = (corridor: string): RiaPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as RiaPayload
}

const buildRequest = (): CollectorRequest => ({
  provider_id: 'ria',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

describe('ria parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractRiaMethodPairs(payload)
    const expectedPairs = [
      { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
      { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
      { payin_method: 'bank_transfer', payout_method: 'mobile_wallet' },
      { payin_method: 'debit_card', payout_method: 'bank_deposit' },
      { payin_method: 'debit_card', payout_method: 'cash_pickup' },
      { payin_method: 'debit_card', payout_method: 'mobile_wallet' },
      { payin_method: 'credit_card', payout_method: 'bank_deposit' },
      { payin_method: 'credit_card', payout_method: 'cash_pickup' },
      { payin_method: 'credit_card', payout_method: 'mobile_wallet' },
      { payin_method: 'apple_pay', payout_method: 'bank_deposit' },
      { payin_method: 'apple_pay', payout_method: 'cash_pickup' },
      { payin_method: 'apple_pay', payout_method: 'mobile_wallet' },
      { payin_method: 'google_pay', payout_method: 'bank_deposit' },
      { payin_method: 'google_pay', payout_method: 'cash_pickup' },
      { payin_method: 'google_pay', payout_method: 'mobile_wallet' },
    ]

    const toKey = (pair: { payin_method: string; payout_method: string }) =>
      `${pair.payin_method}:${pair.payout_method}`
    const expectedKeys = expectedPairs.map(toKey).sort()
    const actualKeys = methodPairs.map(toKey).sort()

    expect(actualKeys).toEqual(expectedKeys)

    const parsed = parseRiaPayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.base_rate).toBe(17.81)
    expect(parsed.promotional_rate).toBeNull()
    expect(parsed.fee_amount).toBe(4)
    expect(parsed.receive_amount).toBeCloseTo(1781, 2)
    expect(parsed.delivery_time_min_minutes).toBe(4320)
    expect(parsed.delivery_time_max_minutes).toBe(4320)
  })

  it('returns null on error messages', () => {
    const payload: RiaPayload = {
      errorMessages: { BAD: { message: 'Bad corridor' } },
    }

    const parsed = parseRiaPayload(payload, buildRequest())
    expect(parsed).toBeNull()
  })
})
