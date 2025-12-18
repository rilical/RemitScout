import type { Method, ProviderQuote } from '~/types/remit'

type ApiFetchOptions = {
  query?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
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
  const base = config.public.apiBase || '/api'

  async function request<T>(path: string, options: ApiFetchOptions = {}) {
    const url = joinBase(base, path)
    const data = await $fetch(url as any, {
      method: options.method,
      query: options.query as any,
      body: options.body as any,
      headers: options.headers,
    }) as unknown
    return data as T
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
