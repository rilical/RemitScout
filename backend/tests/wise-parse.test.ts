import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractWiseMethodPairs, parseWisePayload } from '../plane-b/src/providers/wise/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'wise',
  'fixtures',
  'corridors',
)

const corridorId = 'US-PH-USD-PHP'

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (payin_method: string): CollectorRequest => ({
  provider_id: 'wise',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method,
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

describe('wise parse', () => {
  it('extracts method pairs and normalizes bank transfer', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractWiseMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'credit_card', payout_method: 'bank_deposit' },
      ]),
    )

    const parsed = parseWisePayload(payload, buildRequest('bank_transfer'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.fee_amount).toBeCloseTo(7.55, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(107.55, 2)
    expect(parsed.receive_amount).toBeCloseTo(5440.41, 2)
    expect(parsed.base_rate).toBeCloseTo(58.847, 3)
    expect(parsed.promotional_fee_amount).toBeNull()
    expect(parsed.delivery_time_min_minutes).toBe(1028)
    expect(parsed.delivery_time_max_minutes).toBe(1028)
  })

  it('selects debit card when requested', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseWisePayload(payload, buildRequest('debit_card'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('debit_card')
    expect(parsed.fee_amount).toBeCloseTo(2.69, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(102.69, 2)
    expect(parsed.receive_amount).toBeCloseTo(5726.4, 1)
    expect(parsed.delivery_time_min_minutes).toBe(30)
    expect(parsed.delivery_time_max_minutes).toBe(30)
  })
})
