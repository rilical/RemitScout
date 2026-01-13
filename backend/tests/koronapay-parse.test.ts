import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractKoronaPayMethodPairs, parseKoronaPayPayload } from '../plane-b/src/providers/koronapay/parse'

type KoronaPayPayload = {
  tariffs?: any
  tariffInfo?: any
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'koronapay',
  'fixtures',
  'corridors',
)

const corridorId = 'DE-TR-EUR-TRY'

const loadPayload = (corridor: string): KoronaPayPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as KoronaPayPayload
}

const buildRequest = (): CollectorRequest => ({
  provider_id: 'koronapay',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

describe('koronapay parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractKoronaPayMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'debit_card', payout_method: 'cash_pickup' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
      ]),
    )

    const parsed = parseKoronaPayPayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.send_amount).toBe(99.05)
    expect(parsed.fee_amount).toBe(0.95)
    expect(parsed.total_debit_amount).toBe(100)
    expect(parsed.receive_amount).toBe(4903.46)
    expect(parsed.base_rate).toBe(49.505)
  })

  it('returns null on error payloads', () => {
    const payload: KoronaPayPayload = {
      tariffs: { type: 'error', message: 'Bad corridor' },
    }

    const parsed = parseKoronaPayPayload(payload, buildRequest())
    expect(parsed).toBeNull()
  })
})
