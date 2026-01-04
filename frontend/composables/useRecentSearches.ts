import type { RecentSearch } from '~/types/remit'
import { useApi } from '~/composables/useApi'

export const useRecentSearches = (limit = 20, options: Record<string, any> = {}) => {
  const { request } = useApi()
  const key = options.key || `recent-searches-${limit}`

  const data = useAsyncData(
    key,
    () => request<{ data: RecentSearch[]; updatedAt: string }>('/recent-searches', { query: { limit } }),
    { watch: false, ...options },
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
