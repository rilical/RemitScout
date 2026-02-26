import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { mapSendwavePayoutMethod } from './code-map'

const logger = createLogger('plane-b.sendwave.fetch')

const SENDWAVE_BASE_URL = 'https://app.sendwave.com/v2'
const SEGMENTS_ENDPOINT = `${SENDWAVE_BASE_URL}/pricing-segments`
const PRICING_ENDPOINT = `${SENDWAVE_BASE_URL}/pricing-public`

type SendwaveSegment = {
  segmentName?: string | null
}

type SendwavePayoutGroup = {
  payoutMethod?: string | null
  label?: string | null
  bestPricedSegmentName?: string | null
  isBestPricedPayoutMethod?: boolean | null
  segments?: SendwaveSegment[] | null
}

type SendwaveSegmentsPayload = {
  payoutMethodsAndPrices?: SendwavePayoutGroup[] | null
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

type SegmentSelection = {
  segmentName: string | null
  payoutMethod: string | null
}

const normalizeLocale = (value?: string | null) => value || 'en-US'

const formatAmount = (amount: number) => {
  if (!Number.isFinite(amount)) return '0'
  return amount.toFixed(2)
}

const resolvePayoutGroups = (payload: unknown): SendwavePayoutGroup[] => {
  if (!payload || typeof payload !== 'object') return []
  const record = payload as SendwaveSegmentsPayload
  return Array.isArray(record.payoutMethodsAndPrices) ? record.payoutMethodsAndPrices : []
}

const resolveSegmentName = (group?: SendwavePayoutGroup | null) => {
  if (!group) return null
  if (group.bestPricedSegmentName) return group.bestPricedSegmentName
  const firstSegment = group.segments?.find(segment => Boolean(segment?.segmentName))
  return firstSegment?.segmentName ?? null
}

const selectSegment = (payload: unknown, requestedPayout?: string | null): SegmentSelection => {
  const groups = resolvePayoutGroups(payload)
  if (!groups.length) return { segmentName: null, payoutMethod: null }

  const normalizedRequest = requestedPayout?.trim().toLowerCase() || ''
  const mappedGroups = groups.map((group) => {
    const payout = mapSendwavePayoutMethod(
      group.payoutMethod
      ?? group.label
      ?? group.bestPricedSegmentName
      ?? group.segments?.[0]?.segmentName,
    )
    return { group, payout }
  })

  const requestedGroup = normalizedRequest
    ? mappedGroups.find(entry => entry.payout === normalizedRequest)
    : undefined

  const bestPricedGroup = mappedGroups.find(entry => entry.group.isBestPricedPayoutMethod)

  const fallbackGroup = requestedGroup
    || bestPricedGroup
    || mappedGroups.find(entry => resolveSegmentName(entry.group))
    || mappedGroups[0]

  return {
    segmentName: resolveSegmentName(fallbackGroup?.group) ?? null,
    payoutMethod: fallbackGroup?.payout ?? null,
  }
}

export const fetchSendwaveQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )
  const locale = normalizeLocale(request.locale)

  const segmentParams = new URLSearchParams({
    sendCountryIso2: sourceCountry.toLowerCase(),
    sendCurrency: sourceCurrency,
    receiveCountryIso2: destCountry.toLowerCase(),
    receiveCurrency: destCurrency,
  })

  const headers = {
    accept: 'application/json, text/plain, */*',
    origin: 'https://www.sendwave.com',
    referer: 'https://www.sendwave.com/',
    'accept-language': locale,
    'user-agent': getUserAgentForCorridor(request.corridor_id),
  }

  const segmentResponse = await httpRequest({
    url: `${SEGMENTS_ENDPOINT}?${segmentParams.toString()}`,
    method: 'GET',
    headers,
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  const segmentsPayload = segmentResponse.json ?? segmentResponse.bodyText
  const segmentSelection = selectSegment(segmentsPayload, request.payout_method)

  let pricingPayload: unknown = null
  let status = segmentResponse.status
  let bodyText = segmentResponse.bodyText

  if (!segmentSelection.segmentName && segmentResponse.status < 400) {
    const groups = resolvePayoutGroups(segmentsPayload)
    const rawMethods = groups.map(g => g.payoutMethod ?? g.label ?? null)
    logger.warn('sendwave_segment_resolution_failed', {
      corridor_id: request.corridor_id,
      http_status: segmentResponse.status,
      payout_group_count: groups.length,
      raw_payout_methods: rawMethods,
      segment_name: segmentSelection.segmentName,
      payout_method: segmentSelection.payoutMethod,
    })
  }

  if (segmentSelection.segmentName && segmentResponse.status < 400) {
    const pricingParams = new URLSearchParams({
      amountType: 'SEND',
      receiveCurrency: destCurrency,
      segmentName: segmentSelection.segmentName,
      amount: formatAmount(request.send_amount),
      sendCurrency: sourceCurrency,
      sendCountryIso2: sourceCountry.toLowerCase(),
      receiveCountryIso2: destCountry.toLowerCase(),
    })

    const pricingResponse = await httpRequest({
      url: `${PRICING_ENDPOINT}?${pricingParams.toString()}`,
      method: 'GET',
      headers,
      jitterMs: options.jitterMs,
      proxyTier: options.proxyTier,
      corridorId: request.corridor_id,
    })

    pricingPayload = pricingResponse.json ?? pricingResponse.bodyText
    status = pricingResponse.status
    bodyText = pricingResponse.bodyText
  }

  return {
    status,
    bodyText,
    payload: {
      segments: segmentsPayload,
      pricing: pricingPayload,
      segmentName: segmentSelection.segmentName,
      payoutMethod: segmentSelection.payoutMethod,
    },
  }
}
