export type CollectorMethod = 'api' | 'scrape'

export interface CorridorConfig {
  fromCountry: string
  toCountry: string
  fromCurrency: string
  toCurrency: string
}

export interface ProviderApiConfig {
  enabled: boolean
  endpoint: string | null
  headers: Record<string, string>
  queryParams: Record<string, string | number | boolean>
  method?: 'GET' | 'POST'
  timeoutMs?: number
  bodyTemplate?: string | null
}

export interface ProviderScrapeSelectors {
  amountInput?: string
  fromCountryInput?: string
  toCountryInput?: string
  fromCurrencyInput?: string
  toCurrencyInput?: string
  triggerButton?: string
  rateSelectors?: string[]
  feeSelectors?: string[]
  totalSelectors?: string[]
  payoutMethodSelectors?: string[]
}

export interface ProviderScrapeConfig {
  enabled: boolean
  urlTemplate: string | null
  waitFor?: string
  selectors?: ProviderScrapeSelectors
  timeoutMs?: number
}

export interface ProviderConfig {
  slug: string
  label: string
  enabled: boolean
  method: CollectorMethod
  api: ProviderApiConfig
  scrape: ProviderScrapeConfig
  maxRetries?: number
  timeoutMs?: number
  discoveredIndex?: number
  source?: 'catalog' | 'discovery'
}

export interface MonitoProviderQuote {
  pspSlug: string
  pspName: string
  rate: number | null
  fee: number | null
  totalReceived: number | null
  payoutMethod: string | null
  deliveryEstimate: string | null
  isPromo: boolean
  rank: number | null
  isBest: boolean
  flags: Record<string, unknown>
}

export interface MonitoSnapshot {
  timestamp: string
  corridor: CorridorConfig
  amount: number
  comparisonId: string | null
  midMarketRate: number | null
  amountUSD: number | null
  providerQuotes: MonitoProviderQuote[]
  rawGraphql: unknown
  rawGraphqlArchivePath?: string
}

export interface ProviderSnapshot {
  timestamp: string
  providerSlug: string
  providerLabel: string
  amount: number
  fromCurrency: string
  toCurrency: string
  corridorFromCountry: string
  corridorToCountry: string
  effectiveRate: number | null
  fee: number | null
  totalReceived: number | null
  payoutMethod: string | null
  deliveryEstimate: string | null
  raw: unknown
  method: CollectorMethod
}

export interface SnapshotCsvRow {
  run_id: string
  timestamp: string
  from_country: string
  to_country: string
  from_currency: string
  to_currency: string
  amount: number
  comparison_id: string | null
  mid_market_rate: number | null
  amount_usd: number | null
  provider_slug: string
  provider_name: string
  monito_rate: string | number | null
  monito_fee: string | number | null
  monito_total_received: string | number | null
  monito_rank: number | null
  monito_is_best: boolean
  monito_method: string
  monito_status: string
  monito_error: string | null
  raw_graphql_json_path: string | null
}

export interface ProviderCsvRow {
  run_id: string
  timestamp: string
  provider_slug: string
  provider_label: string
  from_currency: string
  to_currency: string
  from_country: string
  to_country: string
  amount: number
  provider_effective_rate: string | number | null
  provider_fee: string | number | null
  provider_total_received: string | number | null
  method: string
  status: string
  error: string | null
  raw: string
}

export interface RunTickResult {
  amount: number
  monito?: MonitoSnapshot
  monitoError?: string
  providerSnapshots: ProviderSnapshot[]
  providerErrors: Array<{ slug: string; error: string }>
}

export interface DiscoverMonitoResult {
  snapshots: MonitoSnapshot[]
  seenProviderSlugs: string[]
}

export interface DiscoveryContext {
  runId: string
  corridor: CorridorConfig
  amounts: number[]
  requestTimestamp: string
}

export interface OrchestratorRunConfig {
  monitoBaseUrl: string
  corridor: CorridorConfig
  amounts: number[]
  intervalSeconds: number
  runDurationMinutes: number
  providers: ProviderConfig[]
  maxConcurrency: number
  monitoTimeoutMs: number
  providerRetryCount: number
  headlessBrowser: boolean
  outputDir: string
  dataMatchWindowSeconds: number
  topNProviders?: number | null
  runId?: string
}

export type ProviderMethodEvidenceState =
  | 'API_VERIFIED'
  | 'API_ATTEMPTED_FAILED'
  | 'SCRAPE_REQUIRED'
  | 'SCRAPE_FAILED'
  | 'API_ACCESS_REQUESTED'
  | 'PENDING'

export interface ProviderMethodEvidence {
  slug: string
  monitoSeen: boolean
  methodAssigned: CollectorMethod
  evidence: string[]
  status: ProviderMethodEvidenceState
}

export interface RunEvidence {
  runId: string
  corridor: CorridorConfig
  startedAt: string
  endedAt?: string
  amounts: number[]
  discoveredProviders: string[]
  catalogMismatch: string[]
  providerMethodReport: ProviderMethodEvidence[]
}

export interface CanonicalProviderIdentity {
  slug: string
  label: string
  supportsB2b: boolean
  supportsB2c: boolean
}
