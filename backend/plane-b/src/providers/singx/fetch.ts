import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import {
  SINGX_DESTINATION_COUNTRY_BY_CURRENCY,
  SINGX_DESTINATION_CURRENCIES_BY_SOURCE,
  SINGX_SOURCE_COUNTRY_BY_CURRENCY,
} from './supported-corridors'

const singxEndpoint = 'https://api.singx.co/central/landing/fx/SG/exchange'

const formatAmount = (value: number) => {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchSingxQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const normalizedSourceCurrency = sourceCurrency.toUpperCase()
  const normalizedDestCurrency = destCurrency.toUpperCase()
  const expectedSourceCountry = SINGX_SOURCE_COUNTRY_BY_CURRENCY[normalizedSourceCurrency]
  const allowedDestCurrencies =
    SINGX_DESTINATION_CURRENCIES_BY_SOURCE[normalizedSourceCurrency] ?? []
  const expectedDestCountry = SINGX_DESTINATION_COUNTRY_BY_CURRENCY[normalizedDestCurrency]

  if (!expectedSourceCountry) {
    throw new Error(`unsupported singx source currency: ${normalizedSourceCurrency}`)
  }

  if (expectedSourceCountry !== sourceCountry.toUpperCase()) {
    throw new Error(
      `singx corridor source mismatch: ${request.corridor_id} expects ${expectedSourceCountry}`,
    )
  }

  if (!allowedDestCurrencies.includes(normalizedDestCurrency)) {
    throw new Error(
      `singx unsupported destination currency: ${normalizedDestCurrency} for ${normalizedSourceCurrency}`,
    )
  }

  if (!expectedDestCountry || expectedDestCountry !== destCountry.toUpperCase()) {
    throw new Error(
      `singx corridor destination mismatch: ${request.corridor_id} expects ${expectedDestCountry ?? 'unknown'}`,
    )
  }

  const body = {
    fromCurrency: normalizedSourceCurrency,
    toCurrency: normalizedDestCurrency,
    amount: formatAmount(request.send_amount),
    type: 'Send',
    swift: false,
    cashPickup: false,
    wallet: false,
    business: false,
  }

  const locale = request.locale || 'en-US'

  const response = await httpRequest({
    url: singxEndpoint,
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://www.singx.co',
      referer: 'https://www.singx.co/',
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
