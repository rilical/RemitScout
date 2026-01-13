import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractPaysendMethodPairs, parsePaysendPayload } from '../plane-b/src/providers/paysend/parse'

type PaysendPayload = {
  commission?: {
    convertRate?: number | string
    fee?: number | string
    from?: number | string
    to?: number | string
  }
  paymentForm?: {
    description?: string
    currencyRateText?: string
    paymentMethod?: string
    deliveryMethod?: string
  }
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'paysend',
  'fixtures',
  'corridors',
)
const liveFixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'paysend',
  'fixtures',
  'corridors-live',
)

const corridorId = 'US-MX-USD-MXN'

const loadPayload = (corridor: string): PaysendPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as PaysendPayload
}

const loadLivePayload = (corridor: string): PaysendPayload => {
  const filePath = path.join(liveFixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as PaysendPayload
}

const buildRequest = (): CollectorRequest => ({
  provider_id: 'paysend',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

describe('paysend parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractPaysendMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([{ payin_method: 'debit_card', payout_method: 'bank_deposit' }]),
    )

    const parsed = parsePaysendPayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.base_rate).toBe(19.5)
    expect(parsed.fee_amount).toBe(1.5)
    expect(parsed.receive_amount).toBe(1950)
    expect(parsed.delivery_time_min_minutes).toBe(15)
    expect(parsed.delivery_time_max_minutes).toBe(15)
  })

  it('returns null when payload is empty', () => {
    const parsed = parsePaysendPayload({}, buildRequest())
    expect(parsed).toBeNull()
  })

  it('extracts corridor-specific payout methods from live fixtures', () => {
    const payload = loadLivePayload(corridorId)
    const methodPairs = extractPaysendMethodPairs(payload, corridorId)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'debit_card', payout_method: 'cash_pickup' },
      ]),
    )
  })
})
