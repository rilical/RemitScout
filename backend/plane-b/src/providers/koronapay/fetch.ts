import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import {
  countryCodeMap,
  currencyCodeMap,
  currencyMinorUnits,
  getPaymentMethodForPayin,
  getReceivingMethodForPayout,
} from './code-map'

const tariffsEndpoint = 'https://koronapay.com/api/transfers/tariffs'
const tariffsInfoEndpoint = 'https://koronapay.com/api/transfers/tariffs/info'

const mapCountry = (code: string) => countryCodeMap[code] ?? code
const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

const getMinorUnits = (currency: string) => {
  const key = currency.toUpperCase()
  return currencyMinorUnits[key] ?? 2
}

const toMinorUnits = (amount: number, currency: string) => {
  const factor = Math.pow(10, getMinorUnits(currency))
  return Math.round(amount * factor)
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchKoronaPayQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )

  const paymentMethod = getPaymentMethodForPayin(request.payin_method)
  const receivingMethod = getReceivingMethodForPayout(request.payout_method)
  const sendingAmount = toMinorUnits(request.send_amount, sourceCurrency)

  const quoteParams = new URLSearchParams({
    sendingCountryId: mapCountry(sourceCountry),
    receivingCountryId: mapCountry(destCountry),
    sendingCurrencyId: mapCurrency(sourceCurrency),
    receivingCurrencyId: mapCurrency(destCurrency),
    sendingAmount: String(sendingAmount),
    paymentMethod,
    receivingMethod,
    paidNotificationEnabled: 'false',
  })

  const infoParams = new URLSearchParams({
    sendingCountryId: mapCountry(sourceCountry),
    receivingCountryId: mapCountry(destCountry),
    forTransferRepeat: 'false',
    paymentMethod,
  })

  const headers = {
    accept: 'application/vnd.cft-data.v2.152+json',
    pragma: 'no-cache',
    'cache-control': 'no-cache',
    'accept-language': request.locale || 'en',
    referer: 'https://koronapay.com/transfers/europe/en/',
    'user-agent': getUserAgentForCorridor(request.corridor_id),
    'x-application': 'Qpay-Web/3.0',
  }

  const [quoteResponse, infoResponse] = await Promise.all([
    httpRequest({
      url: `${tariffsEndpoint}?${quoteParams.toString()}`,
      headers,
      jitterMs: options.jitterMs,
      proxyTier: options.proxyTier,
      corridorId: request.corridor_id,
    }),
    httpRequest({
      url: `${tariffsInfoEndpoint}?${infoParams.toString()}`,
      headers,
      jitterMs: options.jitterMs,
      proxyTier: options.proxyTier,
      corridorId: request.corridor_id,
    }),
  ])

  return {
    status: quoteResponse.status,
    bodyText: quoteResponse.bodyText,
    payload: {
      tariffs: quoteResponse.json ?? quoteResponse.bodyText,
      tariffInfo: infoResponse.json ?? infoResponse.bodyText,
    },
  }
}
