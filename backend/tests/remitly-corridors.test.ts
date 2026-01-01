import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { payinMethodMap, payoutMethodMap } from '../plane-b/src/providers/remitly/code-map'
import { extractRemitlyMethodPairs, parseRemitlyPayload } from '../plane-b/src/providers/remitly/parse'

type RemitlyEstimate = {
  pay_in_method?: string | null
  pay_out_method?: string | null
  exchange_rate?: {
    promotional_exchange_rate?: string | null
    base_rate?: string | null
    capped_promotional_exchange_rate_amount?: string | null
  } | null
}

type RemitlyPayload = {
  estimate?: RemitlyEstimate | null
  pay_out_price_estimates?: {
    estimates?: RemitlyEstimate[] | null
  } | null
}

const fixturesDir = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'remitly',
  'fixtures',
  'corridors',
)

const corridors = [
  'US-MX-USD-MXN',
  'US-PH-USD-PHP',
  'US-IN-USD-INR',
  'US-NG-USD-NGN',
  'CA-IN-CAD-INR',
  'CA-PH-CAD-PHP',
  'GB-IN-GBP-INR',
  'GB-NG-GBP-NGN',
  'AU-IN-AUD-INR',
  'SG-IN-SGD-INR',
]

const mapPayin = (code?: string | null) => {
  if (!code) return 'other'
  return payinMethodMap[code] ?? 'other'
}

const mapPayout = (code?: string | null) => {
  if (!code) return 'other'
  return payoutMethodMap[code] ?? 'other'
}

const getEstimates = (payload: RemitlyPayload): RemitlyEstimate[] => {
  const list = payload.pay_out_price_estimates?.estimates
  if (Array.isArray(list) && list.length > 0) return list
  if (payload.estimate) return [payload.estimate]
  return []
}

const parseNumber = (value?: string | number | null): number => {
  if (value === null || value === undefined) return Number.NaN
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const loadPayload = (corridorId: string): RemitlyPayload | unknown => {
  const filePath = path.join(fixturesDir, `${corridorId}.json`)
  return JSON.parse(readFileSync(filePath, 'utf8')) as RemitlyPayload | unknown
}

const buildRequest = (corridor_id: string, payin_method: string, payout_method: string): CollectorRequest => ({
  provider_id: 'remitly',
  corridor_id,
  amount_bucket: 100,
  payin_method,
  payout_method,
  send_amount: 100,
  locale: 'en-US',
})

describe.each(corridors)('remitly corridor %s', (corridorId) => {
  it('extracts delivery methods and promo fields when available', () => {
    const payload = loadPayload(corridorId)
    const methodPairs = extractRemitlyMethodPairs(payload as RemitlyPayload)
    const deliveryMethods = Array.from(new Set(methodPairs.map(pair => pair.payout_method)))
    const estimates = getEstimates(payload as RemitlyPayload)

    if (!estimates.length) {
      expect(methodPairs).toHaveLength(0)
      expect(deliveryMethods).toHaveLength(0)
      expect(parseRemitlyPayload(payload as RemitlyPayload, buildRequest(corridorId, '', ''))).toBeNull()
      return
    }

    expect(methodPairs.length).toBeGreaterThan(0)
    expect(deliveryMethods.length).toBeGreaterThan(0)

    const requestedPair = methodPairs[0]
    const request = buildRequest(
      corridorId,
      requestedPair.payin_method,
      requestedPair.payout_method,
    )

    const parsed = parseRemitlyPayload(payload as RemitlyPayload, request)
    expect(parsed).not.toBeNull()
    if (!parsed) return

    const matchingEstimate =
      estimates.find((estimate) => {
        const payin = mapPayin(estimate.pay_in_method)
        const payout = mapPayout(estimate.pay_out_method)
        return payin === request.payin_method && payout === request.payout_method
      }) || estimates[0]

    const expectedPromo = parseNumber(matchingEstimate.exchange_rate?.promotional_exchange_rate)
    const expectedBase = parseNumber(matchingEstimate.exchange_rate?.base_rate)
    const expectedCap = parseNumber(matchingEstimate.exchange_rate?.capped_promotional_exchange_rate_amount)

    if (Number.isFinite(expectedPromo)) {
      expect(parsed.promotional_rate).toBe(expectedPromo)
    } else {
      expect(parsed.promotional_rate).toBeNull()
    }

    if (Number.isFinite(expectedBase)) {
      expect(parsed.base_rate).toBe(expectedBase)
    } else {
      expect(parsed.base_rate).toBeNull()
    }

    if (Number.isFinite(expectedCap)) {
      expect(parsed.promotional_cap_amount).toBe(expectedCap)
    } else {
      expect(parsed.promotional_cap_amount).toBeNull()
    }
  })
})

it('captures promo and multiple delivery methods across fixtures', () => {
  let promoFound = false
  let deliveryVariantsFound = false

  for (const corridorId of corridors) {
    const payload = loadPayload(corridorId) as RemitlyPayload
    const methodPairs = extractRemitlyMethodPairs(payload)
    if (!methodPairs.length) {
      continue
    }
    const deliveryMethods = Array.from(new Set(methodPairs.map(pair => pair.payout_method)))
    if (deliveryMethods.length > 1) {
      deliveryVariantsFound = true
    }

    const request = buildRequest(
      corridorId,
      methodPairs[0].payin_method,
      methodPairs[0].payout_method,
    )
    const parsed = parseRemitlyPayload(payload, request)
    if (parsed?.promotional_rate !== null) {
      promoFound = true
    }
  }

  expect(promoFound).toBe(true)
  expect(deliveryVariantsFound).toBe(true)
})
