import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractAlansariMethodPairs, parseAlansariPayload } from '../plane-b/src/providers/alansari/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'alansari',
  'fixtures',
  'corridors',
)

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (
  corridorId: string,
  payoutMethod: string,
  sendAmount = 1000,
): CollectorRequest => ({
  provider_id: 'alansari',
  corridor_id: corridorId,
  amount_bucket: sendAmount,
  payin_method: 'bank_transfer',
  payout_method: payoutMethod,
  send_amount: sendAmount,
  locale: 'en-US',
})

describe('alansari parse', () => {
  it('returns method pair for bank deposit requests', () => {
    const request = buildRequest('AE-IN-AED-INR', 'bank_deposit')
    const methodPairs = extractAlansariMethodPairs(null, request)

    expect(methodPairs).toEqual([
      { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
    ])
  })

  it('returns method pair for cash pickup requests', () => {
    const request = buildRequest('AE-PH-AED-PHP', 'cash_pickup')
    const methodPairs = extractAlansariMethodPairs(null, request)

    expect(methodPairs).toEqual([
      { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
    ])
  })

  it('parses bank deposit quotes from fixtures', () => {
    const corridorId = 'AE-IN-AED-INR'
    const payload = loadPayload(corridorId)
    const parsed = parseAlansariPayload(payload, buildRequest(corridorId, 'bank_deposit'))

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(1000)
    expect(parsed.exchange_rate).toBeCloseTo(24.4499, 4)
    expect(parsed.receive_amount).toBeCloseTo(24467.825, 3)
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.total_debit_amount).toBe(1000)
  })

  it('parses cash pickup quotes from fixtures', () => {
    const corridorId = 'AE-PH-AED-PHP'
    const payload = loadPayload(corridorId)
    const parsed = parseAlansariPayload(payload, buildRequest(corridorId, 'cash_pickup'))

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('cash_pickup')
    expect(parsed.send_amount).toBe(1000)
    expect(parsed.exchange_rate).toBeCloseTo(16.1031, 4)
    expect(parsed.receive_amount).toBeCloseTo(16100, 2)
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.total_debit_amount).toBe(1000)
  })
})
