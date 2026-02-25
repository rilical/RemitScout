/**
 * Pulse dashboard defaults (empty templates only).
 *
 * NOTE: This file contains Plane C-specific Pulse dashboard data, but is kept
 * in `shared/` because Plane B uses it for cache shape/metadata.
 *
 * @todo Move to plane-c/src/config/ once Plane C handles its own cache seeding.
 */

type ChartCategory = 'cost-markup' | 'delivered-amount' | 'volatility' | 'availability'
type ChartType = 'line' | 'bar' | 'stacked' | 'scatter' | 'matrix'
type TimeRange = '7d' | '30d' | '90d' | '365d'

type ChartMetadata = {
  id: string
  title: string
  category: ChartCategory
  categoryLabel: string
  type: ChartType
  unit: string
  unitLabel: string
  description: string
  insightTemplate: string
  lastUpdated: string
  requiredFilters: string[]
  tooltipCopy: string
  sourceNotes: string
  defaultRange: TimeRange
  plusRanges: TimeRange[]
}

type ChartData = {
  metadata: ChartMetadata
  series: Array<{ id: string; label: string; color: string; points: Array<{ t: number; v: number; label?: string }> }>
  annotations?: Array<{ t: number; label: string; type: 'event' | 'promo' | 'alert' }>
  insight: string
}

// Defaults are intentionally "empty templates".
// Do not fabricate timestamps; the API should surface real Gold/Gold-export freshness only.
const lastUpdated = ''

const categoryLabels: Record<ChartCategory, string> = {
  'cost-markup': 'Pricing & Margin',
  'delivered-amount': 'Competitive Dynamics',
  volatility: 'Volatility & Risk',
  availability: 'Operational Coverage',
}

const chartCategoryMap: Record<string, ChartCategory> = {
  'all-in-cost': 'cost-markup',
  'fx-markup': 'cost-markup',
  'fee-vs-markup': 'cost-markup',
  'spread-distribution': 'cost-markup',
  'provider-winner': 'delivered-amount',
  'leader-change-frequency': 'delivered-amount',
  'leader-edge': 'delivered-amount',
  'pass-through-latency': 'delivered-amount',
  'volatility-pulse': 'volatility',
  'quote-anomalies': 'volatility',
  'spread-volatility': 'volatility',
  'quote-success': 'availability',
  'provider-availability': 'availability',
  'data-freshness': 'availability',
  'corridor-liquidity': 'availability',
  'indices-confidence': 'availability',
  'indices-provider-count': 'availability',
  'indices-suppression': 'availability',
}

const titleFromId = (id: string) => id
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

const chartOverrides: Record<string, Partial<ChartMetadata>> = {
  'all-in-cost': {
    title: 'All-in Cost Index (RCI)',
    unit: 'percent',
    unitLabel: '%',
    description: 'Remittance Cost Index derived from Gold indices (lower is better).',
    sourceNotes: 'Gold indices · $500 bank bucket · updated daily.',
  },
  'fx-markup': {
    title: 'FX Markup vs Mid-Market (TEER-derived)',
    unit: 'bps',
    unitLabel: 'bps',
    description: 'Implied markup vs mid-market derived from TEER.',
    sourceNotes: 'Gold indices · $500 bank bucket · updated daily.',
  },
  'volatility-pulse': {
    title: 'Volatility Pulse (RVI, bps)',
    unit: 'bps',
    unitLabel: 'bps',
    description: 'Remittance Volatility Index in basis points.',
    sourceNotes: 'Gold indices · $500 bank bucket · updated daily.',
  },
  'indices-confidence': {
    title: 'Indices Confidence (weight_confidence)',
    unit: 'percent',
    unitLabel: '%',
    description: 'Confidence score (0-100) used by the Gold indices weighting pipeline.',
    sourceNotes: 'Gold export · cdp_daily · updated daily.',
  },
  'indices-provider-count': {
    title: 'Indices Provider Count (provider_count)',
    unit: 'count',
    unitLabel: '',
    description: 'Provider coverage count used for Gold indices eligibility and suppression.',
    sourceNotes: 'Gold export · cdp_daily · updated daily.',
  },
  'indices-suppression': {
    title: 'Indices Suppression Flag (suppression_flag)',
    type: 'bar',
    unit: 'flag',
    unitLabel: '',
    description: 'Whether the index point is suppressed due to coverage/confidence constraints.',
    sourceNotes: 'Gold export · cdp_daily · updated daily.',
  },
}

export const buildChartData = (chartId: string): ChartData => {
  const category = chartCategoryMap[chartId] || 'cost-markup'
  const metadata: ChartMetadata = {
    id: chartId,
    title: titleFromId(chartId),
    category,
    categoryLabel: categoryLabels[category],
    type: 'line',
    unit: category === 'volatility' ? 'percent' : 'bps',
    unitLabel: category === 'volatility' ? '%' : 'bps',
    description: 'Awaiting live data.',
    insightTemplate: 'No data yet.',
    lastUpdated,
    requiredFilters: ['corridor', 'amount'],
    tooltipCopy: 'No data yet.',
    sourceNotes: 'Live data pending.',
    defaultRange: '30d',
    plusRanges: ['365d'],
  }

  const overrides = chartOverrides[chartId]
  const resolvedMetadata = overrides ? { ...metadata, ...overrides } : metadata

  return {
    metadata: resolvedMetadata,
    series: [],
    insight: 'No data yet.',
  }
}

export const pulseDefaults = {
  corridors: [],
  overview: {
    tiles: [],
    charts: [],
    lastUpdated,
    corridorName: null,
  },
  methodCoverage: [],
  table: {
    columns: [
      { key: 'timestamp', label: 'Timestamp', sortable: true, align: 'left', format: 'date' },
      { key: 'provider', label: 'Provider', sortable: true, align: 'left' },
      { key: 'deliveredAmount', label: 'Delivered', sortable: true, align: 'right', format: 'currency' },
      { key: 'fee', label: 'Fee', sortable: true, align: 'right', format: 'currency' },
      { key: 'rate', label: 'Rate', sortable: true, align: 'right', format: 'number' },
      { key: 'markupBps', label: 'Markup', sortable: true, align: 'right', format: 'bps' },
      { key: 'provenance', label: 'Source', sortable: false, align: 'center' },
    ],
    rows: [],
    totalRows: 0,
    page: 1,
    pageSize: 20,
  },
  hero: {
    points: [],
    currentSpread: 0,
    currentSpreadPercent: 0,
    bestProvider: 'n/a',
    lossOn1000: 0,
    currency: '',
    lastUpdated,
  },
  coverageSummary: {
    quotesInRange: 0,
    providersIncluded: 0,
    methodsIncluded: [],
    lastUpdated,
  },
  snapshotSummary: {
    kpis: [],
    quotesInRange: 0,
    providersIncluded: 0,
    methodsIncluded: [],
    leader: 'n/a',
    lastUpdated,
  },
  providerBenchmarking: [],
  events: [],
  providerHeatmap: {
    days: [],
    providerStats: {},
    lastUpdated,
  },
  smartSend: {
    level: 'wait',
    message: 'No data yet.',
    rationale: [],
    lastUpdated,
  },
  narrative: {
    summary: '',
    generatedAt: '',
    source: 'rule_based',
  },
  marketSnapshot: {
    quotes: [],
    midMarketRate: 0,
    currency: '',
    amount: 0,
    lastUpdated,
  },
  trueCost: [],
  marketDepth: {
    bestRate: 0,
    bestProvider: 'n/a',
    secondBestRate: 0,
    secondBestProvider: 'n/a',
    medianRate: 0,
    worstRate: 0,
    worstProvider: 'n/a',
    spreadRange: 0,
    spreadRangeBps: 0,
    providerCount: 0,
  },
  arbitrage: null,
  bankComparison: {
    bankMarkup: 0,
    bankFee: 0,
    bankTotalCost: 0,
    bestSpecialistMarkup: 0,
    bestSpecialistFee: 0,
    bestSpecialistTotalCost: 0,
    bestSpecialistName: 'n/a',
    savings: 0,
    savingsPercent: 0,
  },
  costTrend: [],
}

export const pulseDefaultKeys = [
  'pulse:corridors',
  'pulse:overview',
  'pulse:narrative',
  'pulse:method-coverage',
  'pulse:table',
  'pulse:hero',
  'pulse:coverage-summary',
  'pulse:snapshot-summary',
  'pulse:provider-benchmarking',
  'pulse:events',
  'pulse:provider-heatmap',
  'pulse:smart-send',
  'pulse:market-snapshot',
  'pulse:true-cost',
  'pulse:market-depth',
  'pulse:arbitrage',
  'pulse:bank-comparison',
  'pulse:cost-trend',
]
