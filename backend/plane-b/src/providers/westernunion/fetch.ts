import { randomUUID } from 'node:crypto'

import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { countryCodeMap, currencyCodeMap, getPaymentCodeForPayin } from './code-map'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const catalogEndpoint = 'https://www.westernunion.com/wuconnect/prices/catalog'
const startPageUrl = 'https://www.westernunion.com/us/en/web/send-money/start'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

type FetchOptions = {
  jitterMs?: number
  forceAllPayins?: boolean
  proxyTier?: ProxyTier
}

export const fetchWesternUnionQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const paymentCode = getPaymentCodeForPayin(request.payin_method)
  const fundsIn = options.forceAllPayins ? '*' : paymentCode ?? '*'

  const payload = {
    header_request: { version: '0.5', request_type: 'PRICECATALOG' },
    sender: {
      client: 'WUCOM',
      channel: 'WWEB',
      funds_in: fundsIn,
      curr_iso3: mapCurrency(sourceCurrency),
      cty_iso2_ext: mapCountry(sourceCountry),
      send_amount: String(request.send_amount),
    },
    receiver: {
      curr_iso3: mapCurrency(destCurrency),
      cty_iso2_ext: mapCountry(destCountry),
      cty_iso2: mapCountry(destCountry),
    },
  }

  const response = await httpRequest({
    url: catalogEndpoint,
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      origin: 'https://www.westernunion.com',
      referer: startPageUrl,
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      'x-wu-correlation-id': randomUUID(),
      'x-wu-transaction-id': randomUUID(),
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
