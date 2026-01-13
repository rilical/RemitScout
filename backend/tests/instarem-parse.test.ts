import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractInstaremMethodPairs, parseInstaremPayload } from '../plane-b/src/providers/instarem/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'instarem',
  'fixtures',
  'corridors',
)

const corridorId = 'SG-IN-SGD-INR'

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (payin_method: string): CollectorRequest => ({
  provider_id: 'instarem',
  corridor_id: corridorId,
  amount_bucket: 1000,
  payin_method,
  payout_method: 'bank_deposit',
  send_amount: 1000,
  locale: 'en-US',
})

describe('instarem parse', () => {
  it('extracts method pairs and normalizes payin methods', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractInstaremMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'credit_card', payout_method: 'bank_deposit' },
        { payin_method: 'apple_pay', payout_method: 'bank_deposit' },
      ]),
    )
  })

  it('parses bank transfer quote with promo fees', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseInstaremPayload(payload, buildRequest('bank_transfer'))

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(1000)
    expect(parsed.receive_amount).toBeCloseTo(70002, 2)
    expect(parsed.fee_amount).toBeCloseTo(5.5, 2)
    expect(parsed.promotional_fee_amount).toBe(0)
    expect(parsed.total_debit_amount).toBeCloseTo(1000, 2)
    expect(parsed.base_rate).toBeCloseTo(70.002, 3)
    expect(parsed.exchange_rate).toBeCloseTo(70.002, 3)
  })
})
