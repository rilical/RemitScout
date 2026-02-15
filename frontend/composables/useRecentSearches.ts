import type { RecentSearch } from '~/types/remit'
import { useApi } from '~/composables/useApi'

export const useRecentSearches = (limit = 20, options: Record<string, unknown> = {}) => {
  const { request } = useApi()
  const key = typeof options.key === 'string' ? options.key : `recent-searches-${limit}`
  const { key: _ignoredKey, ...asyncOptions } = options

  const data = useAsyncData(
    key,
    async () => {
      try {
        return await request<{ data: RecentSearch[], updatedAt: string }>('/recent-searches', { query: { limit } })
      }
      catch (error: unknown) {
        const statusCode = error && typeof error === 'object'
          ? (error as Record<string, unknown>).statusCode
          : undefined
        // Don't crash the page if API fails - return empty data instead
        if (statusCode === 401 || statusCode === 403 || statusCode === 500) {
          return { data: [], updatedAt: new Date().toISOString() }
        }
        throw error
      }
    },
    { watch: [], ...(asyncOptions as any) },
  )

  const recordSearch = async (payload: Partial<RecentSearch>) => {
    return await request('/recent-searches', {
      method: 'POST',
      body: payload,
    })
  }

  return {
    ...data,
    recordSearch,
  }
}
