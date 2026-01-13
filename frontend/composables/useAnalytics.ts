type AnalyticsDateRange = {
  start_date: string
  end_date: string
}

type CorridorTrendParams = AnalyticsDateRange & {
  corridor_id?: string
  bucket?: 'hour' | 'day' | 'week'
}

type ProviderCtrParams = AnalyticsDateRange & {
  provider_id?: string
  bucket?: 'hour' | 'day' | 'week'
}

type ProviderImpactParams = AnalyticsDateRange & {
  provider_id?: string
  corridor_id?: string
  limit?: number
  corridor_limit?: number
}

type EngagementParams = AnalyticsDateRange & {
  bucket?: 'hour' | 'day' | 'week'
}

type HeatmapParams = AnalyticsDateRange & {
  aggregation?: 'country' | 'city'
  metric?: 'search_count' | 'click_count' | 'unique_users'
}

type SavingsParams = AnalyticsDateRange & {
  corridor_id?: string
}

type UserBehaviorParams = AnalyticsDateRange & {
  pattern_type?: 'search_frequency' | 'corridor_preferences' | 'amount_distribution'
}

type RevenueParams = AnalyticsDateRange & {
  provider_id?: string
  corridor_id?: string
  limit?: number
}

export const useAnalytics = () => {
  const { request } = useApi()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const withLoading = async <T>(fn: () => Promise<T>) => {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err: any) {
      error.value = err?.message || 'Failed to load analytics.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPopularCorridors = (params: AnalyticsDateRange & { limit?: number }) =>
    withLoading(() => request('/analytics/corridors', { method: 'GET', query: params }))

  const getCorridorTrends = (params: CorridorTrendParams) =>
    withLoading(() => request('/analytics/corridors/trends', { method: 'GET', query: params }))

  const getFavoriteProviders = (params: AnalyticsDateRange & { limit?: number }) =>
    withLoading(() => request('/analytics/providers', { method: 'GET', query: params }))

  const getProviderCTR = (params: ProviderCtrParams) =>
    withLoading(() => request('/analytics/providers/ctr', { method: 'GET', query: params }))

  const getProviderImpact = (params: ProviderImpactParams) =>
    withLoading(() => request('/analytics/providers/impact', { method: 'GET', query: params }))

  const getEngagementMetrics = (params: EngagementParams) =>
    withLoading(() => request('/analytics/engagement', { method: 'GET', query: params }))

  const getSessionMetrics = (params: AnalyticsDateRange) =>
    withLoading(() => request('/analytics/engagement/sessions', { method: 'GET', query: params }))

  const getHeatmapData = (params: HeatmapParams) =>
    withLoading(() => request('/analytics/heatmap', { method: 'GET', query: params }))

  const getSavingsMetrics = (params: SavingsParams) =>
    withLoading(() => request('/analytics/savings', { method: 'GET', query: params }))

  const getUserBehaviorPatterns = (params: UserBehaviorParams) =>
    withLoading(() => request('/analytics/users', { method: 'GET', query: params }))

  const getRevenueMetrics = (params: RevenueParams) =>
    withLoading(() => request('/analytics/revenue', { method: 'GET', query: params }))

  return {
    loading,
    error,
    getPopularCorridors,
    getCorridorTrends,
    getFavoriteProviders,
    getProviderCTR,
    getProviderImpact,
    getEngagementMetrics,
    getSessionMetrics,
    getHeatmapData,
    getSavingsMetrics,
    getUserBehaviorPatterns,
    getRevenueMetrics,
  }
}
