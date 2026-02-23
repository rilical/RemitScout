import { randomUUID } from 'node:crypto'
import { createError, getHeaders, getMethod, getQuery, getRequestHeader, readBody, setResponseHeader, setResponseStatus } from 'h3'
import { $fetch } from 'ofetch'

const FORWARDED_HEADERS = [
  'authorization',
  'cookie',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-request-id',
  'accept-language',
  'cloudfront-viewer-country',
  'cloudfront-request-id',
  'cloudfront-viewer-address',
]

const getBackendBase = () => {
  const envBase = process.env.API_BASE || process.env.NUXT_API_BASE
  // Prefer env wiring for server proxying. Only fall back to runtime config if env is unset.
  const config = envBase ? undefined : useRuntimeConfig()
  const base = envBase || config?.apiBase || config?.public.apiBase

  if (!base) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API_BASE is not configured for backend proxying.',
    })
  }

  // If base is a relative path, it's for client-side use only
  // Server-side proxy needs an absolute URL
  if (base.startsWith('/')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API_BASE must be an absolute URL (e.g., http://localhost:3000) for server-side proxying.',
    })
  }

  // Parse the base URL
  const baseUrl = new URL(base)

  // Ensure base URL path ends with /api/v1 for versioned endpoints
  let pathname = baseUrl.pathname.replace(/\/$/, '') // Remove trailing slash

  // If pathname doesn't end with /api/v1, append it
  if (!pathname.endsWith('/api/v1')) {
    // Remove /api if present to avoid /api/api/v1
    if (pathname.endsWith('/api')) {
      pathname = pathname.slice(0, -4) // Remove '/api'
    }
    pathname = pathname + '/api/v1'
  }

  baseUrl.pathname = pathname

  return baseUrl.toString().replace(/\/$/, '')
}

const buildForwardHeaders = (
  headers: Record<string, string | string[] | undefined>,
) => {
  const forwarded: Record<string, string> = {}

  FORWARDED_HEADERS.forEach((key) => {
    const value = headers[key]
    if (!value) return
    forwarded[key] = Array.isArray(value) ? value.join(',') : value
  })

  const cloudfrontRequestId = headers['cloudfront-request-id']
  if (cloudfrontRequestId) {
    forwarded['x-cloudfront-request-id'] = Array.isArray(cloudfrontRequestId)
      ? cloudfrontRequestId[0]
      : cloudfrontRequestId
  }

  return forwarded
}

const DEFAULT_TIMEOUT_MS = 8000
const NON_BLOCKING_PATHS = new Set([
  '/sessions/track',
  '/telemetry/session',
  '/telemetry/search',
  '/telemetry/click',
])
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EAI_AGAIN',
  'ENOTFOUND',
])

const isNonBlockingPath = (path: string) => NON_BLOCKING_PATHS.has(path)

const joinUrl = (base: string, path: string) => {
  const cleanBase = base.endsWith('/') ? base : `${base}/`
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${cleanBase}${cleanPath}`
}

const rewriteSetCookiePath = (cookie: string): string => {
  return cookie.replace(/(;\s*Path=)\/api\/v1(?=\/|;|$)/i, '$1/api')
}

const getSetCookieHeaders = (headers: Headers | undefined): string[] => {
  if (!headers) return []
  const headerBag = headers as Headers & { getSetCookie?: () => string[] }
  const fromMethod = typeof headerBag.getSetCookie === 'function'
    ? headerBag.getSetCookie()
    : []
  if (fromMethod.length > 0) return fromMethod

  const single = headers.get('set-cookie')
  return single ? [single] : []
}

const forwardSetCookieHeaders = (event: any, headers: Headers | undefined) => {
  const setCookies = getSetCookieHeaders(headers)
  if (!setCookies.length) return
  const rewritten = setCookies.map(rewriteSetCookiePath)
  setResponseHeader(event, 'set-cookie', rewritten)
}

const isE2eMockEnabled = () => process.env.E2E_MOCK_API === '1'
let hasLoggedCriticalE2eMockWarning = false

const isProdLikeEnvironment = () => {
  const raw = `${process.env.ENVIRONMENT || ''} ${process.env.NODE_ENV || ''}`.toLowerCase()
  return raw.includes('prod') || raw.includes('production') || raw.includes('staging')
}

type MockResult = { status: number, body: any }

const toQueryString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.length ? String(value[0]) : null
  return String(value)
}

const mockGeo = (): MockResult => ({
  status: 200,
  body: { countryCode: 'US' },
})

const mockBillingPricing = (): MockResult => ({
  status: 200,
  body: {
    success: true,
    configured: true,
    plus: {
      month: { amount: 999, currency: 'USD', priceId: 'price_mock_month' },
      year: { amount: 9999, currency: 'USD', priceId: 'price_mock_year' },
    },
  },
})

const mockCorridorCurrencies = (query: Record<string, unknown>): MockResult => {
  const from = (toQueryString(query.from) || 'US').toUpperCase()
  const to = (toQueryString(query.to) || 'MX').toUpperCase()
  return {
    status: 200,
    body: {
      from,
      to,
      fromCurrencies: [],
      toCurrencies: [],
      pairs: [],
    },
  }
}

const mockProvidersMetadata = (): MockResult => ({
  status: 200,
  body: { data: [] },
})

const mockProviderMetadataById = (idOrSlug: string): MockResult => ({
  status: 200,
  body: {
    data: {
      id: idOrSlug,
      name: idOrSlug,
      slug: idOrSlug,
    },
  },
})

const mockAdsPlacement = (): MockResult => ({
  status: 200,
  body: { ad: null },
})

const mockPulseTeaser = (): MockResult => {
  const updatedAt = new Date().toISOString()
  const timestampBucket = updatedAt
  return {
    status: 200,
    body: {
      success: true,
      updatedAt,
      windowHours: 24,
      movers: [
        {
          corridorId: 'US-MX-USD-MXN',
          fromCountry: 'US',
          toCountry: 'MX',
          sendCurrency: 'USD',
          recvCurrency: 'MXN',
          currentAvgRate: 18.0,
          prevAvgRate: 17.8,
          deltaPct: 0.012,
          providerCount: 6,
          timestampBucket,
        },
        {
          corridorId: 'US-PH-USD-PHP',
          fromCountry: 'US',
          toCountry: 'PH',
          sendCurrency: 'USD',
          recvCurrency: 'PHP',
          currentAvgRate: 56.0,
          prevAvgRate: 55.9,
          deltaPct: 0.002,
          providerCount: 7,
          timestampBucket,
        },
      ],
    },
  }
}

const mockPopularCorridors = (): MockResult => ({
  status: 200,
  body: {
    updatedAt: new Date().toISOString(),
    data: [
      { route: 'US->MX', count24h: 1200, topProvider: 'Wise' },
      { route: 'US->PH', count24h: 900, topProvider: 'Remitly' },
      { route: 'US->IN', count24h: 700, topProvider: 'Xoom' },
    ],
  },
})

const mockBankVsSpecialist = (query: Record<string, unknown>): MockResult => {
  const from = (toQueryString(query.from) || 'US').toUpperCase()
  const to = (toQueryString(query.to) || 'MX').toUpperCase()
  const amount = Number(toQueryString(query.amount) || 500)
  const updatedAt = new Date().toISOString()

  const fxRate = 18.0
  const midRate = 18.5
  const feeBank = 8.0
  const feeTop = 2.5

  return {
    status: 200,
    body: {
      data: {
        corridor: {
          from,
          to,
          sendCurrency: from === 'US' ? 'USD' : 'USD',
          recvCurrency: to === 'MX' ? 'MXN' : 'MXN',
        },
        midRate,
        bank: {
          name: 'Big Bank',
          fee: feeBank,
          marginPct: 3.2,
          fxRate: fxRate * 0.96,
          recipientGets: Math.max(0, (amount - feeBank) * fxRate * 0.96),
          delivery: '2-3 days',
          reliability: 0.92,
          methods: ['bank'],
          bestFor: 'Convenience',
        },
        top: {
          id: 'mock_top',
          name: 'Wise',
          fee: feeTop,
          marginPct: 0.8,
          fxRate,
          recipientGets: Math.max(0, (amount - feeTop) * fxRate),
          delivery: 'Same day',
          reliability: 0.98,
          methods: ['bank'],
          bestFor: 'Best overall',
        },
        updatedAt,
        savings: {
          amount,
          recipientGetsDifference: Math.max(0, (amount - feeTop) * fxRate - (amount - feeBank) * fxRate * 0.96),
          percentage: 1.5,
        },
      },
    },
  }
}

const mockProviders = (query: Record<string, unknown>): MockResult => {
  const from = (toQueryString(query.from) || 'US').toUpperCase()
  const to = (toQueryString(query.to) || 'PH').toUpperCase()
  const amount = Number(toQueryString(query.amount) || 500)
  const method = toQueryString(query.method) || 'bank'
  const updatedAt = new Date().toISOString()
  const midMarketRate = 56.0

  const makeQuote = (id: string, name: string, fee: number, fxRate: number, delivery: string) => ({
    id,
    name,
    fee,
    feeAmount: fee,
    marginPct: Math.max(0, ((midMarketRate - fxRate) / midMarketRate) * 100),
    fxRate,
    recipientGets: Math.max(0, (amount - fee) * fxRate),
    delivery,
    reliability: 0.97,
    methods: [method],
    bestFor: 'Mocked E2E data',
    isAffiliate: false,
    affiliateUrl: null,
    outboundUrl: null,
  })

  return {
    status: 200,
    body: {
      updatedAt,
      corridor: `${from}-${to}`,
      amount,
      method,
      midMarketRate,
      midMarketSource: 'Mid-market',
      midMarketUpdatedAt: updatedAt,
      data: [
        makeQuote('mock_wise', 'Wise', 2.5, midMarketRate * 0.995, 'Same day'),
        makeQuote('mock_remitly', 'Remitly', 1.99, midMarketRate * 0.99, '15-30 min'),
      ],
      availableMethods: ['bank', 'cash', 'wallet'],
      indices: {
        teer: midMarketRate * 0.992,
        rci: 0.028,
        rvi_bps: 45,
        providerCount: 2,
        amount,
        midMarketRate,
        weights: 'synthetic_volume_v1',
        updatedAt,
        source: 'gold',
        weightConfidence: 0.55,
        weightWindowDays: 30,
        suppressionFlag: false,
        suppressionReason: null,
      },
    },
  }
}

const mockRatesHistory = (query: Record<string, unknown>): MockResult => {
  const base = (toQueryString(query.base) || 'USD').toUpperCase()
  const quote = (toQueryString(query.quote) || 'MXN').toUpperCase()
  const days = Math.max(1, Math.min(90, Number(toQueryString(query.days) || 7)))
  const lastUpdated = new Date().toISOString()
  const today = new Date()

  const history = Array.from({ length: days }).map((_, idx) => {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - (days - 1 - idx))
    return {
      date: d.toISOString().slice(0, 10),
      rate: 1.0 + idx * 0.0005,
      source: 'Mid-market',
    }
  })

  return {
    status: 200,
    body: {
      base,
      quote,
      history,
      lastUpdated,
    },
  }
}

const mockMe = (): MockResult => ({
  status: 401,
  body: { error: 'unauthorized', code: 'missing_token', message: 'Unauthorized' },
})

const maybeMockApi = (path: string, method: string, query: Record<string, unknown>): MockResult | null => {
  // Non-blocking telemetry should never break tests.
  if (path.startsWith('/telemetry') || path.startsWith('/sessions')) {
    return { status: 204, body: null }
  }

  if (path === '/ads/placement') return mockAdsPlacement()
  if (path === '/geo') return mockGeo()
  if (path === '/popular-corridors') return mockPopularCorridors()
  if (path === '/bank-vs-specialist') return mockBankVsSpecialist(query)
  if (path === '/providers/metadata') return mockProvidersMetadata()
  if (path.startsWith('/providers/metadata/')) {
    const idOrSlug = decodeURIComponent(path.slice('/providers/metadata/'.length))
    return mockProviderMetadataById(idOrSlug || 'provider')
  }
  if (path === '/corridor-currencies') return mockCorridorCurrencies(query)
  if (path === '/providers') return mockProviders(query)
  if (path === '/rates/history') return mockRatesHistory(query)
  if (path === '/billing/pricing') return mockBillingPricing()
  if (path === '/me') return mockMe()
  if (path === '/pulse/teaser') return mockPulseTeaser()

  // Basic mocked write endpoints (logged out) so flows don't hang on network errors.
  if (method !== 'GET' && (path.startsWith('/watchlist') || path.startsWith('/alerts') || path.startsWith('/billing'))) {
    return { status: 401, body: { error: 'unauthorized' } }
  }

  return null
}

type ProxyOptions = {
  timeoutMs?: number
  maxRetries?: number
  nonBlocking?: boolean
}

type CircuitState = 'closed' | 'open' | 'half_open'

type BackendCircuit = {
  state: CircuitState
  consecutiveFailures: number
  openedUntilMs: number
  probeInFlight: boolean
}

const BACKEND_CIRCUITS = new Map<string, BackendCircuit>()
const CIRCUIT_OPEN_AFTER_FAILURES = 5
const CIRCUIT_OPEN_FOR_MS = 60_000

const getCircuitKey = (base: string) => {
  try {
    return new URL(base).origin
  }
 catch {
    return base
  }
}

const getCircuit = (key: string): BackendCircuit => {
  const existing = BACKEND_CIRCUITS.get(key)
  if (existing) return existing
  const circuit: BackendCircuit = {
    state: 'closed',
    consecutiveFailures: 0,
    openedUntilMs: 0,
    probeInFlight: false,
  }
  BACKEND_CIRCUITS.set(key, circuit)
  return circuit
}

const logCircuit = (payload: Record<string, unknown>) => {
  // Use structured logs for ops correlation.
  console.warn(JSON.stringify({ ...payload, scope: 'backend_proxy_circuit' }))
}

const openCircuit = (key: string, requestId: string, reason: string) => {
  const circuit = getCircuit(key)
  const now = Date.now()
  circuit.state = 'open'
  circuit.openedUntilMs = now + CIRCUIT_OPEN_FOR_MS
  circuit.probeInFlight = false
  logCircuit({
    requestId,
    key,
    action: 'open',
    reason,
    consecutiveFailures: circuit.consecutiveFailures,
    openForMs: CIRCUIT_OPEN_FOR_MS,
  })
}

const recordSuccess = (key: string, requestId: string) => {
  const circuit = getCircuit(key)
  if (circuit.state !== 'closed' || circuit.consecutiveFailures !== 0) {
    logCircuit({
      requestId,
      key,
      action: 'close',
      prevState: circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
    })
  }
  circuit.state = 'closed'
  circuit.consecutiveFailures = 0
  circuit.openedUntilMs = 0
  circuit.probeInFlight = false
}

const recordFailure = (key: string, requestId: string, reason: string) => {
  const circuit = getCircuit(key)
  circuit.probeInFlight = false

  if (circuit.state === 'half_open') {
    circuit.consecutiveFailures = CIRCUIT_OPEN_AFTER_FAILURES
    openCircuit(key, requestId, `half_open_failure:${reason}`)
    return
  }

  circuit.consecutiveFailures += 1
  if (circuit.consecutiveFailures >= CIRCUIT_OPEN_AFTER_FAILURES) {
    openCircuit(key, requestId, reason)
  }
}

const canAttemptRequest = (key: string, requestId: string): { ok: boolean, state: CircuitState, retryAfterMs?: number } => {
  const circuit = getCircuit(key)
  const now = Date.now()

  if (circuit.state === 'open') {
    if (now >= circuit.openedUntilMs) {
      circuit.state = 'half_open'
      circuit.probeInFlight = false
      logCircuit({
        requestId,
        key,
        action: 'half_open',
      })
    }
 else {
      return { ok: false, state: 'open', retryAfterMs: Math.max(0, circuit.openedUntilMs - now) }
    }
  }

  if (circuit.state === 'half_open') {
    if (circuit.probeInFlight) {
      return { ok: false, state: 'half_open', retryAfterMs: 1000 }
    }
    circuit.probeInFlight = true
    return { ok: true, state: 'half_open' }
  }

  return { ok: true, state: 'closed' }
}

export const __resetBackendProxyCircuitForTests = () => {
  BACKEND_CIRCUITS.clear()
}

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100,
): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    }
    catch (error: any) {
      lastError = error
      const statusCode = error?.statusCode || error?.response?.status
      const errorCode = error?.code || error?.cause?.code
      const shouldRetry = (statusCode && statusCode >= 500) || (errorCode && RETRYABLE_ERROR_CODES.has(errorCode))
      if (shouldRetry && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export const proxyToBackend = async (event: any, path: string, options: ProxyOptions = {}) => {
  const method = getMethod(event)
  const query = getQuery(event)
  const headers = buildForwardHeaders(getHeaders(event))

  const requestId = event.context?.requestId
    || getRequestHeader(event, 'x-request-id')
    || headers['x-request-id']
    || randomUUID()
  headers['x-request-id'] = requestId
  setResponseHeader(event, 'x-request-id', requestId)

  if (isE2eMockEnabled()) {
    if (isProdLikeEnvironment() && !hasLoggedCriticalE2eMockWarning) {
      hasLoggedCriticalE2eMockWarning = true
      console.error('[CRITICAL] E2E_MOCK_API is enabled in staging/production-like runtime — API responses are mocked', {
        nodeEnv: process.env.NODE_ENV || null,
        environment: process.env.ENVIRONMENT || null,
      })
    }
    const mocked = maybeMockApi(path, method, query as any)
    if (mocked) {
      setResponseStatus(event, mocked.status)
      return mocked.body
    }
    setResponseStatus(event, 404)
    return { error: 'not_found', message: 'Mock not implemented for this endpoint', requestId }
  }

  const base = getBackendBase()
  const nonBlocking = options.nonBlocking ?? isNonBlockingPath(path)

  const circuitKey = getCircuitKey(base)
  if (!nonBlocking) {
    const allowed = canAttemptRequest(circuitKey, requestId)
    if (!allowed.ok) {
      logCircuit({
        requestId,
        key: circuitKey,
        action: 'short_circuit',
        state: allowed.state,
        retryAfterMs: allowed.retryAfterMs ?? null,
      })
      setResponseStatus(event, 503)
      return {
        error: 'service_unavailable',
        message: 'Service temporarily unavailable',
        requestId,
      }
    }
  }

  // Body size guardrail (1MB). Prefer header-based rejection when available.
  const contentLengthRaw = getRequestHeader(event, 'content-length')
  const contentLength = contentLengthRaw ? Number(contentLengthRaw) : Number.NaN
  const hasBody = method !== 'GET' && method !== 'HEAD'
  if (hasBody && Number.isFinite(contentLength) && contentLength > 1_000_000) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' })
  }

  const body = !hasBody ? undefined : await readBody(event)
  if (body && typeof body === 'string' && body.length > 1_000_000) {
    throw createError({ statusCode: 413, statusMessage: 'Payload too large' })
  }
  const fetcher: any = $fetch as any

  const envTimeoutMs = Number(process.env.BACKEND_PROXY_TIMEOUT_MS)
  const resolvedEnvTimeoutMs = Number.isFinite(envTimeoutMs) && envTimeoutMs > 0 ? envTimeoutMs : undefined

  const timeoutMs = options.timeoutMs
    ?? (nonBlocking ? 2500 : undefined)
    ?? resolvedEnvTimeoutMs
    ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options.maxRetries
    ?? (nonBlocking ? 0 : (method === 'GET' || method === 'HEAD' ? 1 : 0))

  const start = Date.now()
  try {
    const result = await retryWithBackoff(async () => {
      try {
        const res = await fetcher.raw(joinUrl(base, path), {
          method,
          query,
          body,
          headers,
          timeout: timeoutMs,
          ignoreResponseError: true,
        })
        const duration = Date.now() - start
        setResponseHeader(event, 'Server-Timing', `backend;dur=${duration}`)

        const statusCode: number = res?.status ?? 0
        forwardSetCookieHeaders(event, res?.headers)

        // For GET/HEAD, forward backend caching validators to the client.
        // This allows the backend (Plane A) to be the single source of truth for cache policy.
        if ((method === 'GET' || method === 'HEAD') && statusCode > 0 && statusCode < 400) {
          const cacheControl = res.headers?.get?.('cache-control')
          const etag = res.headers?.get?.('etag')
          const lastModified = res.headers?.get?.('last-modified')
          if (cacheControl) setResponseHeader(event, 'cache-control', cacheControl)
          if (etag) setResponseHeader(event, 'etag', etag)
          if (lastModified) setResponseHeader(event, 'last-modified', lastModified)
        }

        if (nonBlocking && statusCode >= 400) {
          setResponseStatus(event, 204)
          return { ok: false, status: statusCode }
        }

        // Propagate non-5xx responses from the backend instead of turning them into 500s.
        if (statusCode >= 400 && statusCode < 500) {
          setResponseStatus(event, statusCode)
          return res?._data ?? { error: 'backend_error', message: res?.statusText || 'Request failed' }
        }

        // Trigger retry/backoff for backend/server errors.
        if (statusCode >= 500) {
          const err: any = new Error('Backend error')
          err.statusCode = statusCode
          err.data = res?._data
          throw err
        }

        return res?._data
      }
      catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status
        const errorCode = error?.code || error?.cause?.code
        if (nonBlocking) {
          setResponseStatus(event, 204)
          return { ok: false, status: statusCode ?? 0 }
        }
        // Propagate non-5xx responses from the backend instead of turning them into 500s.
        if (statusCode && statusCode < 500) {
          setResponseStatus(event, statusCode)
          return error?.data ?? { error: 'backend_error', message: error?.message || 'Request failed' }
        }
        // Retryable backend/server errors bubble up to the retry wrapper. We'll map them to 503 if retries exhaust.
        if (statusCode && statusCode >= 500) throw error
        if (errorCode && RETRYABLE_ERROR_CODES.has(errorCode)) throw error
        if (!statusCode && typeof error?.message === 'string' && error.message.includes('fetch failed')) throw error
        throw error
      }
    }, maxRetries)

    if (!nonBlocking) {
      recordSuccess(circuitKey, requestId)
    }

    return result
  }
  catch (error: any) {
    const statusCode = error?.statusCode || error?.response?.status
    const errorCode = error?.code || error?.cause?.code
    const message = error?.data?.message || error?.message || 'Request failed'

    const duration = Date.now() - start
    setResponseHeader(event, 'Server-Timing', `backend;dur=${duration}`)

    // Don't swallow client errors raised inside the proxy (e.g., 413).
    if (statusCode && statusCode < 500) throw error

    if (!nonBlocking) {
      const reason = errorCode
        ? `error_code:${String(errorCode)}`
        : statusCode
          ? `status:${Number(statusCode)}`
          : typeof message === 'string' && message.includes('fetch failed')
            ? 'fetch_failed'
            : 'unknown'
      recordFailure(circuitKey, requestId, reason)
    }

    if (statusCode && statusCode >= 500) {
      // Log full backend error details server-side (sanitized client response).
      console.error(JSON.stringify({ requestId, target: path, statusCode, backendError: error?.data }))

      setResponseStatus(event, 503)
      return {
        error: 'service_unavailable',
        message: 'Service temporarily unavailable',
        requestId,
      }
    }

    // Never crash the Nuxt server due to backend outages; return a stable 503 shape.
    setResponseStatus(event, 503)
    return {
      error: 'backend_unreachable',
      message: errorCode
        ? `Backend unreachable (${errorCode}).`
        : statusCode
          ? `Backend error (${statusCode}).`
          : 'Backend unreachable.',
      requestId,
    }
  }
}
