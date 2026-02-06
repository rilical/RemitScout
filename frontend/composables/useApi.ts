import type { Method, ProviderQuote } from '~/types/remit'

type ApiFetchOptions = {
  query?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: BodyInit | Record<string, any> | null
  headers?: Record<string, string>
  timeoutMs?: number
  validate?: (data: unknown) => unknown
  signal?: AbortSignal
  retries?: number
}

type ProviderQuotesParams = {
  from: string
  to: string
  amount: number
  method: Method
}

type ProviderQuotesResponse = {
  data: ProviderQuote[]
  updatedAt: string
  corridor: string
  amount: number
  method: string
}

function joinBase(base: string, path: string) {
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

export const useApi = () => {
  const config = useRuntimeConfig()
  const { accessToken } = useAuth()

  const base = import.meta.server
    ? (config.apiBase || config.public.apiBase || '/api')
    : (config.public.apiBase || '/api')

  const makeRequestId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }

  const getCloudFrontRequestId = (): string | undefined => {
    if (import.meta.server) {
      const headers = useRequestHeaders()
      return headers['cloudfront-request-id'] as string | undefined
    }
    return undefined
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
      catch (error: any) {
        lastError = error
        const statusCode = error?.statusCode || error?.response?.status
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

  async function request<T = any>(path: string, options: ApiFetchOptions = {}) {
    const url = joinBase(base, path)
    const requestId = options.headers?.['x-request-id'] || makeRequestId()
    const cloudfrontRequestId = getCloudFrontRequestId()
    const serverHeaders = import.meta.server
      ? useRequestHeaders([
          'cookie',
          'authorization',
          'x-forwarded-for',
          'user-agent',
          'cloudfront-request-id',
        ])
      : {}

    const maxRetries = options.retries ?? 3
    const timeoutMs = options.timeoutMs ?? 10000

    const makeRequest = async () => {
      const headers: Record<string, string> = {
        'accept': 'application/json',
        'x-request-id': requestId,
        ...serverHeaders,
        ...options.headers,
      }

      const hasAuthHeader
        = 'authorization' in headers || 'Authorization' in headers

      if (!import.meta.server && accessToken.value && !hasAuthHeader) {
        headers.authorization = `Bearer ${accessToken.value}`
      }

      if (cloudfrontRequestId) {
        headers['x-cloudfront-request-id'] = cloudfrontRequestId
      }

      const data = await $fetch(url as string, {
        method: options.method || 'GET',
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
      const data = await retryWithBackoff(
        makeRequest,
        maxRetries,
        100,
      )

      return data
    }
    catch (error: unknown) {
      const apiError = error as {
        statusCode?: number
        response?: { status?: number }
        data?: { message?: string }
        statusMessage?: string
        message?: string
      }

      const statusCode
        = apiError?.statusCode || apiError?.response?.status
      const message
        = apiError?.data?.message
          || apiError?.statusMessage
          || apiError?.message
          || 'Request failed'
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

      if (import.meta.dev) {
        console.warn(`[api] ${url} failed`, {
          statusCode,
          requestId,
          cloudfrontRequestId,
          error: apiError?.data || error,
        })
      }

      throw wrapped
    }
  }

  // Convenience wrappers (adapt paths to your pipeline as needed)
  const getProviderQuotes = (params: ProviderQuotesParams) => {
    return request<ProviderQuotesResponse>(
      '/providers',
      { query: params },
    )
  }

  return {
    request,
    getProviderQuotes,
  }
}
