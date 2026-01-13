import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import {
  getRecipientTypesForCurrency,
  mapPayoutMethodToRecipientType,
} from './code-map'

const ratesEndpoint = 'https://www.orbitremit.com/api/rates'
const feesEndpoint = 'https://www.orbitremit.com/api/fees'

const SUPPORTED_SOURCE_COUNTRIES = new Set(['AU', 'NZ'])
const SUPPORTED_SOURCE_CURRENCIES = new Set(['AUD', 'NZD'])

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const formatAmount = (amount: number) => amount.toFixed(2)

const resolveRecipientType = (
  payoutMethod: string,
  destCurrency: string,
): { recipientType: string; requestedRecipientType: string | null } => {
  const available = getRecipientTypesForCurrency(destCurrency)
  const requested = mapPayoutMethodToRecipientType(payoutMethod, destCurrency)
  if (requested && available.includes(requested)) {
    return { recipientType: requested, requestedRecipientType: requested }
  }
  if (available.length > 0) {
    return { recipientType: available[0], requestedRecipientType: requested }
  }
  return { recipientType: requested ?? 'bank_account', requestedRecipientType: requested }
}

export const fetchOrbitRemitQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const sourceCountryCode = sourceCountry.toUpperCase()
  const sourceCurrencyCode = sourceCurrency.toUpperCase()
  const destCurrencyCode = destCurrency.toUpperCase()

  if (!SUPPORTED_SOURCE_COUNTRIES.has(sourceCountryCode)) {
    return {
      status: 400,
      bodyText: `Unsupported source country for OrbitRemit: ${sourceCountryCode}`,
      payload: {
        error: 'unsupported_source_country',
        message: 'OrbitRemit quotes are only available for AU/NZ send corridors.',
        sourceCountry: sourceCountryCode,
      },
    }
  }

  if (!SUPPORTED_SOURCE_CURRENCIES.has(sourceCurrencyCode)) {
    return {
      status: 400,
      bodyText: `Unsupported source currency for OrbitRemit: ${sourceCurrencyCode}`,
      payload: {
        error: 'unsupported_source_currency',
        message: 'OrbitRemit quotes are only available for AUD/NZD send amounts.',
        sourceCurrency: sourceCurrencyCode,
      },
    }
  }

  const { recipientType, requestedRecipientType } = resolveRecipientType(
    request.payout_method,
    destCurrencyCode,
  )

  const headers = {
    accept: '*/*',
    'accept-language': request.locale ?? 'en-US',
    origin: 'https://www.orbitremit.com',
    referer: 'https://www.orbitremit.com',
    'user-agent': getUserAgentForCorridor(request.corridor_id),
  }

  const amount = formatAmount(request.send_amount)
  const ratePayload = {
    sendCurrency: sourceCurrencyCode,
    payoutCurrency: destCurrencyCode,
    amount,
    recipientType,
    focus: 'send',
  }

  const feeParams = new URLSearchParams({
    send: sourceCurrencyCode,
    payout: destCurrencyCode,
    amount,
    type: recipientType,
  })

  const [rateResponse, feeResponse] = await Promise.all([
    httpRequest({
      url: ratesEndpoint,
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json',
      },
      body: ratePayload,
      jitterMs: options.jitterMs,
      proxyTier: options.proxyTier,
      corridorId: request.corridor_id,
    }),
    httpRequest({
      url: `${feesEndpoint}?${feeParams.toString()}`,
      method: 'GET',
      headers,
      jitterMs: options.jitterMs,
      proxyTier: options.proxyTier,
      corridorId: request.corridor_id,
    }),
  ])

  return {
    status: rateResponse.status,
    bodyText: rateResponse.bodyText,
    payload: {
      rate: rateResponse.json ?? rateResponse.bodyText,
      fee: feeResponse.json ?? feeResponse.bodyText,
      meta: {
        recipientType,
        requestedRecipientType,
        availableRecipientTypes: getRecipientTypesForCurrency(destCurrencyCode),
      },
    },
  }
}
