type OutboundLinkInput = {
  providerId: string
  targetUrl?: string | null
  corridorId?: string
  amount?: number
  payin?: string
  payout?: string
  quotedRate?: number
  quotedFee?: number
  isAffiliate?: boolean
  from?: string
  to?: string
  fromCurrency?: string
  toCurrency?: string
  source?: string
  utm?: Record<string, string>
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

export const extractUtmParams = (query: Record<string, unknown> = {}) => {
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = query[key]
    if (typeof value === 'string' && value.trim()) {
      utm[key] = value
    }
  }
  return Object.keys(utm).length ? utm : undefined
}

const setIf = (params: URLSearchParams, key: string, value?: string | number | boolean | null) => {
  if (value === undefined || value === null || value === '') return
  if (typeof value === 'boolean') {
    params.set(key, value ? '1' : '0')
    return
  }
  params.set(key, String(value))
}

export const buildOutboundUrl = (input: OutboundLinkInput) => {
  const params = new URLSearchParams()

  setIf(params, 'target', input.targetUrl ?? undefined)
  setIf(params, 'corridor_id', input.corridorId)
  setIf(params, 'amount', input.amount)
  setIf(params, 'payin', input.payin)
  setIf(params, 'payout', input.payout)
  setIf(params, 'rate', input.quotedRate)
  setIf(params, 'fee', input.quotedFee)
  setIf(params, 'affiliate', input.isAffiliate ?? undefined)
  setIf(params, 'from', input.from)
  setIf(params, 'to', input.to)
  setIf(params, 'fromCurrency', input.fromCurrency)
  setIf(params, 'toCurrency', input.toCurrency)
  setIf(params, 'source', input.source)

  if (input.utm) {
    for (const [key, value] of Object.entries(input.utm)) {
      setIf(params, key, value)
    }
  }

  const query = params.toString()
  if (!query) {
    return `/go/${encodeURIComponent(input.providerId)}`
  }
  return `/go/${encodeURIComponent(input.providerId)}?${query}`
}
