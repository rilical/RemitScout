import { randomUUID } from 'node:crypto'

import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { countryCodeMap, currencyCodeMap } from './code-map'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const quotesEndpoint = 'https://launchpad-api.xe.com/v2/quotes'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchXeQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const payload = {
    sellCcy: mapCurrency(sourceCurrency),
    buyCcy: mapCurrency(destCurrency),
    userCountry: mapCountry(sourceCountry),
    amount: request.send_amount,
    fixedCcy: mapCurrency(sourceCurrency),
    countryTo: mapCountry(destCountry),
  }

  const response = await httpRequest({
    url: quotesEndpoint,
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      origin: 'https://www.xe.com',
      referer: 'https://www.xe.com/',
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      'x-correlation-id': `XECOM-${randomUUID()}`,
      deviceid: randomUUID(),
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
