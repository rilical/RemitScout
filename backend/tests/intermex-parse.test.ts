import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractIntermexMethodPairs, parseIntermexPayload } from '../plane-b/src/providers/intermex/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'intermex',
  'fixtures',
)

const loadPayload = (category: 'corridors' | 'delivery', corridor: string) => {
  const filePath = path.join(fixturesDir, category, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (
  corridorId: string,
  payin_method: string,
  payout_method: string,
  send_amount: number,
): CollectorRequest => ({
  provider_id: 'intermex',
  corridor_id: corridorId,
  amount_bucket: send_amount,
  payin_method,
  payout_method,
  send_amount,
  locale: 'en-US',
})

describe('intermex parse', () => {
  it('extracts card payin and cash/bank payout methods', () => {
    const payload = loadPayload('delivery', 'US-MX-USD-MXN')
    const methodPairs = extractIntermexMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'debit_card', payout_method: 'cash_pickup' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'credit_card', payout_method: 'cash_pickup' },
        { payin_method: 'credit_card', payout_method: 'bank_deposit' },
      ]),
    )
  })

  it('parses bank deposit quote with card fees', () => {
    const corridorId = 'US-MX-USD-MXN'
    const payload = loadPayload('corridors', corridorId)
    const parsed = parseIntermexPayload(
      payload,
      buildRequest(corridorId, 'debit_card', 'bank_deposit', 900),
    )

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('debit_card')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(900)
    expect(parsed.exchange_rate).toBeCloseTo(17.5367, 4)
    expect(parsed.receive_amount).toBeCloseTo(15783.03, 2)
    expect(parsed.fee_amount).toBeCloseTo(6.57, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(906.57, 2)
    expect(parsed.fee_currency).toBe('USD')
    expect(parsed.base_rate).toBeCloseTo(17.5367, 4)
  })
})
