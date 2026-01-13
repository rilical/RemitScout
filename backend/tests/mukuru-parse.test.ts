import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractMukuruMethodPairs, parseMukuruPayload } from '../plane-b/src/providers/mukuru/parse'
import type { MukuruPayload } from '../plane-b/src/providers/mukuru/fetch'

const corridorsDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'mukuru',
  'fixtures',
  'corridors',
)

const methodsFixturePath = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'mukuru',
  'fixtures',
  'methods',
  'methods.json',
)

const loadPayload = (filePath: string): MukuruPayload => {
  return JSON.parse(readFileSync(filePath, 'utf8')) as MukuruPayload
}

const buildRequest = (corridorId: string): CollectorRequest => ({
  provider_id: 'mukuru',
  corridor_id: corridorId,
  amount_bucket: 500,
  payin_method: 'bank_transfer',
  payout_method: 'cash_pickup',
  send_amount: 500,
  locale: 'en-US',
})

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const findBreakdownAmount = (
  breakdown: Record<string, unknown> | undefined,
  matcher: (key: string) => boolean,
): number => {
  if (!breakdown) return Number.NaN
  for (const [key, entry] of Object.entries(breakdown)) {
    if (!matcher(key)) continue
    if (entry && typeof entry === 'object' && 'amount' in entry) {
      return parseNumber((entry as { amount?: string }).amount)
    }
  }
  return Number.NaN
}

describe('mukuru parse', () => {
  it('extracts method pairs from product titles', () => {
    const payload = loadPayload(methodsFixturePath)
    const pairs = extractMukuruMethodPairs(payload)

    expect(pairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
        { payin_method: 'bank_transfer', payout_method: 'bank_deposit' },
        { payin_method: 'bank_transfer', payout_method: 'mobile_wallet' },
      ]),
    )
  })

  it('normalizes quotes from fixture payloads', () => {
    const fixtureFiles = readdirSync(corridorsDir)
      .filter(file => file.endsWith('.json'))
      .sort()

    expect(fixtureFiles.length).toBeGreaterThan(0)

    for (const fileName of fixtureFiles) {
      const corridorId = fileName.replace(/\.json$/, '')
      const payload = loadPayload(path.join(corridorsDir, fileName))
      const parsed = parseMukuruPayload(payload, buildRequest(corridorId))
      expect(parsed, `${corridorId} parsed`).not.toBeNull()
      if (!parsed) continue

      const quoteData = (payload.quote as { data?: Record<string, unknown> })?.data ?? {}
      const sendAmount = parseNumber(quoteData.payin_amount as string | number | undefined)
      const receiveAmount = parseNumber(quoteData.payout_amount as string | number | undefined)

      const payinBreakdown = (quoteData.breakdown as Record<string, unknown> | undefined)?.payin as
        | Record<string, unknown>
        | undefined
      const feeAmount = findBreakdownAmount(
        payinBreakdown,
        key => key.toLowerCase().includes('charge'),
      )
      const totalToPay = findBreakdownAmount(
        payinBreakdown,
        key => key.toLowerCase().includes('total'),
      )

      expect(parsed.send_amount).toBeCloseTo(sendAmount, 4)
      expect(parsed.receive_amount).toBeCloseTo(receiveAmount, 4)
      if (Number.isFinite(feeAmount)) {
        expect(parsed.fee_amount).toBeCloseTo(feeAmount, 4)
      }
      if (Number.isFinite(totalToPay)) {
        expect(parsed.total_debit_amount).toBeCloseTo(totalToPay, 4)
      }
    }
  })

  it('returns null on error payloads', () => {
    const payload: MukuruPayload = {
      quote: {
        status: 'error',
        message: 'Session expired please reload the page to try again',
      },
      products: [],
      selectedProduct: null,
      payoutMethod: 'cash_pickup',
      sourceCurrency: 'USD',
    }

    const parsed = parseMukuruPayload(payload, buildRequest('US-ZW-USD-ZAR'))
    expect(parsed).toBeNull()
  })
})
