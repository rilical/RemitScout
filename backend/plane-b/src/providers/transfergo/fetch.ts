import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const quotesEndpoint = 'https://my.transfergo.com/api/booking/quotes'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchTransferGoQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const params = new URLSearchParams({
    fromCurrencyCode: sourceCurrency,
    toCurrencyCode: destCurrency,
    fromCountryCode: sourceCountry,
    toCountryCode: destCountry,
    amount: String(request.send_amount),
    calculationBase: 'sendAmount',
    business: '0',
  })

  const response = await httpRequest({
    url: `${quotesEndpoint}?${params.toString()}`,
    method: 'GET',
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      origin: 'https://www.transfergo.com',
      referer: 'https://www.transfergo.com/',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
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
