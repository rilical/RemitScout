import type { Method, ProviderQuote } from '~/types/remit'

type ApiFetchOptions = {
  query?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  timeoutMs?: number
  validate?: (data: unknown) => unknown
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
  if (/^https?:\/\//.test(path)) return path
  const cleanedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanedPath = path.startsWith('/') ? path : `/${path}`
  // Avoid double /api/api
  if (cleanedPath === cleanedBase || cleanedPath.startsWith(cleanedBase + '/')) return cleanedPath
  return `${cleanedBase}${cleanedPath}`
}

export const useApi = () => {
  const config = useRuntimeConfig()

  const base = import.meta.server
    ? (config.apiBase || config.public.apiBase || '/api')
    : (config.public.apiBase || '/api')

  const makeRequestId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }

  async function request<T>(path: string, options: ApiFetchOptions = {}) {
    const url = joinBase(base, path)
    const requestId = options.headers?.['x-request-id'] || makeRequestId()
    const serverHeaders = import.meta.server
      ? useRequestHeaders(['cookie', 'authorization', 'x-forwarded-for', 'user-agent'])
      : {}

    try {
      const data = await $fetch(url as any, {
        method: options.method,
        query: options.query as any,
        body: options.body as any,
        headers: {
          accept: 'application/json',
          'x-request-id': requestId,
          ...serverHeaders,
          ...options.headers,
        },
        timeout: options.timeoutMs ?? 10000,
      }) as unknown

      if (options.validate) {
        return options.validate(data) as T
      }

      return data as T
    } catch (error: any) {
      const statusCode = error?.statusCode || error?.response?.status
      const message = error?.data?.message || error?.statusMessage || error?.message || 'Request failed'
      const wrapped = new Error(message) as Error & { statusCode?: number, requestId?: string, data?: unknown }
      wrapped.statusCode = statusCode
      wrapped.requestId = requestId
      wrapped.data = error?.data

      if (import.meta.dev) {
        console.warn(`[api] ${url} failed`, { statusCode, requestId, error: error?.data || error })
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
