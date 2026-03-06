import type { FetchOptions } from 'ofetch'
import type { paths } from '~/shared/lib/api/types'
import type { Method, ProviderQuote } from '~/types/remit'

const isAbortError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  return (error as Record<string, unknown>).name === 'AbortError'
}

type ApiFetchOptions = {
  query?: Record<string, unknown>
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: BodyInit | Record<string, unknown> | null
  headers?: Record<string, string>
  timeoutMs?: number
  validate?: (data: unknown) => unknown
  signal?: AbortSignal
  retries?: number
}

type ProvidersQuery = NonNullable<paths['/providers']['get']['parameters']['query']>
type ProviderQuotesParams = Pick<ProvidersQuery, 'from' | 'to' | 'amount' | 'method'> & {
  from: string
  to: string
  amount: number
  method: Method
}

type ProvidersResponse200 = paths['/providers']['get']['responses']['200']['content']['application/json']
type ProviderQuotesResponse = Omit<ProvidersResponse200, 'data'> & {
  data: ProviderQuote[]
}

export function joinBase(base: string, path: string) {
  // If path is already a full URL, return as-is
  if (/^https?:\/\//.test(path)) return path

  const cleanedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanedPath = path.startsWith('/') ? path : `/${path}`

  // If path already includes the base, return path as-is
  // This handles cases where path might be '/api/v1/me' and base is '/api/v1'
  if (cleanedPath === cleanedBase || cleanedPath.startsWith(cleanedBase + '/')) {
    return cleanedPath
  }

  // Join base and path
  return `${cleanedBase}${cleanedPath}`
}

type ApiClientDeps = {
  base: string
  fetcher: (input: string, init?: FetchOptions) => Promise<unknown>
  getAccessToken?: () => string | null
  getAdminAccessToken?: () => string | null
  makeRequestId?: () => string
  getServerHeaders?: () => Record<string, string>
  getCloudFrontRequestId?: () => string | undefined
  logger?: { warn: (message: string, meta: Record<string, unknown>) => void }
  onUnauthorized?: () => Promise<boolean>
}

export const createApiClient = (deps: ApiClientDeps) => {
  const isAdminSurfacePath = (path: string): boolean => {
    const normalized = (() => {
      if (/^https?:\/\//.test(path)) {
        try {
          return new URL(path).pathname
        }
        catch {
          return path
        }
      }
      return path.startsWith('/') ? path : `/${path}`
    })()

    return (
      normalized.startsWith('/admin')
      || normalized.startsWith('/ops')
      || normalized.startsWith('/analytics')
      || normalized.startsWith('/audit')
      || normalized.startsWith('/indices/corrections')
      || normalized === '/telemetry/analytics'
    )
  }

  const makeRequestId = deps.makeRequestId || (() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  })

  const getDefaultTimeoutMs = (path: string): number => {
    if (path === '/providers') return 6000
    if (path === '/rates/history') return 4000
    if (path === '/bank-vs-specialist') return 5000
    return 8000
  }

  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number,
    baseDelayMs: number = 100,
  ): Promise<T> => {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      }
      catch (error: unknown) {
        if (isAbortError(error)) {
          throw error
        }
        lastError = error
        const err = error as { statusCode?: number, response?: { status?: number } }
        const statusCode = err?.statusCode || err?.response?.status
        if (statusCode && statusCode >= 500 && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    throw lastError
  }

  async function request<T = unknown>(path: string, options: ApiFetchOptions = {}) {
    const url = joinBase(deps.base, path)
    const requestId = options.headers?.['x-request-id'] || makeRequestId()
    const cloudfrontRequestId = deps.getCloudFrontRequestId?.()
    const serverHeaders = deps.getServerHeaders?.() || {}

    const method = options.method || 'GET'
    const maxRetries = options.retries ?? 0
    const timeoutMs = options.timeoutMs ?? getDefaultTimeoutMs(path)
    let hasRetriedAuth = false

    const makeRequest = async () => {
      const headers: Record<string, string> = {
        'accept': 'application/json',
        'x-request-id': requestId,
        ...serverHeaders,
        ...options.headers,
      }

      const hasAuthHeader = 'authorization' in headers || 'Authorization' in headers
      const accessToken = deps.getAccessToken?.()
      const adminAccessToken = deps.getAdminAccessToken?.()

      // Privileged admin surfaces should use the short-lived Plane A admin token
      // when it exists so revoked admin sessions fail deterministically.
      if (adminAccessToken && !hasAuthHeader && isAdminSurfacePath(path)) {
        headers.authorization = `Bearer ${adminAccessToken}`
      }
      else if (accessToken && !hasAuthHeader) {
        headers.authorization = `Bearer ${accessToken}`
      }

      if (cloudfrontRequestId) {
        headers['x-cloudfront-request-id'] = cloudfrontRequestId
      }

      const data = await deps.fetcher(url as string, {
        method,
        query: options.query as Record<string, string>,
        body: options.body ?? undefined,
        headers,
        timeout: timeoutMs,
        signal: options.signal,
      }) as unknown

      if (options.validate) {
        return options.validate(data) as T
      }

      return data as T
    }

    try {
      return await retryWithBackoff(makeRequest, maxRetries, 100)
    }
    catch (error: unknown) {
      if (isAbortError(error)) {
        throw error
      }
      const apiError = error as {
        statusCode?: number
        response?: { status?: number }
        data?: { message?: string }
        statusMessage?: string
        message?: string
      }

      const statusCode = apiError?.statusCode || apiError?.response?.status

      // On 401, try refreshing the session once and retry
      if (statusCode === 401 && deps.onUnauthorized && !hasRetriedAuth) {
        hasRetriedAuth = true
        try {
          const refreshed = await deps.onUnauthorized()
          if (refreshed) {
            return await makeRequest()
          }
        }
        catch {
          // Refresh failed; fall through to original error
        }
      }

      const message = apiError?.data?.message || apiError?.statusMessage || apiError?.message || 'Request failed'
      const wrapped = new Error(message) as Error & {
        statusCode?: number
        requestId?: string
        data?: unknown
        cloudfrontRequestId?: string
      }
      wrapped.statusCode = statusCode
      wrapped.requestId = requestId
      wrapped.data = apiError?.data
      if (cloudfrontRequestId) {
        wrapped.cloudfrontRequestId = cloudfrontRequestId
      }

      deps.logger?.warn(`${url} failed`, {
        statusCode: statusCode ?? 0,
        requestId,
        cloudfrontRequestId: cloudfrontRequestId ?? '',
        error: (apiError?.data as unknown as Record<string, unknown>) || { message: message },
      })

      throw wrapped
    }
  }

  const getProviderQuotes = (params: ProviderQuotesParams) => {
    return request<ProviderQuotesResponse>('/providers', { query: params })
  }

  return { request, getProviderQuotes }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  // Avoid calling `useAuth()` here to prevent composable recursion (useAuth uses this API client for some calls).
  const session = useState<{ access_token?: string } | null>('auth:session', () => null)
  const adminSession = useState<{ accessToken?: string | null, expiresAt?: number | null }>('auth:admin-session', () => ({
    accessToken: null,
    expiresAt: null,
  }))

  const base = import.meta.server
    ? (config.apiBase || config.public.apiBase || '/api')
    : (config.public.apiBase || '/api')

  const getCloudFrontRequestId = (): string | undefined => {
    if (import.meta.server) {
      const headers = useRequestHeaders()
      return headers['cloudfront-request-id'] as string | undefined
    }
    return undefined
  }

  const getServerHeaders = () => import.meta.server
    ? useRequestHeaders([
        'cookie',
        'authorization',
        'x-forwarded-for',
        'user-agent',
        'cloudfront-request-id',
      ])
    : {}

  return createApiClient({
    base,
    fetcher: $fetch as unknown as ApiClientDeps['fetcher'],
    getAccessToken: () => session.value?.access_token ?? null,
    getAdminAccessToken: () => {
      const token = adminSession.value?.accessToken ?? null
      const expiresAt = Number(adminSession.value?.expiresAt ?? 0)
      if (!token) return null
      if (!Number.isFinite(expiresAt) || expiresAt <= 0) return null
      const now = Math.floor(Date.now() / 1000)
      if (expiresAt <= now + 60) return null
      return token
    },
    getServerHeaders,
    getCloudFrontRequestId,
    onUnauthorized: import.meta.client
      ? async () => {
          try {
            const supabase = useSupabaseClient()
            if (!supabase) return false
            const { data, error } = await supabase.auth.refreshSession()
            if (error || !data.session) return false
            session.value = data.session
            return true
          }
          catch {
            return false
          }
        }
      : undefined,
    logger: {
      warn: (message, meta) => useLogger('api').warn(message, meta),
    },
  })
}
