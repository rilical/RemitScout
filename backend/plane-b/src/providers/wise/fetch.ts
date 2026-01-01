import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { countryCodeMap, currencyCodeMap } from './code-map'

const quotesEndpoint = 'https://wise.com/gateway/v3/quotes'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchWiseQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const payload = {
    sourceCurrency: mapCurrency(sourceCurrency),
    targetCurrency: mapCurrency(destCurrency),
    sourceAmount: request.send_amount,
    profile: 'personal',
    targetAmount: null,
    rateType: 'FIXED',
    sourceCountry: mapCountry(sourceCountry),
    targetCountry: mapCountry(destCountry),
  }

  const response = await httpRequest({
    url: quotesEndpoint,
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      origin: 'https://wise.com',
      referer: 'https://wise.com/',
      'user-agent': 'RemitScoutCollector/1.0',
    },
    body: payload,
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
