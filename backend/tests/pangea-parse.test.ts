import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import type { PangeaPayload } from '../plane-b/src/providers/pangea/parse'
import { extractPangeaMethodPairs, parsePangeaPayload } from '../plane-b/src/providers/pangea/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'pangea',
  'fixtures',
  'corridors',
)

const corridorId = 'US-PH-USD-PHP'

const loadPayload = (corridor: string): PangeaPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as PangeaPayload
}

const buildRequest = (): CollectorRequest => ({
  provider_id: 'pangea',
  corridor_id: corridorId,
  amount_bucket: 400,
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  send_amount: 400,
  locale: 'en-US',
})

describe('pangea parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractPangeaMethodPairs(payload)

    expect(methodPairs).toEqual([
      { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
    ])

    const parsed = parsePangeaPayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.base_rate).toBeCloseTo(57.67, 2)
    expect(parsed.promotional_rate).toBeCloseTo(60.10, 2)
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.receive_amount).toBeCloseTo(24040, 2)
  })

  it('returns null on invalid payload', () => {
    const parsed = parsePangeaPayload(null as unknown as PangeaPayload, buildRequest())
    expect(parsed).toBeNull()
  })
})
