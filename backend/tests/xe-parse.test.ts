import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractXeMethodPairs, parseXePayload } from '../plane-b/src/providers/xe/parse'

type XePayload = {
  quote?: {
    individualQuotes?: Array<{
      rate?: string | number | null
      buyAmount?: string | number | null
      transferFee?: string | number | null
      deliveryMethod?: string | null
      leadTime?: string | null
    }>
  } | null
  errorMessages?: Record<string, { message?: string }> | null
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'xe',
  'fixtures',
  'corridors',
)

const corridorId = 'US-IN-USD-INR'

const loadPayload = (corridor: string): XePayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as XePayload
}

const buildRequest = (): CollectorRequest => ({
  provider_id: 'xe',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

describe('xe parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractXeMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([{ payin_method: 'bank_transfer', payout_method: 'bank_deposit' }]),
    )

    const parsed = parseXePayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.base_rate).toBe(83.25)
    expect(parsed.promotional_rate).toBeNull()
    expect(parsed.fee_amount).toBe(2.99)
    expect(parsed.receive_amount).toBe(8325)
    expect(parsed.delivery_time_min_minutes).toBe(1440)
    expect(parsed.delivery_time_max_minutes).toBe(2880)
  })

  it('returns null on error messages', () => {
    const payload: XePayload = {
      errorMessages: { BAD: { message: 'Bad corridor' } },
    }

    const parsed = parseXePayload(payload, buildRequest())
    expect(parsed).toBeNull()
  })
})
