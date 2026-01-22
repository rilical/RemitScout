import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import {
  countryCodeMap,
  currencyCodeMap,
  getDeliveryMethodForPayout,
  getPaymentMethodForPayin,
} from './code-map'

const riaEndpoint = 'https://public.riamoneytransfer.com/MoneyTransferCalculator/Calculate'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchRiaQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )
  const locale = request.locale || 'en-US'
  const mapCountry = (code: string) => countryCodeMap[code] ?? code
  const mapCurrency = (code: string) => currencyCodeMap[code] ?? code

  const headers = {
    accept: '*/*',
    'content-type': 'application/json',
    pragma: 'no-cache',
    'cache-control': 'no-cache',
    origin: 'https://www.riamoneytransfer.com',
    referer: 'https://www.riamoneytransfer.com/',
    'accept-language': locale,
    'user-agent': getUserAgentForCorridor(request.corridor_id),
    'client-type': 'PublicSite',
    culturecode: locale,
    appversion: '4.0',
  }

  const buildBody = (localeValue: string) => ({
    selections: {
      countryFrom: mapCountry(sourceCountry),
      countryTo: mapCountry(destCountry),
      currencyFrom: mapCurrency(sourceCurrency),
      currencyTo: mapCurrency(destCurrency),
      amountFrom: request.send_amount,
      paymentMethod: getPaymentMethodForPayin(request.payin_method),
      deliveryMethod: getDeliveryMethodForPayout(request.payout_method),
      promoId: 0,
      shouldCalcAmountFrom: false,
      shouldCalcVariableRates: true,
      locale: localeValue,
    },
  })

  const execute = async (localeValue: string) =>
    httpRequest({
      url: riaEndpoint,
      method: 'POST',
      headers,
      body: buildBody(localeValue),
      jitterMs: options.jitterMs,
      proxyTier: options.proxyTier,
      corridorId: request.corridor_id,
    })

  let response
  try {
    response = await execute(locale.toLowerCase())
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('HTTP 500') && locale.toLowerCase() !== locale) {
      response = await execute(locale)
    } else {
      throw error
    }
  }

  return {
    status: response.status,
    bodyText: response.bodyText,
    parseError: response.parseError,
    payload: response.json ?? response.bodyText,
  }
}
