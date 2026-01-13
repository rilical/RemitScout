import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const quotesEndpoint = 'https://api.gopangea.com/api/v1/marketing/fx-calc/calculate'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchPangeaQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { destCountry, sourceCurrency } = requireCorridorId(request.corridor_id)

  if (sourceCurrency.toUpperCase() !== 'USD') {
    return {
      status: 400,
      bodyText: `Unsupported source currency for Pangea: ${sourceCurrency}`,
      payload: {
        error: 'unsupported_source_currency',
        message: 'Pangea quotes are only available for USD send amounts.',
        sourceCurrency,
      },
    }
  }

  const params = new URLSearchParams({
    country: destCountry.toLowerCase(),
    amount: String(request.send_amount),
    inputType: 'send',
  })

  const response = await httpRequest({
    url: `${quotesEndpoint}?${params.toString()}`,
    method: 'GET',
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-US,en;q=0.9',
      origin: 'https://pangeamoneytransfer.com',
      referer: 'https://pangeamoneytransfer.com/',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
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
