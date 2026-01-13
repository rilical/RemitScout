import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import {
  extractSingxMethodPairs,
  parseSingxPayload,
} from '../plane-b/src/providers/singx/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'singx',
  'fixtures',
  'corridors',
)

const corridorId = 'SG-IN-SGD-INR'

const loadPayload = (corridor: string) => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>
}

const buildRequest = (payin_method: string, payout_method: string): CollectorRequest => ({
  provider_id: 'singx',
  corridor_id: corridorId,
  amount_bucket: 1000,
  payin_method,
  payout_method,
  send_amount: 1000,
  locale: 'en-US',
})

describe('singx parse', () => {
  it('extracts default method pairs', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractSingxMethodPairs(payload)

    expect(methodPairs).toEqual([
      { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
    ])
  })

  it('parses singx payload fields', () => {
    const payload = loadPayload(corridorId)
    const parsed = parseSingxPayload(payload, buildRequest('bank_transfer', 'bank_deposit'))
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.payin_method).toBe('bank_transfer')
    expect(parsed.payout_method).toBe('bank_deposit')
    expect(parsed.send_amount).toBe(1000)
    expect(parsed.receive_amount).toBeCloseTo(70091, 2)
    expect(parsed.fee_amount).toBeCloseTo(5, 2)
    expect(parsed.total_debit_amount).toBeCloseTo(1005, 2)
    expect(parsed.base_rate).toBeCloseTo(70.091, 3)
  })
})
