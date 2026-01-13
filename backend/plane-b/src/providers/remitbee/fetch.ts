import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getCountryIdForIso2 } from './code-map'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { REMITBEE_DESTINATION_CURRENCY_OPTIONS } from './supported-corridors'

const remitbeeEndpoint = 'https://api.remitbee.com/public-services/compressed/calculate-money-transfer'

const formatAmount = (value: number) => {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchRemitbeeQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const normalizedDestCountry = destCountry.toUpperCase()
  const countryId = getCountryIdForIso2(normalizedDestCountry)
  const allowedCurrencies = REMITBEE_DESTINATION_CURRENCY_OPTIONS[normalizedDestCountry] ?? []
  const normalizedDestCurrency = destCurrency.toUpperCase()

  if (!countryId || !allowedCurrencies.length) {
    throw new Error(`unsupported remitbee corridor: ${request.corridor_id}`)
  }

  if (!allowedCurrencies.includes(normalizedDestCurrency)) {
    throw new Error(
      `remitbee corridor currency mismatch: ${destCountry} expects ${allowedCurrencies.join(', ')} but got ${destCurrency}`,
    )
  }

  if (sourceCountry.toUpperCase() !== 'CA' || sourceCurrency.toUpperCase() !== 'CAD') {
    throw new Error(`remitbee only supports CA/CAD as source: ${request.corridor_id}`)
  }

  const body = {
    transfer_amount: formatAmount(request.send_amount),
    country_id: countryId,
    currency_code: normalizedDestCurrency,
    include_timeline: true,
    is_special_rate: true,
  }

  const locale = request.locale || 'en-US'

  const response = await httpRequest({
    url: remitbeeEndpoint,
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://www.remitbee.com',
      referer: 'https://www.remitbee.com/',
      'accept-language': locale,
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    },
    body,
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
