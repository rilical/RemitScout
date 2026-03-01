import { setTimeout as sleep } from 'timers/promises'

import '../../../../shared/node-polyfills'
import { ProxyAgent, fetch as undiciFetch, type Dispatcher } from 'undici'

import type { CollectorRequest, FetchResult } from '../../collectors/types'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { createLogger } from '../../../../shared/logger'
import { retry } from '../../../../shared/retry'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { mapMukuruPayoutMethod, mapMukuruSourceCountry } from './code-map'

const logger = createLogger('plane-b.mukuru.fetch')

const MUKURU_BASE_URL = 'https://mobile.mukuru.com'

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
  timeoutMs?: number
}

export type MukuruProduct = {
  id: number
  title: string
  iso: string
  is_send_calculator?: boolean
  show_fee?: number | boolean
}

type MukuruProductsResponse = {
  status?: string
  data?: MukuruProduct[]
  message?: string
  code?: number
}

export type MukuruQuoteData = {
  payin_amount?: number | string
  payout_amount?: number | string
  rate_message?: string
  charge_message?: string
  amount_adjusted_message?: string
  bonus_amount_message?: string
  breakdown?: Record<string, unknown>
  breakdown_template?: string
}

export type MukuruQuoteResponse = {
  status?: string
  data?: MukuruQuoteData
  message?: string
  code?: number
}

export type MukuruPayload = {
  quote: MukuruQuoteResponse | string
  products: MukuruProduct[]
  selectedProduct: MukuruProduct | null
  payoutMethod: string
  sourceCurrency: string | null
}

type MukuruHttpResponse = {
  status: number
  bodyText: string
  json?: unknown
}

const isSessionExpiredMessage = (message?: string | null) => {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes('session expired') || normalized.includes('reload the page')
}

const isSessionExpiredQuote = (quote: MukuruQuoteResponse | string | undefined) => {
  if (!quote) return false
  if (typeof quote === 'string') {
    return isSessionExpiredMessage(quote)
  }
  return isSessionExpiredMessage(quote.message ?? null)
}

class CookieJar {
  private store = new Map<string, string>()

  applyToHeaders(headers: Record<string, string>) {
    const cookieHeader = Array.from(this.store.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    if (cookieHeader) {
      headers.cookie = cookieHeader
    }
  }

  updateFromSetCookie(setCookie: string[]) {
    for (const entry of setCookie) {
      const [pair] = entry.split(';')
      const [name, value] = pair.split('=')
      if (!name || value === undefined) continue
      const normalizedName = name.trim().toLowerCase()
      const normalizedValue = value.trim().toLowerCase()
      if (normalizedName === 'mukurusession' && normalizedValue === 'deleted') {
        continue
      }
      this.store.set(name.trim(), value.trim())
    }
  }
}

const resolveProxyDispatcher = async (proxyTier?: ProxyTier): Promise<Dispatcher | undefined> => {
  if (!proxyTier) return undefined
  const { getProxyForTier, getProxyForTierSync } = await import('../../lib/proxy-router')
  let proxyUrl = getProxyForTierSync(proxyTier)
  if (!proxyUrl) {
    proxyUrl = await getProxyForTier(proxyTier)
  }
  return proxyUrl ? new ProxyAgent(proxyUrl) : undefined
}

const parseSetCookie = (headers: Headers): string[] => {
  const withGet = headers as Headers & { getSetCookie?: () => string[] }
  if (typeof withGet.getSetCookie === 'function') {
    return withGet.getSetCookie()
  }
  const raw = headers.get('set-cookie')
  if (!raw) return []
  return raw.split(/,(?=[^;]+=[^;]+)/g)
}

const requestWithCookies = async (
  cookieJar: CookieJar,
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
    timeoutMs?: number
    jitterMs?: number
    proxyTier?: ProxyTier
  },
): Promise<MukuruHttpResponse> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 20000,
    jitterMs = 0,
    proxyTier,
  } = options

  if (jitterMs > 0) {
    const delay = Math.floor(Math.random() * jitterMs)
    if (delay > 0) {
      await sleep(delay)
    }
  }

  const dispatcher = await resolveProxyDispatcher(proxyTier)
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestHeaders: Record<string, string> = { ...headers }
  cookieJar.applyToHeaders(requestHeaders)

  const response = await undiciFetch(url, {
    method,
    headers: requestHeaders,
    body,
    dispatcher,
    signal: timeoutSignal,
  })

  const bodyText = await response.text()
  const setCookies = parseSetCookie(response.headers as unknown as Headers)
  cookieJar.updateFromSetCookie(setCookies)

  let json: unknown
  try {
    json = JSON.parse(bodyText)
  } catch (error) {
    logger.debug('mukuru_json_parse_failed', {
      url,
      status: response.status,
      error: error instanceof Error ? error.message : String(error),
    })
    json = undefined
  }

  return {
    status: response.status,
    bodyText,
    json,
  }
}

const selectProduct = (
  products: MukuruProduct[],
  destCurrency: string,
  payoutMethod: string,
): MukuruProduct | null => {
  const normalizedCurrency = destCurrency.toUpperCase()
  const matchingCurrency = products.filter(
    product => product.iso?.toUpperCase() === normalizedCurrency,
  )
  if (!matchingCurrency.length) return null

  if (payoutMethod === 'other') {
    return matchingCurrency[0] ?? null
  }

  const matchingMethod = matchingCurrency.filter(
    product => mapMukuruPayoutMethod(product.title) === payoutMethod,
  )
  if (matchingMethod.length) {
    return matchingMethod[0] ?? null
  }

  return matchingCurrency[0] ?? null
}

const parsePageValue = (html: string, field: string): string | null => {
  const regex = new RegExp(`${field}" value="([^"]+)"`)
  const match = html.match(regex)
  return match?.[1] ?? null
}

export const fetchMukuruQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, destCountry, sourceCurrency, destCurrency } = requireCorridorId(
    request.corridor_id,
  )
  const fromCountry = mapMukuruSourceCountry(sourceCountry)
  const toCountry = destCountry.toUpperCase()
  const locale = request.locale || 'en-US'
  const fetchWithSession = async (cookieJar: CookieJar): Promise<FetchResult> => {
    const pricecheckUrl = `${MUKURU_BASE_URL}/mobi/pricecheck`
      + `?country_shortcode=${fromCountry}`
      + `&destination_country_shortcode=${toCountry}`
      + `&iframe=1`

    const pageResponse = await retry(
      () => requestWithCookies(cookieJar, pricecheckUrl, {
        method: 'GET',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': locale,
          'user-agent': getUserAgentForCorridor(request.corridor_id),
        },
        timeoutMs: options.timeoutMs ?? 20000,
        jitterMs: options.jitterMs ?? 0,
        proxyTier: options.proxyTier,
      }),
      {
        maxRetries: 2,
        initialDelayMs: 750,
      },
    )

    const csrfToken = parsePageValue(pageResponse.bodyText, 'csrf_pricing')
    const pageSourceCurrency = parsePageValue(pageResponse.bodyText, 'from_currency_iso')
    if (!csrfToken) {
      throw new Error('Mukuru csrf_pricing token missing')
    }

    if (pageSourceCurrency && pageSourceCurrency !== sourceCurrency) {
      logger.warn('mukuru_source_currency_mismatch', {
        corridor_id: request.corridor_id,
        expected: sourceCurrency,
        observed: pageSourceCurrency,
      })
    }

    const productsUrl = `${MUKURU_BASE_URL}/pricechecker/get_products`
      + `?from_country=${fromCountry}`
      + `&to_country=${toCountry}`

    const productsResponse = await retry(
      () => requestWithCookies(cookieJar, productsUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          'accept-language': locale,
          referer: pricecheckUrl,
          'user-agent': getUserAgentForCorridor(request.corridor_id),
        },
        timeoutMs: options.timeoutMs ?? 20000,
        jitterMs: options.jitterMs ?? 0,
        proxyTier: options.proxyTier,
      }),
      {
        maxRetries: 2,
        initialDelayMs: 750,
      },
    )

    const productsPayload = productsResponse.json as MukuruProductsResponse | undefined
    const products = Array.isArray(productsPayload?.data) ? productsPayload?.data : []
    if (!products.length) {
      return {
        status: 422,
        bodyText: productsResponse.bodyText,
        payload: {
          quote: productsResponse.json ?? productsResponse.bodyText,
          products: [],
          selectedProduct: null,
          payoutMethod: 'other',
          sourceCurrency: pageSourceCurrency,
        },
      }
    }

    const payoutMethod = mapMukuruPayoutMethod(request.payout_method)
    const selectedProduct = selectProduct(products, destCurrency, payoutMethod)
    if (!selectedProduct) {
      return {
        status: 422,
        bodyText: productsResponse.bodyText,
        payload: {
          quote: productsResponse.json ?? productsResponse.bodyText,
          products,
          selectedProduct: null,
          payoutMethod,
          sourceCurrency: pageSourceCurrency,
        },
      }
    }

    const currencyIso = selectedProduct.iso?.toUpperCase() || destCurrency

    const calculateUrl = `${MUKURU_BASE_URL}/pricechecker/calculate?${new URLSearchParams({
      csrf_pricing: csrfToken,
      from_currency_iso: pageSourceCurrency ?? sourceCurrency,
      payin_amount: String(request.send_amount),
      from_country: fromCountry,
      to_currency_iso: currencyIso,
      payout_amount: '',
      to_country: toCountry,
      currency_id: String(selectedProduct.id),
      active_input: 'payin_amount',
      _: String(Date.now()),
    }).toString()}`

    const quoteResponse = await retry(
      () => requestWithCookies(cookieJar, calculateUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          'accept-language': locale,
          referer: pricecheckUrl,
          origin: MUKURU_BASE_URL,
          'x-requested-with': 'XMLHttpRequest',
          'user-agent': getUserAgentForCorridor(request.corridor_id),
        },
        timeoutMs: options.timeoutMs ?? 20000,
        jitterMs: options.jitterMs ?? 0,
        proxyTier: options.proxyTier,
      }),
      {
        maxRetries: 2,
        initialDelayMs: 750,
      },
    )

    const quotePayload = (quoteResponse.json ?? quoteResponse.bodyText) as MukuruQuoteResponse | string
    const sessionExpired = isSessionExpiredQuote(quotePayload)
    const status = sessionExpired ? 401 : quoteResponse.status

    return {
      status,
      bodyText: quoteResponse.bodyText,
      payload: {
        quote: quotePayload,
        products,
        selectedProduct,
        payoutMethod: mapMukuruPayoutMethod(selectedProduct.title),
        sourceCurrency: pageSourceCurrency,
      } as MukuruPayload,
    }
  }

  const firstAttempt = await fetchWithSession(new CookieJar())
  const firstQuote = (firstAttempt.payload as MukuruPayload | undefined)?.quote
  if (firstAttempt.status === 401 && isSessionExpiredQuote(firstQuote)) {
    logger.warn('mukuru_session_expired_retry', {
      corridor_id: request.corridor_id,
    })
    return fetchWithSession(new CookieJar())
  }

  return firstAttempt
}
