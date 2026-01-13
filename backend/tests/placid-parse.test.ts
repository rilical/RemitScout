import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import {
  extractPlacidMethodPairs,
  parsePlacidHtml,
  parsePlacidPayload,
} from '../plane-b/src/providers/placid/parse'

const fixturePath = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'placid',
  'fixtures',
  'rates-fees.html',
)

const corridorId = 'US-IN-USD-INR'

const buildRequest = (payin_method: string): CollectorRequest => ({
  provider_id: 'placid',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method,
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

describe('placid parse', () => {
  it('extracts method pairs from fee table', () => {
    const html = readFileSync(fixturePath, 'utf8')
    const payload = parsePlacidHtml(html)
    const pairs = extractPlacidMethodPairs(payload)

    expect(pairs).toContainEqual({ payin_method: 'debit_card', payout_method: 'bank_deposit' })
    expect(pairs).toContainEqual({ payin_method: 'bank_transfer', payout_method: 'bank_deposit' })
  })

  it('parses debit card fees and rates', () => {
    const html = readFileSync(fixturePath, 'utf8')
    const payload = parsePlacidHtml(html)
    const parsed = parsePlacidPayload(payload, buildRequest('debit_card'))

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('debit_card')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(100)
    expect(parsed.receive_amount).toBeCloseTo(9001, 2)
    expect(parsed.fee_amount).toBeCloseTo(0, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(100, 2)
    expect(parsed.base_rate).toBeCloseTo(90.01, 2)
  })

  it('parses bank transfer fees when available', () => {
    const html = readFileSync(fixturePath, 'utf8')
    const payload = parsePlacidHtml(html)
    const parsed = parsePlacidPayload(payload, buildRequest('bank_transfer'))

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.fee_amount).toBeCloseTo(2.5, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(102.5, 2)
  })
})
