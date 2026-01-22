import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import {
  ALANSARI_SOURCE_CURRENCY_ID,
  resolveDestination,
  resolveTransferType,
} from './code-map'

const alansariBaseUrl = 'https://alansariexchange.com'
const alansariHomeUrl = `${alansariBaseUrl}/`
const alansariAjaxUrl = `${alansariBaseUrl}/wp-admin/admin-ajax.php`
const NONCE_TTL_MS = 10 * 60 * 1000

const nonceCache: { value: string; expiresAt: number } = {
  value: '',
  expiresAt: 0,
}
let noncePromise: Promise<string> | null = null

const buildHeaders = (request: CollectorRequest) => {
  const locale = request.locale || 'en-US'
  return {
    accept: '*/*',
    'accept-language': locale,
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    origin: alansariBaseUrl,
    referer: alansariHomeUrl,
    'user-agent': getUserAgentForCorridor(request.corridor_id),
    'x-requested-with': 'XMLHttpRequest',
  }
}

const buildHomeHeaders = (request: CollectorRequest) => {
  const locale = request.locale || 'en-US'
  return {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': locale,
    referer: alansariHomeUrl,
    'user-agent': getUserAgentForCorridor(request.corridor_id),
  }
}

const extractAjaxNonce = (html: string): string | null => {
  const match = html.match(/CC_Ajax_Object\s*=\s*\{[^}]*?["']?ajax_nonce["']?\s*:\s*["']([^"']+)["']/)
  if (match?.[1]) return match[1]
  const fallback = html.match(/BN_Ajax_Object\s*=\s*\{[^}]*?["']?ajax_nonce["']?\s*:\s*["']([^"']+)["']/)
  if (fallback?.[1]) return fallback[1]
  return null
}

const fetchAjaxNonce = async (
  request: CollectorRequest,
  options: { jitterMs?: number; proxyTier?: ProxyTier } = {},
): Promise<string> => {
  const response = await httpRequest({
    url: alansariHomeUrl,
    headers: buildHomeHeaders(request),
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  if (response.status !== 200) {
    throw new Error(`Al Ansari nonce fetch failed: HTTP ${response.status}`)
  }

  const nonce = extractAjaxNonce(response.bodyText)
  if (!nonce) {
    throw new Error('Al Ansari nonce not found in homepage')
  }

  nonceCache.value = nonce
  nonceCache.expiresAt = Date.now() + NONCE_TTL_MS
  return nonce
}

const getAjaxNonce = async (
  request: CollectorRequest,
  options: { jitterMs?: number; proxyTier?: ProxyTier } = {},
) => {
  if (nonceCache.value && Date.now() < nonceCache.expiresAt) {
    return nonceCache.value
  }

  if (!noncePromise) {
    noncePromise = fetchAjaxNonce(request, options)
      .catch((error) => {
        nonceCache.value = ''
        nonceCache.expiresAt = 0
        throw error
      })
      .finally(() => {
        noncePromise = null
      })
  }

  return noncePromise
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

export const fetchAlansariQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { destCountry, destCurrency } = requireCorridorId(request.corridor_id)
  const destination = resolveDestination(destCountry, destCurrency)

  if (!destination) {
    throw new Error(`Unsupported Al Ansari destination: ${destCountry}-${destCurrency}`)
  }

  const nonce = await getAjaxNonce(request, options)
  const body = new URLSearchParams({
    action: 'convert_action',
    currfrom: String(ALANSARI_SOURCE_CURRENCY_ID),
    currto: String(destination.currencyId),
    cntcode: String(destination.countryId),
    amt: String(request.send_amount),
    security: nonce,
    trtype: resolveTransferType(request.payout_method),
  }).toString()

  const response = await httpRequest({
    url: alansariAjaxUrl,
    method: 'POST',
    headers: buildHeaders(request),
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
