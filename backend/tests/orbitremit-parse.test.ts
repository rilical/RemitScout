import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import type { OrbitRemitPayload } from '../plane-b/src/providers/orbitremit/parse'
import { extractOrbitRemitMethodPairs, parseOrbitRemitPayload } from '../plane-b/src/providers/orbitremit/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'orbitremit',
  'fixtures',
  'corridors',
)

const loadPayload = (corridor: string): OrbitRemitPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as OrbitRemitPayload
}

const buildRequest = (corridorId: string, payoutMethod = 'bank_deposit'): CollectorRequest => ({
  provider_id: 'orbitremit',
  corridor_id: corridorId,
  amount_bucket: 500,
  payin_method: 'bank_transfer',
  payout_method: payoutMethod,
  send_amount: 500,
  locale: 'en-US',
})

describe('orbitremit parse', () => {
  it('normalizes quotes from fixtures', () => {
    const corridorId = 'AU-BR-AUD-BRL'
    const payload = loadPayload(corridorId)
    const parsed = parseOrbitRemitPayload(payload, buildRequest(corridorId))

    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.promotional_rate).toBeCloseTo(3.59207, 5)
    expect(parsed.base_rate).toBeCloseTo(3.5560, 4)
    expect(parsed.fee_amount).toBeCloseTo(4.0, 2)
    expect(parsed.receive_amount).toBeCloseTo(1796.04, 2)
    expect(parsed.payout_method).toBe('bank_deposit')
  })

  it('extracts multiple payout methods for PHP corridors', () => {
    const payload = loadPayload('AU-PH-AUD-PHP')
    const methodPairs = extractOrbitRemitMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
        { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
        { payin_method: 'bank_transfer', payout_method: 'mobile_wallet' },
      ]),
    )
  })

  it('maps CNY corridors to mobile wallet only', () => {
    const payload = loadPayload('AU-CN-AUD-CNY')
    const methodPairs = extractOrbitRemitMethodPairs(payload)

    expect(methodPairs).toEqual([
      { payin_method: 'bank_transfer', payout_method: 'mobile_wallet' },
    ])
  })
})
