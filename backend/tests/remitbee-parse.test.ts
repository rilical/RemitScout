import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import {
  extractRemitbeeMethodPairs,
  parseRemitbeePayload,
} from '../plane-b/src/providers/remitbee/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'remitbee',
  'fixtures',
  'corridors',
)

const corridorId = 'CA-IN-CAD-INR'

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (payin_method: string, payout_method: string): CollectorRequest => ({
  provider_id: 'remitbee',
  corridor_id: corridorId,
  amount_bucket: 900,
  payin_method,
  payout_method,
  send_amount: 900,
  locale: 'en-US',
})

describe('remitbee parse', () => {
  it('extracts method pairs and promo fields', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractRemitbeeMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
      ]),
    )

    const parsed = parseRemitbeePayload(payload, buildRequest('debit_card', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('debit_card')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(900)
    expect(parsed.receive_amount).toBeCloseTo(58898.19, 2)
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.total_debit_amount).toBe(900)
    expect(parsed.promotional_rate).toBeCloseTo(67.6091, 4)
    expect(parsed.base_rate).toBeCloseTo(64.6091, 4)
    expect(parsed.promotional_cap_amount).toBe(250)
    expect(parsed.delivery_time_min_minutes).toBe(60)
    expect(parsed.delivery_time_max_minutes).toBe(60)
  })

  it('selects interac e-transfer when requested', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseRemitbeePayload(payload, buildRequest('bank_transfer', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.fee_amount).toBeCloseTo(1.99, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(901.99, 2)
    expect(parsed.delivery_time_min_minutes).toBe(180)
  })
})
