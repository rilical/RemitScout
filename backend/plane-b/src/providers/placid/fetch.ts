import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { PLACID_DESTINATION_CURRENCY_BY_COUNTRY } from './supported-corridors'
import { parsePlacidHtml, type PlacidPayload } from './parse'

const placidEndpoint = 'https://www.placid.net/rates-fees.php'
const placidSessionWarmupUrl = 'https://www.placid.net/'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
  cookie?: string
  extraHeaders?: Record<string, string>
}

const buildCookieHeader = (cookies?: string[] | null) => {
  if (!cookies || cookies.length === 0) return null
  const parts = cookies
    .map((cookie) => cookie.split(';')[0]?.trim())
    .filter(Boolean)
  return parts.length ? parts.join('; ') : null
}

export const fetchPlacidSessionCookie = async (input: {
  locale: string
  corridorId: string
  proxyTier?: ProxyTier
  warmupUrl?: string | null
}) => {
  const url = input.warmupUrl || placidSessionWarmupUrl
  if (!url) return null

  const response = await httpRequest({
    url,
    method: 'GET',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': input.locale,
      'user-agent': getUserAgentForCorridor(input.corridorId),
      referer: placidSessionWarmupUrl,
    },
    proxyTier: input.proxyTier,
    corridorId: input.corridorId,
  })

  return buildCookieHeader(response.setCookie)
}

export const fetchPlacidQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult<PlacidPayload>> => {
  const { sourceCurrency, destCountry, destCurrency } = requireCorridorId(request.corridor_id)
  const normalizedSource = sourceCurrency.toUpperCase()
  const normalizedDestCurrency = destCurrency.toUpperCase()

  if (normalizedSource !== 'USD') {
    throw new Error(`placid only supports USD as source currency: ${request.corridor_id}`)
  }

  const expectedCurrency = PLACID_DESTINATION_CURRENCY_BY_COUNTRY[destCountry.toUpperCase()]
  if (!expectedCurrency) {
    throw new Error(`placid unsupported destination country: ${destCountry}`)
  }

  if (expectedCurrency !== normalizedDestCurrency) {
    throw new Error(
      `placid corridor currency mismatch: ${destCountry} expects ${expectedCurrency} but got ${normalizedDestCurrency}`,
    )
  }

  const headers: Record<string, string> = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': request.locale || 'en-US',
    'user-agent': getUserAgentForCorridor(request.corridor_id),
    origin: 'https://www.placid.net',
    referer: 'https://www.placid.net/',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
  }

  if (options.extraHeaders) {
    for (const [key, value] of Object.entries(options.extraHeaders)) {
      if (value) {
        headers[key] = value
      }
    }
  }

  if (options.cookie) {
    headers.cookie = options.cookie
  }

  const response = await httpRequest({
    url: placidEndpoint,
    method: 'GET',
    headers,
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  const payload = parsePlacidHtml(response.bodyText)

  return {
    status: response.status,
    bodyText: response.bodyText,
    payload,
  }
}
