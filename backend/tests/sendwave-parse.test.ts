import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import {
  extractSendwaveMethodPairs,
  parseSendwavePayload,
  type SendwavePayload,
  type SendwavePricingPayload,
} from '../plane-b/src/providers/sendwave/parse'

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'sendwave',
  'fixtures',
  'corridors',
)

const loadPayload = (fileName: string): SendwavePayload => {
  const filePath = path.join(fixturesDir, fileName)
  return JSON.parse(readFileSync(filePath, 'utf8')) as SendwavePayload
}

const buildRequest = (corridorId: string): CollectorRequest => ({
  provider_id: 'sendwave',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
})

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.+-Ee]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

describe('sendwave parse', () => {
  it('extracts method pairs from payout groups', () => {
    const payload = loadPayload('US-PH-USD-PHP.json')
    const methodPairs = extractSendwaveMethodPairs(payload)

    expect(methodPairs).toEqual(
      expect.arrayContaining([
        { payin_method: 'debit_card', payout_method: 'mobile_wallet' },
        { payin_method: 'debit_card', payout_method: 'bank_deposit' },
        { payin_method: 'debit_card', payout_method: 'cash_pickup' },
      ]),
    )
  })

  it('normalizes quotes from live fixtures', () => {
    const fixtureFiles = readdirSync(fixturesDir)
      .filter(file => file.endsWith('.json') && file !== 'summary.json')
      .sort()
    expect(fixtureFiles.length).toBeGreaterThan(0)

    for (const fileName of fixtureFiles) {
      const corridorId = fileName.replace(/\.json$/, '')
      const payload = loadPayload(fileName)
      const parsed = parseSendwavePayload(payload, buildRequest(corridorId))
      expect(parsed, `${corridorId} parsed`).not.toBeNull()
      if (!parsed) continue

      const pricing = payload.pricing as SendwavePricingPayload | undefined
      expect(pricing, `${corridorId} has pricing`).toBeTruthy()
      if (!pricing) continue

      const sendAmountRaw = parseNumber(pricing.effectiveSendAmount ?? pricing.baseSendAmount)
      const sendAmount = Number.isFinite(sendAmountRaw) ? sendAmountRaw : 100

      const promoRate = parseNumber(pricing.effectiveExchangeRate)
      const baseRate = parseNumber(pricing.baseExchangeRate)

      const receiveAmountRaw = parseNumber(pricing.receiveAmount)
      const receiveAmount = Number.isFinite(receiveAmountRaw)
        ? receiveAmountRaw
        : Number.isFinite(promoRate)
          ? sendAmount * promoRate
          : Number.isFinite(baseRate)
            ? sendAmount * baseRate
            : Number.NaN

      const feeAmountRaw = parseNumber(pricing.effectiveFeeAmount ?? pricing.baseFeeAmount)
      const feeAmount = Number.isFinite(feeAmountRaw) ? feeAmountRaw : 0

      const totalDebitRaw = parseNumber(pricing.payAmount)
      const totalDebit = Number.isFinite(totalDebitRaw)
        ? totalDebitRaw
        : sendAmount + feeAmount

      expect(parsed.send_amount).toBeCloseTo(sendAmount, 4)
      if (Number.isFinite(receiveAmount)) {
        expect(parsed.receive_amount).toBeCloseTo(receiveAmount, 4)
      }
      expect(parsed.fee_amount).toBeCloseTo(feeAmount, 4)
      expect(parsed.total_debit_amount).toBeCloseTo(totalDebit, 4)

      if (Number.isFinite(baseRate)) {
        expect(parsed.base_rate).toBeCloseTo(baseRate, 6)
      }
    }
  })

  it('returns null on error messages', () => {
    const payload: SendwavePayload = {
      pricing: 'An unknown error occurred',
    }

    const parsed = parseSendwavePayload(payload, buildRequest('US-PH-USD-PHP'))
    expect(parsed).toBeNull()
  })
})
