import type { CollectorRequest, FetchResult } from '../../collectors/types'
import { httpRequest } from '../../collectors/http-client'
import type { ProxyTier } from '../../lib/proxy-router'
import { requireCorridorId } from '../../../../shared/corridor'
import { getUserAgentForCorridor } from '../../collectors/user-agent'
import { mapPayinMethod, normalizeMethodToken } from './code-map'

const instaremBaseUrl = 'https://www.instarem.com/api'
const paymentMethodPath = '/v1/public/payment-method/fee'
const computedValuePath = '/v1/public/transaction/computed-value'

export type InstaremPaymentMethod = {
  key?: number | string
  value?: number | string
  text?: string | null
  code?: string | null
  icon_url?: string | null
  is_pg?: boolean | null
  [key: string]: unknown
}

type FetchOptions = {
  jitterMs?: number
  proxyTier?: ProxyTier
}

const buildHeaders = (corridorId: string) => ({
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  origin: 'https://www.instarem.com',
  referer: 'https://www.instarem.com/',
  'user-agent': getUserAgentForCorridor(corridorId),
})

const extractPaymentMethods = (payload: unknown): InstaremPaymentMethod[] => {
  if (!payload || typeof payload !== 'object') return []
  const data = (payload as { data?: unknown }).data
  if (Array.isArray(data)) return data as InstaremPaymentMethod[]
  if (Array.isArray(payload)) return payload as InstaremPaymentMethod[]
  return []
}

const methodDescriptor = (method: InstaremPaymentMethod) =>
  [method.text, method.code, method.icon_url].filter(Boolean).join(' ')

const selectPaymentMethod = (
  methods: InstaremPaymentMethod[],
  requestedPayin: string,
): InstaremPaymentMethod | null => {
  if (!methods.length) return null

  const desired = normalizeMethodToken(requestedPayin)
  if (!desired || desired === 'other') return methods[0]

  const matches = methods.filter((method) => {
    const mapped = mapPayinMethod(methodDescriptor(method))
    return mapped === requestedPayin
  })

  if (matches.length === 0) return methods[0]
  if (matches.length === 1) return matches[0]

  const priority = (method: InstaremPaymentMethod) => {
    const token = normalizeMethodToken(methodDescriptor(method))
    if (requestedPayin === 'bank_transfer') {
      if (token.includes('bank') || token.includes('transfer') || token.includes('wire') || token.includes('ach')) {
        return 2
      }
      if (token.includes('paynow')) return 1
      return 0
    }
    if (requestedPayin === 'debit_card' && token.includes('debit')) return 2
    if (requestedPayin === 'credit_card' && token.includes('credit')) return 2
    if (requestedPayin === 'apple_pay' && token.includes('apple')) return 2
    if (requestedPayin === 'google_pay' && token.includes('google')) return 2
    return 1
  }

  return matches.sort((a, b) => priority(b) - priority(a))[0] ?? matches[0]
}

const resolveBankAccountId = (method: InstaremPaymentMethod | null): string | null => {
  if (!method) return null
  const key = method.key ?? method.value
  if (key === null || key === undefined) return null
  return String(key)
}

export const fetchInstaremQuote = async (
  request: CollectorRequest,
  options: FetchOptions = {},
): Promise<FetchResult> => {
  const { sourceCountry, sourceCurrency, destCurrency } = requireCorridorId(request.corridor_id)
  const headers = buildHeaders(request.corridor_id)

  const paymentMethodParams = new URLSearchParams({
    source_currency: sourceCurrency,
    source_amount: String(request.send_amount),
    destination_currency: destCurrency,
    country_code: sourceCountry,
  })

  const paymentMethodUrl = `${instaremBaseUrl}${paymentMethodPath}?${paymentMethodParams.toString()}`
  const paymentMethodResponse = await httpRequest({
    url: paymentMethodUrl,
    headers,
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  const paymentMethods = extractPaymentMethods(paymentMethodResponse.json ?? paymentMethodResponse.bodyText)
  if (paymentMethodResponse.status >= 400 || paymentMethods.length === 0) {
    return {
      status: paymentMethodResponse.status,
      bodyText: paymentMethodResponse.bodyText,
      payload: paymentMethodResponse.json ?? paymentMethodResponse.bodyText,
    }
  }

  const selectedMethod = selectPaymentMethod(paymentMethods, request.payin_method)
  const bankAccountId = resolveBankAccountId(selectedMethod)
  if (!bankAccountId) {
    return {
      status: 400,
      bodyText: paymentMethodResponse.bodyText,
      payload: {
        error: 'missing_bank_account_id',
        payment_methods: paymentMethods,
      },
    }
  }

  const quoteParams = new URLSearchParams({
    source_currency: sourceCurrency,
    destination_currency: destCurrency,
    instarem_bank_account_id: bankAccountId,
    country_code: sourceCountry,
    source_amount: String(request.send_amount),
  })

  const quoteUrl = `${instaremBaseUrl}${computedValuePath}?${quoteParams.toString()}`
  const quoteResponse = await httpRequest({
    url: quoteUrl,
    headers,
    jitterMs: options.jitterMs,
    proxyTier: options.proxyTier,
    corridorId: request.corridor_id,
  })

  const payload = {
    payment_methods: paymentMethods,
    selected_payment_method: selectedMethod,
    quote: (quoteResponse.json as { data?: unknown } | undefined)?.data ?? quoteResponse.json ?? null,
  }

  return {
    status: quoteResponse.status,
    bodyText: quoteResponse.bodyText,
    payload,
  }
}
