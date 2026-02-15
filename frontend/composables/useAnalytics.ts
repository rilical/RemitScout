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

type PopularCorridorsResponse = { corridors: any[] }
type FavoriteProvidersResponse = { providers: any[] }
type HeatmapResponse = { heatmap: any[] }
type SavingsSummary = {
  total_searches: number
  total_savings_fees: number
  total_savings_delta: number
  avg_savings_per_search: number
  best_provider_savings: number
  worst_provider_cost: number
}
type SavingsMetricsResponse = { summary: SavingsSummary }
type UserBehaviorPatternsResponse = { patterns: any[] }
type ProviderImpactResponse = {
  providers: any[]
  corridors: any[]
}
type SessionMetricsResponse = {
  total_sessions: number
  unique_users: number
  avg_session_duration: number
  avg_searches_per_session: number
  bounce_rate: number
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
    }
    catch (err: any) {
      error.value = err?.message || 'Failed to load analytics.'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getPopularCorridors = (params: AnalyticsDateRange & { limit?: number }) =>
    withLoading(() => request<PopularCorridorsResponse>('/analytics/corridors', { method: 'GET', query: params }))

  const getCorridorTrends = (params: CorridorTrendParams) =>
    withLoading(() => request('/analytics/corridors/trends', { method: 'GET', query: params }))

  const getFavoriteProviders = (params: AnalyticsDateRange & { limit?: number }) =>
    withLoading(() => request<FavoriteProvidersResponse>('/analytics/providers', { method: 'GET', query: params }))

  const getProviderCTR = (params: ProviderCtrParams) =>
    withLoading(() => request('/analytics/providers/ctr', { method: 'GET', query: params }))

  const getProviderImpact = (params: ProviderImpactParams) =>
    withLoading(() => request<ProviderImpactResponse>('/analytics/providers/impact', { method: 'GET', query: params }))

  const getEngagementMetrics = (params: EngagementParams) =>
    withLoading(() => request('/analytics/engagement', { method: 'GET', query: params }))

  const getSessionMetrics = (params: AnalyticsDateRange) =>
    withLoading(() => request<SessionMetricsResponse>('/analytics/engagement/sessions', { method: 'GET', query: params }))

  const getHeatmapData = (params: HeatmapParams) =>
    withLoading(() => request<HeatmapResponse>('/analytics/heatmap', { method: 'GET', query: params }))

  const getSavingsMetrics = (params: SavingsParams) =>
    withLoading(() => request<SavingsMetricsResponse>('/analytics/savings', { method: 'GET', query: params }))

  const getUserBehaviorPatterns = (params: UserBehaviorParams) =>
    withLoading(() => request<UserBehaviorPatternsResponse>('/analytics/users', { method: 'GET', query: params }))

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
