import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractWireBarleyMethodPairs, parseWireBarleyPayload } from '../plane-b/src/providers/wirebarley/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'wirebarley',
  'fixtures',
  'corridors',
)

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (
  corridorId: string,
  payin_method: string,
  payout_method: string,
  send_amount: number,
): CollectorRequest => ({
  provider_id: 'wirebarley',
  corridor_id: corridorId,
  amount_bucket: send_amount,
  payin_method,
  payout_method,
  send_amount,
  locale: 'en-US',
})

describe('wirebarley parse', () => {
  it('extracts method pairs for bank, cash, and wallet payouts', () => {
    const payload = loadPayload('KR-PH-KRW-PHP')
    const methodPairs = extractWireBarleyMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
        { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
        { payin_method: 'bank_transfer', payout_method: 'mobile_wallet' },
      ]),
    )
  })

  it('parses cash pickup quote with fees and rate tiers', () => {
    const corridorId = 'KR-PH-KRW-PHP'
    const payload = loadPayload(corridorId)
    const parsed = parseWireBarleyPayload(
      payload,
      buildRequest(corridorId, 'bank_transfer', 'cash_pickup', 100000),
    )

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('cash_pickup')
    expect(parsed.send_amount).toBe(100000)
    expect(parsed.exchange_rate).toBeCloseTo(0.0401926, 7)
    expect(parsed.receive_amount).toBeCloseTo(4019.26, 2)
    expect(parsed.fee_amount).toBeCloseTo(5000, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(105000, 2)
    expect(parsed.base_rate).toBeCloseTo(0.0403946, 7)
  })

  it('selects tiered rate and wallet payout', () => {
    const corridorId = 'KR-CN-KRW-CNY'
    const payload = loadPayload(corridorId)
    const parsed = parseWireBarleyPayload(
      payload,
      buildRequest(corridorId, 'bank_transfer', 'mobile_wallet', 600000),
    )

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payout_method).toBe('mobile_wallet')
    expect(parsed.exchange_rate).toBeCloseTo(0.0047183, 7)
    expect(parsed.receive_amount).toBeCloseTo(2830.98, 2)
    expect(parsed.fee_amount).toBeCloseTo(0, 2)
  })
})
