import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { config } from '../../../../shared/config'
import {
  BOSSMONEY_DESTINATION_CURRENCY_OPTIONS,
  BOSSMONEY_SOURCE_PAIRS,
} from './supported-corridors'

const quotesEndpoint = 'https://api.idtm.io/money-transfer/public/transfer/promo-calculation'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const formatAmount = (value: number) => {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

const SUPPORTED_SOURCE_PAIRS = new Set(
  BOSSMONEY_SOURCE_PAIRS.map(([country, currency]) => `${country}-${currency}`),
)

export const fetchBossMoneyQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const sourceCountryCode = sourceCountry.toUpperCase()
  const sourceCurrencyCode = sourceCurrency.toUpperCase()
  const destCountryCode = destCountry.toUpperCase()
  const destCurrencyCode = destCurrency.toUpperCase()

  if (!SUPPORTED_SOURCE_PAIRS.has(`${sourceCountryCode}-${sourceCurrencyCode}`)) {
    return {
      status: 400,
      bodyText: `Unsupported source corridor for Boss Money: ${sourceCountryCode}-${sourceCurrencyCode}`,
      payload: {
        error: 'unsupported_source_country',
        message: 'Boss Money quotes are only available for US/USD, CA/CAD, or AU/AUD send corridors.',
        sourceCountry: sourceCountryCode,
        sourceCurrency: sourceCurrencyCode,
      },
    }
  }

  const allowedCurrencies = BOSSMONEY_DESTINATION_CURRENCY_OPTIONS[destCountryCode] ?? []
  if (!allowedCurrencies.length || !allowedCurrencies.includes(destCurrencyCode)) {
    return {
      status: 400,
      bodyText: `Unsupported destination currency for Boss Money: ${destCountryCode}-${destCurrencyCode}`,
      payload: {
        error: 'unsupported_destination_currency',
        message: 'Boss Money does not support this destination currency for the selected country.',
        destCountry: destCountryCode,
        destCurrency: destCurrencyCode,
        allowedCurrencies,
      },
    }
  }

  const locale = request.locale || 'en-US'
  const stateCode = config.planeB.bossmoney.stateCode || 'NJ'

  const body = {
    amount_type: 'sender',
    recipient_country_code: destCountryCode,
    recipient_currency_code: destCurrencyCode,
    sender_country_code: sourceCountryCode,
    sender_currency_code: sourceCurrencyCode,
    sender_state_code: stateCode,
    send_amount: formatAmount(request.send_amount),
  }

  const response = await httpRequest({
    url: quotesEndpoint,
    method: 'POST',
    headers: {
      accept: 'application/json',
      'accept-language': locale,
      'content-type': 'application/json',
      origin: 'https://www.bossmoney.com',
      referer: 'https://www.bossmoney.com/',
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
