import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import type { BossMoneyPayload } from '../plane-b/src/providers/bossmoney/parse'
import { extractBossMoneyMethodPairs, parseBossMoneyPayload } from '../plane-b/src/providers/bossmoney/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'bossmoney',
  'fixtures',
  'corridors',
)

const corridorId = 'US-GN-USD-GNF'

const loadPayload = (corridor: string): BossMoneyPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as BossMoneyPayload
}

const buildRequest = (payinMethod = 'credit_card'): CollectorRequest => ({
  provider_id: 'bossmoney',
  corridor_id: corridorId,
  amount_bucket: 500,
  payin_method: payinMethod,
  payout_method: 'bank_deposit',
  send_amount: 500,
  locale: 'en-US',
})

describe('bossmoney parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractBossMoneyMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'credit_card', payout_method: 'bank_deposit' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'apple_pay', payout_method: 'bank_deposit' },
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
      ]),
    )

    const parsed = parseBossMoneyPayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.promotional_rate).toBeCloseTo(8657.6422, 4)
    expect(parsed.base_rate).toBeCloseTo(8469.0812, 4)
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.promotional_fee_amount).toBe(0)
    expect(parsed.receive_amount).toBeCloseTo(4328822, 1)
  })

  it('returns null on invalid payload', () => {
    const parsed = parseBossMoneyPayload(null as unknown as BossMoneyPayload, buildRequest())
    expect(parsed).toBeNull()
  })
})
