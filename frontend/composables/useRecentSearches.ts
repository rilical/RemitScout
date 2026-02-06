import type { RecentSearch } from '~/types/remit'
import { useApi } from '~/composables/useApi'

export const useRecentSearches = (limit = 20, options: Record<string, any> = {}) => {
  const { request } = useApi()
  const key = options.key || `recent-searches-${limit}`

  const data = useAsyncData(
    key,
    async () => {
      try {
        return await request<{ data: RecentSearch[], updatedAt: string }>('/recent-searches', { query: { limit } })
      }
      catch (error: any) {
        // Don't crash the page if API fails - return empty data instead
        if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 500) {
          return { data: [], updatedAt: new Date().toISOString() }
        }
        throw error
      }
    },
    { watch: [], ...options },
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
