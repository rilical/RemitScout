import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import type { XoomQuotePayload } from '../plane-b/src/providers/xoom/fetch'
import { extractXoomMethodPairs, parseXoomPayload } from '../plane-b/src/providers/xoom/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'xoom',
  'fixtures',
  'corridors',
)

const corridorId = 'US-MX-USD-MXN'

const loadPayload = (corridor: string): XoomQuotePayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as XoomQuotePayload
}

const buildRequest = (payin_method: string, payout_method: string): CollectorRequest => ({
  provider_id: 'xoom',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method,
  payout_method,
  send_amount: 100,
  locale: 'en-US',
})

describe('xoom parse', () => {
  it('extracts method pairs including mobile wallet', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractXoomMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
        { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
        { payin_method: 'bank_transfer', payout_method: 'mobile_wallet' },
      ]),
    )
  })

  it('parses bank deposit quotes for bank transfer', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseXoomPayload(payload, buildRequest('bank_transfer', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(100)
    expect(parsed.receive_amount).toBeGreaterThan(0)
    expect(parsed.fee_amount).toBeGreaterThanOrEqual(0)
    expect(parsed.total_debit_amount).toBeCloseTo(parsed.send_amount + parsed.fee_amount, 2)
  })
})
