export type SourceType = 'public_web' | 'partner_api' | 'paid_api' | 'app_simulation'
export type TermsRisk = 'low' | 'medium' | 'high'
export type ProviderStatus = 'candidate' | 'sandbox' | 'beta' | 'production' | 'deprecated'

export type RightsMatrixStatusRecord = {
  stoplist_status: string
  notes: string | null
}

export type RightsMatrixEntryRecord = {
  provider_id: string
  allowed_collect: boolean
  allowed_b2c: boolean
  allowed_b2b: boolean
  stoplist_status: string
  source_countries?: string[] | null
  destination_countries?: string[] | null
  source_type?: SourceType | null
  auth_required?: boolean | null
  terms_risk?: TermsRisk | null
  allowed_internal_use?: boolean | null
  allowed_resell_b2b?: boolean | null
  allowed_derived_only?: boolean | null
  allowed_provider_attribution?: boolean | null
  allowed_in_rvi?: boolean | null
  allowed_in_rci?: boolean | null
  allowed_in_teer?: boolean | null
  expected_update_frequency?: string | null
  observed_update_frequency?: string | null
  uptime_last_30d?: number | null
  avg_quote_latency_ms?: number | null
  status?: ProviderStatus | null
  last_reviewed_at?: string | null
  reviewer?: string | null
}

export type RightsMatrixStoplistRecord = {
  provider_id: string
  stoplist_status: string
}

export type RightsMatrixUpsertInput = {
  providerId: string
  allowedCollect: boolean
  allowedB2c: boolean
  allowedB2b: boolean
  notes: string | null
}

export type RightsMatrixCountrySupportInput = {
  providerId: string
  sourceCountries: string[]
  destinationCountries: string[]
  changeSource?: string
}

export type RightsMatrixIndexPermissionsInput = {
  providerId: string
  allowedInRvi: boolean
  allowedInRci: boolean
  allowedInTeer: boolean
}

export type RightsMatrixGovernanceInput = {
  providerId: string
  status: ProviderStatus
  reviewer: string
}

export type RightsMatrixQualityMetricsInput = {
  providerId: string
  expectedUpdateFrequency?: string | null
  observedUpdateFrequency?: string | null
  uptimeLast30d?: number | null
  avgQuoteLatencyMs?: number | null
}

export interface IRightsMatrixRepository {
  pauseProvider(providerId: string, notes: string): Promise<void>
  getProviderStatus(providerId: string): Promise<RightsMatrixStatusRecord | null>
  setProviderActive(providerId: string): Promise<void>
  loadProviderRights(): Promise<RightsMatrixEntryRecord[]>
  upsertProviderRights(input: RightsMatrixUpsertInput): Promise<void>
  upsertProviderCountrySupport(input: RightsMatrixCountrySupportInput): Promise<void>
  loadStoplistStatuses(): Promise<RightsMatrixStoplistRecord[]>
  updateIndexPermissions(input: RightsMatrixIndexPermissionsInput): Promise<void>
  updateGovernance(input: RightsMatrixGovernanceInput): Promise<void>
  updateQualityMetrics(input: RightsMatrixQualityMetricsInput): Promise<void>
  loadProvidersEligibleForIndex(indexType: 'rvi' | 'rci' | 'teer'): Promise<RightsMatrixEntryRecord[]>
}
