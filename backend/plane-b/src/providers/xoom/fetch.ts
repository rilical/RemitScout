import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { getUserAgentForCorridor } from '../../collectors/user-agent'

const logger = createLogger('plane-b.xoom.fetch')
const baseUrl = 'https://www.xoom.com'

export type XoomRemittance = {
  id?: string | null
  selectedDisbursementType?: string | null
  sourceCountry?: string | null
  sourceCurrency?: string | null
  destinationCountry?: string | null
  destinationCurrency?: string | null
  recipient?: unknown | null
  validations?: Array<{ code?: string | null; message?: string | null; path?: string | null; level?: string | null }> | null
  quote?: {
    pricing?: unknown[] | null
  } | null
}

export type XoomQuotePayload = {
  remittance?: XoomRemittance | null
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const formatLocale = (value?: string) => {
  if (!value) return 'en-us'
  return value.replace(/_/g, '-').toLowerCase()
}

const formatSendAmount = (value: number) => {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

const extractRemittanceFromHtml = (html: string): XoomRemittance | null => {
  const marker = '\\"remittance\\":'
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return null

  const start = html.indexOf('{', markerIndex)
  if (start === -1) return null

  let depth = 0
  let end = -1
  for (let i = start; i < html.length; i += 1) {
    const char = html[i]
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0 && i > start) {
      end = i
      break
    }
  }

  if (end === -1) return null

  const raw = html.slice(start, end + 1)
  const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\')

  try {
    return JSON.parse(unescaped) as XoomRemittance
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn('xoom_remittance_parse_failed', { error: message })
    return null
  }
}

export const fetchXoomQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult<XoomQuotePayload>> => {
  const { destCountry, sourceCurrency, destCurrency } = requireCorridorId(request.corridor_id)

  const locale = formatLocale(request.locale)
  const sendAmount = formatSendAmount(request.send_amount)

  const params = new URLSearchParams({
    countryCode: destCountry,
    sendAmount,
    destinationCurrencyCode: destCurrency,
  })

  const url = `${baseUrl}/${locale}/${sourceCurrency.toLowerCase()}/send-money/transfer?${params.toString()}`

  const response = await httpRequest({
    url,
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': request.locale || 'en-US',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      referer: baseUrl,
    },
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  const remittance = extractRemittanceFromHtml(response.bodyText)

  return {
    status: response.status,
    bodyText: response.bodyText,
    payload: { remittance },
  }
}
