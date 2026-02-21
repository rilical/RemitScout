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
  aggregation?: 'country'
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

type SuppressionReason =
  | 'below_k_threshold'
  | 'insufficient_datapoints'
  | 'insufficient_provider_quotes'
  | 'outlier'
  | 'low_volume_grouped'

type PrivacyEnvelope = {
  applied: true
  minUniqueUsers: number
  reason?: string
}

type AggregationWindow = {
  startDate: string
  endDate: string
  minDatapoints24h: number
  minProviderQuotesPerCorridor: number
  minTrendLookbackDays: number
}

type PrivacyAnnotated = {
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
  suppressed?: boolean
  suppressionReason?: SuppressionReason
  sampleSize?: number
  thresholdApplied?: number
  aggregationBasis?: string
}

type PopularCorridor = PrivacyAnnotated & {
  corridor_id: string
  from_country: string
  to_country: string
  search_count: number
  click_count: number
  unique_users: number
  trend: 'up' | 'down' | 'stable'
  trend_percentage: number
}

type FavoriteProvider = PrivacyAnnotated & {
  provider_id: string
  provider_name?: string | null
  click_count?: number
  click_through_rate: number
  quote_count?: number
}

type HeatmapRow = PrivacyAnnotated & {
  country_code: string
  country_name: string | null
  search_count: number
  click_count: number
  unique_users: number
}

type PopularCorridorsResponse = {
  corridors: PopularCorridor[]
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
}
type FavoriteProvidersResponse = {
  providers: FavoriteProvider[]
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
}
type HeatmapResponse = {
  heatmap: HeatmapRow[]
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
}
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
  providers: Array<PrivacyAnnotated & {
    provider_id: string
    provider_name?: string | null
    total_clicks: number
    unique_clicks: number
    affiliate_clicks: number
    conversions: number
    unique_conversions: number
    conversion_rate: number
    conversion_values: Record<string, number> | null
    quote_count?: number
  }>
  corridors: Array<PrivacyAnnotated & {
    provider_id: string
    provider_name?: string | null
    corridor_id: string | null
    total_clicks: number
    unique_clicks: number
    conversions: number
    conversion_rate: number
    conversion_values: Record<string, number> | null
    quote_count?: number
  }>
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
}
type SessionMetricsResponse = {
  total_sessions: number
  unique_users: number
  avg_session_duration: number
  avg_searches_per_session: number
  bounce_rate: number
}

type CorridorTrendRow = PrivacyAnnotated & {
  corridor_id: string
  time_bucket: string
  search_count: number
  click_count: number
}

type CorridorTrendsResponse = {
  trends: CorridorTrendRow[]
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
}

type ProviderCtrRow = PrivacyAnnotated & {
  provider_id: string
  provider_name?: string | null
  ctr: number
  time_bucket?: string
}

type ProviderCtrResponse = {
  ctr_data: ProviderCtrRow[]
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
}

type EngagementRow = PrivacyAnnotated & {
  time_bucket: string
  active_users: number
  returning_users: number
}

type EngagementResponse = {
  engagement: EngagementRow[]
  privacy?: PrivacyEnvelope
  aggregationWindow?: AggregationWindow
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
    withLoading(() => request<CorridorTrendsResponse>('/analytics/corridors/trends', { method: 'GET', query: params }))

  const getFavoriteProviders = (params: AnalyticsDateRange & { limit?: number }) =>
    withLoading(() => request<FavoriteProvidersResponse>('/analytics/providers', { method: 'GET', query: params }))

  const getProviderCTR = (params: ProviderCtrParams) =>
    withLoading(() => request<ProviderCtrResponse>('/analytics/providers/ctr', { method: 'GET', query: params }))

  const getProviderImpact = (params: ProviderImpactParams) =>
    withLoading(() => request<ProviderImpactResponse>('/analytics/providers/impact', { method: 'GET', query: params }))

  const getEngagementMetrics = (params: EngagementParams) =>
    withLoading(() => request<EngagementResponse>('/analytics/engagement', { method: 'GET', query: params }))

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
