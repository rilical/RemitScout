export type TelemetrySearchInput = {
  session_id: string
  user_id?: string | null
  corridor_id: string
  amount_bucket: number
  payin: string
  payout: string
  utm?: Record<string, unknown> | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
  page_path?: string | null
}

export type TelemetryClickInput = {
  session_id: string
  user_id?: string | null
  provider_id: string
  corridor_id?: string | null
  target_url: string
  page_path?: string | null
  utm?: Record<string, unknown> | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
  is_affiliate?: boolean | null
}

export type TelemetryConversionInput = {
  session_id: string
  user_id?: string | null
  provider_id: string
  corridor_id?: string | null
  conversion_value?: number | null
  conversion_currency?: string | null
  offer_id?: string | null
  source?: string | null
  page_path?: string | null
  utm?: Record<string, unknown> | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
}

export type TelemetrySessionInput = {
  session_id: string
  user_id?: string | null
  anon_id?: string | null
  referrer?: string | null
  first_page?: string | null
  utm?: Record<string, unknown> | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
}

export type TelemetrySessionRow = {
  session_id: string
  user_id: string | null
  anon_id: string | null
  created_at: Date
  last_activity: Date
  engagement_count: number
  first_page: string | null
  referrer: string | null
  utm?: Record<string, unknown> | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
}

export type TelemetryAnalyticsRow = {
  metric_name: string
  metric_value: unknown
  time_bucket: Date
  dimensions: unknown | null
  computed_at: Date
}

export interface ITelemetryRepository {
  recordSearchEvent(input: TelemetrySearchInput): Promise<void>
  recordOutboundClick(input: TelemetryClickInput): Promise<void>
  recordAffiliateConversion(input: TelemetryConversionInput): Promise<void>
  createOrUpdateSession(input: TelemetrySessionInput): Promise<TelemetrySessionRow>
  getSessionById(sessionId: string): Promise<TelemetrySessionRow | null>
  recordProviderVisit(input: {
    provider_id: string
    corridor_id?: string | null
    user_id?: string | null
    anon_session_id?: string | null
    session_id: string
    target_url?: string | null
    page_path?: string | null
    utm?: Record<string, unknown> | null
    gclid?: string | null
    fbclid?: string | null
    msclkid?: string | null
    quoted_rate?: number | null
    quoted_fee?: number | null
  }): Promise<void>
  getAnalyticsAggregate(input: {
    metric_name: string
    since?: Date
  }): Promise<TelemetryAnalyticsRow[]>
}
