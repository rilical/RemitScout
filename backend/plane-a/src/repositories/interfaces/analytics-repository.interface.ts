export type PopularCorridor = {
  corridor_id: string
  from_country: string
  to_country: string
  search_count: number
  click_count: number
  unique_users: number
  trend: 'up' | 'down' | 'stable'
  trend_percentage: number
}

export type CorridorTrend = {
  time_bucket: Date
  corridor_id: string
  search_count: number
  click_count: number
}

export type FavoriteProvider = {
  provider_id: string
  provider_name: string | null
  click_count: number
  search_count: number
  click_through_rate: number
  unique_users: number
}

export type ProviderCTR = {
  provider_id: string
  provider_name: string | null
  clicks: number
  searches: number
  ctr: number
  time_bucket: Date
}

export type EngagementMetric = {
  time_bucket: Date
  avg_session_duration: number
  avg_searches_per_session: number
  avg_clicks_per_session: number
  active_users: number
  returning_users: number
}

export type SessionMetric = {
  total_sessions: number
  unique_users: number
  avg_session_duration: number
  avg_searches_per_session: number
  bounce_rate: number
}

export type HeatmapData = {
  country_code: string
  country_name: string | null
  search_count: number
  click_count: number
  unique_users: number
}

export type SavingsMetric = {
  corridor_id?: string
  total_searches: number
  total_savings_fees: number
  total_savings_delta: number
  avg_savings_per_search: number
  best_provider_savings: number
  worst_provider_cost: number
}

export type UserBehaviorPattern = {
  pattern_type: string
  pattern_data: Record<string, unknown>
  frequency: number
  percentage: number
}

export type RevenueMetric = {
  provider_id: string
  provider_name: string | null
  corridor_id: string | null
  total_clicks: number
  affiliate_clicks: number
  affiliate_rate: number
  unique_users: number
}

export interface IAnalyticsRepository {
  getPopularCorridors(params: {
    startDate: Date
    endDate: Date
    limit?: number
  }): Promise<PopularCorridor[]>

  getCorridorTrends(params: {
    corridorId?: string
    startDate: Date
    endDate: Date
    bucket: 'hour' | 'day' | 'week'
  }): Promise<CorridorTrend[]>

  getFavoriteProviders(params: {
    startDate: Date
    endDate: Date
    limit?: number
  }): Promise<FavoriteProvider[]>

  getProviderClickThroughRates(params: {
    providerId?: string
    startDate: Date
    endDate: Date
    bucket: 'hour' | 'day' | 'week'
  }): Promise<ProviderCTR[]>

  getEngagementMetrics(params: {
    startDate: Date
    endDate: Date
    bucket: 'hour' | 'day' | 'week'
  }): Promise<EngagementMetric[]>

  getSessionMetrics(params: {
    startDate: Date
    endDate: Date
  }): Promise<SessionMetric>

  getGeographicHeatmap(params: {
    startDate: Date
    endDate: Date
    aggregation: 'country' | 'city'
  }): Promise<HeatmapData[]>

  getSavingsMetrics(params: {
    startDate: Date
    endDate: Date
    corridorId?: string
  }): Promise<{ summary: SavingsMetric; by_corridor: SavingsMetric[] }>

  getUserBehaviorPatterns(params: {
    startDate: Date
    endDate: Date
    patternType: 'search_frequency' | 'corridor_preferences' | 'amount_distribution'
  }): Promise<UserBehaviorPattern[]>

  getRevenueMetrics(params: {
    startDate: Date
    endDate: Date
    providerId?: string
    corridorId?: string
    limit?: number
  }): Promise<RevenueMetric[]>
}
