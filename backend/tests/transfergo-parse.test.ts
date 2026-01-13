import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractTransferGoMethodPairs, parseTransferGoPayload } from '../plane-b/src/providers/transfergo/parse'

type TransferGoPayload = {
  options?: Array<{
    code?: string | null
    label?: string | null
    isDefault?: boolean | null
    availability?: { isAvailable?: boolean | null } | null
    fee?: { value?: string | number | null; valueBeforeDiscount?: string | number | null; currency?: string | null } | null
    rate?: { value?: string | number | null } | null
    receivingAmount?: { value?: string | number | null } | null
    sendingAmount?: { value?: string | number | null } | null
    payIn?: { code?: string | null } | null
    payOut?: { code?: string | null } | null
    visibility?: { estimateLabel?: string | null; estimate?: { label?: string | null } | null } | null
  }> | null
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'transfergo',
  'fixtures',
  'corridors',
)

const corridorId = 'MD-UA-EUR-UAH'

const loadPayload = (corridor: string): TransferGoPayload => {
  const filePath = path.join(fixturesDir, `${corridor}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as TransferGoPayload
}

const buildRequest = (): CollectorRequest => ({
  provider_id: 'transfergo',
  corridor_id: corridorId,
  amount_bucket: 500,
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  send_amount: 500,
  locale: 'en-US',
})

describe('transfergo parse', () => {
  it('extracts method pairs and normalizes the quote', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractTransferGoMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([{ payin_method: 'bank_transfer', payout_method: 'bank_deposit' }]),
    )

    const parsed = parseTransferGoPayload(payload, buildRequest())
    expect(parsed).not.toBeNull()
    if (!parsed) return

    expect(parsed.base_rate).toBe(47.45556)
    expect(parsed.promotional_rate).toBeNull()
    expect(parsed.fee_amount).toBe(0)
    expect(parsed.receive_amount).toBe(23727.78)
    expect(parsed.delivery_time_min_minutes).toBe(1440)
    expect(parsed.delivery_time_max_minutes).toBe(1440)
  })

  it('returns null when no options are available', () => {
    const payload: TransferGoPayload = { options: [] }
    const parsed = parseTransferGoPayload(payload, buildRequest())
    expect(parsed).toBeNull()
  })
})
