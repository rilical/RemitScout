/**
 * No-quotes audit (API-driven)
 *
 * Goal:
 * - Produce a ranked list of missing providers/corridors by reason code (esp. `no_quotes`)
 * - Focus on major send currencies: USD/AED/GBP/EUR (SAR intentionally excluded)
 * - Use Plane A `/api/v1/providers` so the output matches frontend behavior.
 *
 * Required env:
 * - PLANE_A_BASE_URL (or API_BASE_URL): e.g. https://<api-id>.execute-api.us-east-1.amazonaws.com/dev
 *
 * Optional env:
 * - SEND_CURRENCIES=USD,AED,GBP,EUR
 * - METHOD=bank|cash|wallet|airtime (default bank)
 * - AMOUNT=100
 * - REFRESH=0|1 (default 0 to avoid spamming refresh)
 * - MAX_CORRIDORS=200
 * - PROVIDERS=westernunion,remitly (filter)
 */

import { HEALTH_CORRIDORS } from '../shared/health-corridors'

type ExcludedProvider = { provider: string; reason: string }
type ExcludedProviderDetailed = { provider: string; reason: string; details?: Record<string, unknown> }

const parseList = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const normalizeCurrency = (value: string): string => value.trim().toUpperCase()

const toBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === null || value === '') return defaultValue
  const token = value.trim().toLowerCase()
  if (token === '1' || token === 'true' || token === 'yes' || token === 'y') return true
  if (token === '0' || token === 'false' || token === 'no' || token === 'n') return false
  return defaultValue
}

const getBaseUrl = (): URL => {
  const raw = (process.env.PLANE_A_BASE_URL || process.env.API_BASE_URL || '').trim()
  if (!raw) {
    throw new Error('Missing PLANE_A_BASE_URL (or API_BASE_URL)')
  }
  return new URL(raw)
}

const buildProvidersUrl = (
  base: URL,
  input: { corridorId: string; amount: number; method: string; refresh: boolean },
): string => {
  const url = new URL(base.toString())
  const prefix = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname
  url.pathname = `${prefix}/api/v1/providers`
  const parts = input.corridorId.split('-')
  if (parts.length === 4) {
    url.searchParams.set('from', parts[0] || '')
    url.searchParams.set('to', parts[1] || '')
    url.searchParams.set('fromCurrency', parts[2] || '')
    url.searchParams.set('toCurrency', parts[3] || '')
  } else {
    url.searchParams.set('corridor_id', input.corridorId)
  }
  url.searchParams.set('amount', String(input.amount))
  url.searchParams.set('method', input.method)
  url.searchParams.set('refresh', input.refresh ? '1' : '0')
  return url.toString()
}

const fetchJson = async (url: string, timeoutMs: number): Promise<{ status: number; body: any }> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      signal: controller.signal,
    })
    const text = await res.text()
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = { _raw: text }
    }
    return { status: res.status, body }
  } finally {
    clearTimeout(timer)
  }
}

const parseCorridorSendCurrency = (corridorId: string): string | null => {
  const parts = corridorId.split('-')
  if (parts.length !== 4) return null
  return normalizeCurrency(parts[2] || '')
}

export const runNoQuotesAudit = async () => {
  const base = getBaseUrl()
  const sendCurrencies = new Set(
    parseList(process.env.SEND_CURRENCIES || 'USD,AED,GBP,EUR').map(normalizeCurrency),
  )
  const method = (process.env.METHOD || 'bank').trim().toLowerCase()
  const amount = Number(process.env.AMOUNT || '100')
  const refresh = toBool(process.env.REFRESH, false)
  const maxCorridors = Math.max(1, Math.min(1000, Number(process.env.MAX_CORRIDORS || '200')))
  const providerFilter = new Set(parseList(process.env.PROVIDERS).map((p) => p.trim().toLowerCase()))

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid AMOUNT: ${process.env.AMOUNT || '(missing)'}`)
  }

  const allCorridors = Array.from(
    new Set(Object.values(HEALTH_CORRIDORS).flatMap((list) => Array.from(list))),
  )
  const corridors = allCorridors
    .filter((c) => {
      const send = parseCorridorSendCurrency(c)
      return Boolean(send && sendCurrencies.has(send))
    })
    .slice(0, maxCorridors)

  const noQuotesByProvider = new Map<string, number>()
  const noQuotesPairs: Array<Record<string, unknown>> = []
  const failures: Array<Record<string, unknown>> = []

  if (process.env.VERBOSE === '1') {
     
    console.error(JSON.stringify({
      event: 'no_quotes_audit_start',
      base_url: base.toString(),
      corridors: corridors.length,
      send_currencies: Array.from(sendCurrencies.values()),
      method,
      amount,
      refresh,
      providers_filter: providerFilter.size ? Array.from(providerFilter.values()) : null,
    }))
  }

  for (const corridorId of corridors) {
    const url = buildProvidersUrl(base, { corridorId, amount, method, refresh })
    const { status, body } = await fetchJson(url, 20000)

    if (status !== 200) {
      failures.push({
        corridor_id: corridorId,
        status,
        error: body?.error || body?.message || 'request_failed',
      })
      continue
    }

    const excluded = (body?.excludedProviders || []) as ExcludedProvider[]
    const excludedDetailed = (body?.excludedProvidersDetailed || []) as ExcludedProviderDetailed[]

    for (const entry of excluded) {
      const provider = (entry?.provider || '').toString().trim().toLowerCase()
      const reason = (entry?.reason || '').toString().trim().toLowerCase()
      if (!provider || !reason) continue

      if (providerFilter.size && !providerFilter.has(provider)) continue

      if (reason === 'no_quotes') {
        noQuotesByProvider.set(provider, (noQuotesByProvider.get(provider) ?? 0) + 1)
        const details = excludedDetailed.find((d) => (d?.provider || '').toString().trim().toLowerCase() === provider)
        noQuotesPairs.push({
          corridor_id: corridorId,
          provider,
          reason,
          details: details?.details ?? null,
        })
      }
    }
  }

  const topNoQuotesProviders = Array.from(noQuotesByProvider.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([provider, count]) => ({ provider, count }))

  const payload = {
    success: true,
    base_url: base.toString(),
    send_currencies: Array.from(sendCurrencies.values()),
    method,
    amount,
    refresh,
    corridors_scanned: corridors.length,
    failures: failures.length,
    no_quotes_providers: topNoQuotesProviders,
    no_quotes_pairs: noQuotesPairs.slice(0, 100),
    failure_samples: failures.slice(0, 20),
  }

  const pretty = process.env.PRETTY === '1'
   
  console.log(pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload))
}

if (require.main === module) {
  runNoQuotesAudit().catch((error) => {
     
    console.error(JSON.stringify({
      event: 'no_quotes_audit_failed',
      error: error instanceof Error ? error.message : String(error),
    }))
    process.exit(1)
  })
}
