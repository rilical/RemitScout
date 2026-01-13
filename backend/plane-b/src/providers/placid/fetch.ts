import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { PLACID_DESTINATION_CURRENCY_BY_COUNTRY } from './supported-corridors'
import { parsePlacidHtml, type PlacidPayload } from './parse'

const placidEndpoint = 'https://www.placid.net/rates-fees.php'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
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

  const response = await httpRequest({
    url: placidEndpoint,
    method: 'GET',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': request.locale || 'en-US',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      referer: 'https://www.placid.net/',
    },
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
