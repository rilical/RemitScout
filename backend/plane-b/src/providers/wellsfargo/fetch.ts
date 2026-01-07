import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const wellsFargoEndpoint = 'https://www.wellsfargo.com/as/grs/country/rnm/paymentMethod/amount'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchWellsFargoQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { destCountry } = requireCorridorId(request.corridor_id)

  if (destCountry !== 'MX') {
    throw new Error(`Wells Fargo only supports Mexico (MX) as destination country, got: ${destCountry}`)
  }

  const formData = new URLSearchParams({
    country: 'MX',
    location: '9',
    method: 'ACCT_TO_ACCT',
    sendAmount: String(request.send_amount),
    lang: 'en',
  })

  const response = await httpRequest({
    url: wellsFargoEndpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Origin': 'https://www.wellsfargo.com',
      'Referer': 'https://www.wellsfargo.com/international-remittances/cost-estimator/',
      'User-Agent': getUserAgentForCorridor(request.corridor_id),
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    body: formData.toString(),
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

