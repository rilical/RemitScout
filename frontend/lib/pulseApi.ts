import type {
  PulseFilters,
  PulseOverview,
  ChartData,
  TimeRange,
  MethodCoverageRow,
  TableData,
  CorridorOption,
  PulseSnapshotSummary,
  PulseCoverageSummary,
  PulseProviderBenchmarkRow,
  PulseEventItem,
  PulseScreenerResponse,
} from '~/types/pulse'
import { useApi } from '~/composables/useApi'
import type { PulseCorridor, PulseTimeframe } from '~/stores/pulse'
import type { MarketDepth, ArbitrageOpportunity, BankComparisonData, ProviderWithTrueCost, CostTrendData } from '~/types/remit'

export interface HeroChartDataPoint {
  timestamp: number
  midMarketRate: number
  bestProviderRate: number
  bestProvider: string
  bankAverageRate: number
  spread: number
  spreadPercent: number
}

export interface HeroChartData {
  points: HeroChartDataPoint[]
  currentSpread: number
  currentSpreadPercent: number
  bestProvider: string
  lossOn1000: number
  currency: string
  lastUpdated: string
}

export interface ProviderHeatmapDay {
  date: string
  timestamp: number
  winner: string
  winnerColor: string
  savings: number
}

export interface ProviderHeatmapData {
  days: ProviderHeatmapDay[]
  providerStats: Record<string, { wins: number, percentage: number }>
  lastUpdated: string
}

export interface ProviderQuoteSnapshot {
  provider: string
  color: string
  recipientGets: number
  fee: number
  rate: number
  markupBps: number
  speed: string
  isPromo: boolean
  promoText?: string
}

export interface MarketSnapshotData {
  quotes: ProviderQuoteSnapshot[]
  midMarketRate: number
  currency: string
  amount: number
  lastUpdated: string
}

export type SmartSendLevel = 'great' | 'good' | 'fair' | 'wait'

export interface SmartSendData {
  level: SmartSendLevel
  message: string
  rationale: string[]
  lastUpdated: string
  recommendation?: string
  currentRate?: number
  avg30Day?: number
  percentFromAvg?: number
  confidence?: number
  percentile?: number
}

let corridorCache: CorridorOption[] | null = null

const buildPulseQuery = (filters: PulseFilters, extra: Record<string, unknown> = {}) => ({
  corridor: filters.corridor,
  corridor_id: filters.corridorId,
  amount: filters.amount,
  fundingMethod: filters.fundingMethod,
  payoutMethod: filters.payoutMethod,
  ...extra,
})

const normalizeSlug = (value: string) => value.trim().toLowerCase()

const getCorridorSlug = (corridor: CorridorOption): string => {
  if (typeof corridor.slug === 'string' && corridor.slug.trim()) return corridor.slug
  return corridor.value
}

const pickBestCorridor = (candidates: CorridorOption[]): CorridorOption | undefined => {
  if (candidates.length === 0) return undefined

  let best: CorridorOption = candidates[0]
  let bestRank: [number, number, number] = [
    best.isUsdOrigin ? 1 : 0,
    typeof best.dataPoints === 'number' ? best.dataPoints : 0,
    best.lastUpdated ? new Date(best.lastUpdated).getTime() : 0,
  ]

  for (const entry of candidates) {
    const usBias = entry.isUsdOrigin ? 1 : 0
    const points = typeof entry.dataPoints === 'number' ? entry.dataPoints : 0
    const updatedAt = entry.lastUpdated ? new Date(entry.lastUpdated).getTime() : 0
    const rank: [number, number, number] = [usBias, points, updatedAt]

    if (rank[0] !== bestRank[0]) {
      if (rank[0] > bestRank[0]) {
        best = entry
        bestRank = rank
      }
      continue
    }
    if (rank[1] !== bestRank[1]) {
      if (rank[1] > bestRank[1]) {
        best = entry
        bestRank = rank
      }
      continue
    }
    if (rank[2] !== bestRank[2]) {
      if (rank[2] > bestRank[2]) {
        best = entry
        bestRank = rank
      }
    }
  }

  return best
}

export async function getCorridors(): Promise<CorridorOption[]> {
  const { request } = useApi()

  try {
    corridorCache = await request<CorridorOption[]>('/pulse/corridors')
    return corridorCache
  }
  catch (error: any) {
    const code = error?.statusCode
    if (code === 401 || code === 403) {
      corridorCache = []
      return []
    }
    throw error
  }
}

export function getCorridorById(corridorId: string): CorridorOption | undefined {
  if (!corridorCache) return undefined
  const normalized = corridorId.trim()
  return corridorCache.find(c => c.corridorId === normalized)
}

export function getCorridorBySlug(slug: string): CorridorOption | undefined {
  if (!corridorCache) return undefined

  const normalized = normalizeSlug(slug)
  const candidates = corridorCache.filter((c) => {
    const value = normalizeSlug(c.value)
    const key = normalizeSlug(getCorridorSlug(c))
    return value === normalized || key === normalized
  })

  return pickBestCorridor(candidates)
}

export async function getPulseOverview(filters: PulseFilters): Promise<PulseOverview> {
  const { request } = useApi()
  return await request<PulseOverview>('/pulse/overview', { query: buildPulseQuery(filters) })
}

export async function getChartData(
  chartId: string,
  filters: PulseFilters,
  range: TimeRange = '30d',
): Promise<ChartData | null> {
  const { request } = useApi()
  return await request<ChartData>(`/pulse/charts/${chartId}`, { query: buildPulseQuery(filters, { range }) })
}

export type PulseChartSource = 'gold_export' | 'gold_cache' | 'none'

export interface PulseChartsBatchItem {
  id: string
  dataAvailable: boolean
  updatedAt: string | null
  source: PulseChartSource
  chart: ChartData
}

export interface PulseChartsBatchResponse {
  success: true
  updatedAt: string | null
  dataAvailable: boolean
  charts: PulseChartsBatchItem[]
}

export async function getChartsBatch(
  chartIds: string[],
  filters: PulseFilters,
  range: TimeRange = '30d',
): Promise<PulseChartsBatchResponse> {
  const { request } = useApi()
  return await request<PulseChartsBatchResponse>('/pulse/charts', {
    query: buildPulseQuery(filters, {
      range,
      chart_ids: chartIds.join(','),
    }),
  })
}

export interface PulseCoverageByCurrencyRow {
  sendCurrency: string
  corridorsTotal: number
  corridorsSuppressed: number
  corridorsAvailable: number
  corridorsWith3PlusProviders: number
  corridorsWith1to2Providers: number
  corridorsWith0Providers: number
  weightConfidenceP10: number | null
  weightConfidenceP50: number | null
  weightConfidenceP90: number | null
}

export interface PulseCoverageByCurrencyResponse {
  success: true
  date: string | null
  updatedAt: string | null
  rows: PulseCoverageByCurrencyRow[]
}

export async function getCoverageByCurrency(
  filters: PulseFilters,
  sendCurrencies: string[] = ['USD', 'AED', 'GBP', 'EUR'],
  amountBucket: number = 500,
): Promise<PulseCoverageByCurrencyResponse> {
  const { request } = useApi()
  return await request<PulseCoverageByCurrencyResponse>('/pulse/coverage-by-currency', {
    query: buildPulseQuery(filters, {
      send_currencies: sendCurrencies.join(','),
      amount_bucket: amountBucket,
    }),
  })
}

export async function getMethodCoverage(filters: PulseFilters): Promise<MethodCoverageRow[]> {
  const { request } = useApi()
  return await request<MethodCoverageRow[]>('/pulse/method-coverage', { query: buildPulseQuery(filters) })
}

export async function getTableData(
  chartId: string,
  filters: PulseFilters,
  range: TimeRange = '7d',
  page: number = 1,
  pageSize: number = 20,
): Promise<TableData> {
  const { request } = useApi()
  return await request<TableData>('/pulse/table', {
    query: buildPulseQuery(filters, { chartId, range, page, pageSize }),
  })
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatCurrency(value: number, currency: string): string {
  if (currency === 'PHP') return `₱${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (currency === 'USD') return `$${value.toFixed(2)}`
  if (currency === 'MXN') return `MXN ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (currency === 'INR') return `₹${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
}

export async function getHeroChartData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000,
): Promise<HeroChartData> {
  const { request } = useApi()
  return await request<HeroChartData>('/pulse/hero', { query: { corridor: corridor.slug, timeframe, amount } })
}

export async function getPulseCoverageSummary(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
): Promise<PulseCoverageSummary> {
  const { request } = useApi()
  return await request<PulseCoverageSummary>('/pulse/coverage-summary', { query: { corridor: corridor.slug, timeframe } })
}

export async function getPulseSnapshotSummary(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000,
): Promise<PulseSnapshotSummary> {
  const { request } = useApi()
  return await request<PulseSnapshotSummary>('/pulse/snapshot-summary', { query: { corridor: corridor.slug, timeframe, amount } })
}

export async function getProviderBenchmarkingData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000,
): Promise<PulseProviderBenchmarkRow[]> {
  const { request } = useApi()
  return await request<PulseProviderBenchmarkRow[]>('/pulse/providers/benchmarking', {
    query: { corridor: corridor.slug, timeframe, amount },
  })
}

export async function getPulseEventFeed(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
): Promise<PulseEventItem[]> {
  const { request } = useApi()
  return await request<PulseEventItem[]>('/pulse/events', { query: { corridor: corridor.slug, timeframe } })
}

export async function getProviderHeatmapData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
): Promise<ProviderHeatmapData> {
  const { request } = useApi()
  return await request<ProviderHeatmapData>('/pulse/providers/heatmap', { query: { corridor: corridor.slug, timeframe } })
}

export async function getSmartSendData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000,
): Promise<SmartSendData> {
  const { request } = useApi()
  return await request<SmartSendData>('/pulse/smart-send', { query: { corridor: corridor.slug, timeframe, amount } })
}

export async function getMarketSnapshot(
  corridor: PulseCorridor,
  amount: number = 1000,
): Promise<MarketSnapshotData> {
  const { request } = useApi()
  return await request<MarketSnapshotData>('/pulse/market-snapshot', { query: { corridor: corridor.slug, amount } })
}

export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    PHP: '₱',
    MXN: '$',
    INR: '₹',
    NGN: '₦',
    USD: '$',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    EUR: '€',
  }

  return symbols[code] || code
}

export async function getTrueCostBreakdown(
  corridor: PulseCorridor,
  amount: number = 1000,
): Promise<ProviderWithTrueCost[]> {
  const { request } = useApi()
  return await request<ProviderWithTrueCost[]>('/pulse/true-cost', { query: { corridor: corridor.slug, amount } })
}

export async function getMarketDepthData(
  corridor: PulseCorridor,
): Promise<MarketDepth> {
  const { request } = useApi()
  return await request<MarketDepth>('/pulse/market-depth', { query: { corridor: corridor.slug } })
}

export async function getArbitrageOpportunities(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
): Promise<ArbitrageOpportunity | null> {
  const { request } = useApi()
  return await request<ArbitrageOpportunity | null>('/pulse/arbitrage', { query: { corridor: corridor.slug, timeframe } })
}

export async function getBankComparisonData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000,
): Promise<BankComparisonData> {
  const { request } = useApi()
  return await request<BankComparisonData>('/pulse/bank-comparison', { query: { corridor: corridor.slug, timeframe, amount } })
}

export async function getCostTrendData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000,
): Promise<CostTrendData[]> {
  const { request } = useApi()
  return await request<CostTrendData[]>('/pulse/cost-trend', { query: { corridor: corridor.slug, timeframe, amount } })
}

export async function getPulseScreener(options?: {
  corridorIds?: string[]
  timeframe?: PulseTimeframe | string
  amount?: number
  payin?: 'bank' | 'card' | 'cash'
  payout?: 'bank' | 'cash' | 'wallet'
  includeMovers?: boolean
}): Promise<PulseScreenerResponse> {
  const { request } = useApi()

  const query: Record<string, unknown> = {}

  const corridorIds = options?.corridorIds?.filter(Boolean).map(id => String(id).trim()).filter(Boolean) ?? []
  if (corridorIds.length > 0) {
    // Plane A supports repeated params or comma-separated. Use comma to keep requests compact.
    query.corridor_ids = corridorIds.join(',')
  }

  if (options?.timeframe) query.timeframe = options.timeframe
  if (typeof options?.amount === 'number') query.amount = options.amount
  if (options?.payin) query.payin = options.payin
  if (options?.payout) query.payout = options.payout
  if (typeof options?.includeMovers === 'boolean') query.include_movers = options.includeMovers ? '1' : '0'

  return await request<PulseScreenerResponse>('/pulse/screener', { query })
}
