import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const wirebarleyBaseUrl = 'https://www.wirebarley.com/kr/remittance/api/v1/exrate'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const buildHeaders = (request: CollectorRequest) => {
  const locale = request.locale || 'en-US'
  const language = locale.split('-')[0] || 'en'
  return {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'accept-language': locale,
    'device-type': 'WEB',
    'device-model': 'Chrome',
    'device-version': '143.0.0.0',
    lang: language,
    origin: 'https://www.wirebarley.com',
    referer: 'https://www.wirebarley.com/',
    'user-agent': getUserAgentForCorridor(request.corridor_id),
  }
}

export const fetchWireBarleyQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, sourceCurrency } = requireCorridorId(request.corridor_id)
  const url = `${wirebarleyBaseUrl}/${sourceCountry}/${sourceCurrency}`

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
