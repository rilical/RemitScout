import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import {
  DEFAULT_INTERMEX_DELIVERY_TYPE,
  DEFAULT_INTERMEX_ORIGIN_COUNTRY,
  DEFAULT_INTERMEX_ORIGIN_STATE,
  DEFAULT_INTERMEX_STYLE_ID,
  resolveIntermexDestinationCode,
  resolvePayinMethodId,
  resolveTranTypeId,
} from './code-map'

const intermexEndpoint = 'https://api.imxi.com/pricing/api/v3/feesrates'

const buildHeaders = (request: CollectorRequest) => {
  const locale = request.locale || 'en-US'
  return {
    accept: 'application/json, text/plain, */*',
    'accept-language': locale,
    channelid: '1',
    languageid: '1',
    partnerid: '1',
    'ocp-apim-subscription-key': '2162a586e2164623a1cd9b6b2d300b4c',
    origin: 'https://www.intermexonline.com',
    referer: 'https://www.intermexonline.com/',
    'user-agent': getUserAgentForCorridor(request.corridor_id),
  }
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchIntermexQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { destCountry, destCurrency, sourceCurrency } = requireCorridorId(request.corridor_id)
  const destCode = resolveIntermexDestinationCode(destCountry, destCurrency)

  if (!destCode) {
    throw new Error(`Unsupported Intermex destination: ${destCountry}-${destCurrency}`)
  }

  const params = new URLSearchParams({
    DestCountryAbbr: destCode,
    DestCurrency: destCurrency,
    OriCountryAbbr: DEFAULT_INTERMEX_ORIGIN_COUNTRY,
    OriStateAbbr: DEFAULT_INTERMEX_ORIGIN_STATE,
    StyleId: String(DEFAULT_INTERMEX_STYLE_ID),
    TranTypeId: String(resolveTranTypeId(request.payout_method)),
    DeliveryType: DEFAULT_INTERMEX_DELIVERY_TYPE,
    OriCurrency: sourceCurrency ?? 'USD',
    ChannelId: '1',
    OriAmount: String(request.send_amount),
    DestAmount: '0',
    SenderPaymentMethodId: String(resolvePayinMethodId(request.payin_method)),
  })

  const url = `${intermexEndpoint}?${params.toString()}`

  const response = await httpRequest({
    url,
    headers: buildHeaders(request),
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
