import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { countryCodeMap, currencyCodeMap } from './code-map'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const remitlyEndpoint = 'https://api.remitly.io/v3/calculator/estimate'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchRemitlyQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const conduit = `${mapCountry(sourceCountry)}:${mapCurrency(sourceCurrency)}-${mapCountry(destCountry)}:${mapCurrency(destCurrency)}`

  const params = new URLSearchParams({
    conduit,
    anchor: 'SEND',
    amount: String(request.send_amount),
    purpose: 'OTHER',
    customer_segment: 'UNRECOGNIZED',
    strict_promo: 'false',
  })

  const url = `${remitlyEndpoint}?${params.toString()}`

  const response = await httpRequest({
    url,
    headers: {
      accept: 'application/json',
      origin: 'https://www.remitly.com',
      referer: 'https://www.remitly.com/',
      'accept-language': 'en',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    },
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  return {
    status: response.status,
    bodyText: response.bodyText,
    payload: response.json ?? response.bodyText,
  }
}
