import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { extractDahabshiilMethodPairs, parseDahabshiilPayload } from '../plane-b/src/providers/dahabshiil/parse'

type DahabshiilPayload = {
  status?: string | null
  code?: number | null
  message?: string | null
  data?: {
    charges?: {
      source_currency?: string | null
      source_amount?: string | number | null
      rate?: string | number | null
      base_rate?: string | number | null
      destination_currency?: string | null
      destination_amount?: string | number | null
      commission?: string | number | null
      agent_fee?: string | number | null
      hq_fee?: string | number | null
      total_charges?: string | number | null
      tax?: string | number | null
    } | null
  } | null
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'dahabshiil',
  'fixtures',
  'corridors',
)

const loadPayload = (fileName: string): DahabshiilPayload => {
  const filePath = path.join(fixturesDir, fileName)
  return JSON.parse(readFileSync(filePath, 'utf8')) as DahabshiilPayload
}

const buildRequest = (corridorId: string): CollectorRequest => ({
  provider_id: 'dahabshiil',
  corridor_id: corridorId,
  amount_bucket: 100,
  payin_method: 'bank_transfer',
  payout_method: 'cash_pickup',
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

describe('dahabshiil parse', () => {
  it('extracts method pairs', () => {
    const payload = loadPayload('US-KE-USD-USD.json')
    const methodPairs = extractDahabshiilMethodPairs(payload)

    expect(methodPairs).toEqual([
      { payin_method: 'bank_transfer', payout_method: 'cash_pickup' },
    ])
  })

  it('normalizes quotes from live fixtures', () => {
    const fixtureFiles = readdirSync(fixturesDir).filter(file => file.endsWith('.json')).sort()
    expect(fixtureFiles.length).toBeGreaterThan(0)

    for (const fileName of fixtureFiles) {
      const corridorId = fileName.replace(/\\.json$/, '')
      const payload = loadPayload(fileName)
      const parsed = parseDahabshiilPayload(payload, buildRequest(corridorId))
      expect(parsed, `${corridorId} parsed`).not.toBeNull()
      if (!parsed) continue

      const charges = payload.data?.charges
      expect(charges, `${corridorId} has charges`).toBeTruthy()
      if (!charges) continue

      const sendAmount = parseNumber(charges.source_amount)
      const receiveAmount = parseNumber(charges.destination_amount)
      const baseRate = parseNumber(charges.base_rate ?? charges.rate)
      const totalCharges = parseNumber(charges.total_charges)
      const commission = parseNumber(charges.commission)
      const agentFee = parseNumber(charges.agent_fee)
      const hqFee = parseNumber(charges.hq_fee)
      const tax = parseNumber(charges.tax)
      const fallbackFees = [commission, agentFee, hqFee, tax]
        .filter(value => Number.isFinite(value))
        .reduce((sum, value) => sum + value, 0)
      const expectedFee = Number.isFinite(totalCharges)
        ? totalCharges
        : Number.isFinite(commission)
          ? commission
          : fallbackFees > 0
            ? fallbackFees
            : 0

      expect(parsed.send_amount).toBeCloseTo(sendAmount, 4)
      expect(parsed.receive_amount).toBeCloseTo(receiveAmount, 4)
      expect(parsed.fee_amount).toBeCloseTo(expectedFee, 4)
      expect(parsed.total_debit_amount).toBeCloseTo(sendAmount + expectedFee, 4)
      if (Number.isFinite(baseRate)) {
        expect(parsed.base_rate).toBeCloseTo(baseRate, 6)
      }
    }
  })

  it('returns null on error status', () => {
    const payload: DahabshiilPayload = {
      status: 'Error',
      code: 400,
      message: 'Bad request',
    }

    const parsed = parseDahabshiilPayload(payload, buildRequest('US-KE-USD-USD'))
    expect(parsed).toBeNull()
  })
})
