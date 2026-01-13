import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { countryCodeMap, currencyCodeMap, getPayoutTypeForMethod } from './code-map'

const DAHABSHIIL_ENDPOINT = 'https://apigw-us.dahabshiil.com/remit/transaction/get-charges-anonymous'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

const formatAmount = (amount: number) => {
  if (!Number.isFinite(amount)) return '0.00'
  return amount.toFixed(2)
}

export const fetchDahabshiilQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, destCurrency } = requireCorridorId(request.corridor_id)

  const params = new URLSearchParams({
    source_country_code: mapCountry(sourceCountry),
    destination_country_iso2: mapCountry(destCountry),
    amount_type: 'SOURCE',
    amount: formatAmount(request.send_amount),
    destination_currency: mapCurrency(destCurrency),
    type: getPayoutTypeForMethod(request.payout_method),
  })

  const response = await httpRequest({
    url: `${DAHABSHIIL_ENDPOINT}?${params.toString()}`,
    method: 'GET',
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': request.locale || 'en-US',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      origin: 'https://www.dahabshiil.com',
      referer: 'https://www.dahabshiil.com/',
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
