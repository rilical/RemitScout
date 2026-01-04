/**
 * Pulse dashboard defaults and mock data.
 *
 * NOTE: This file contains Plane C-specific Pulse dashboard data, but is kept
 * in `shared/` because Plane B uses it to seed Redis cache during ingestion.
 * This is a known cross-plane dependency that will be refactored in the future
 * to have Plane C manage its own cache seeding.
 *
 * @todo Move to plane-c/src/config/ once Plane C handles its own cache seeding
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

const now = Date.now()
const day = 24 * 60 * 60 * 1000
const lastUpdated = new Date(now - 2 * 60 * 60 * 1000).toISOString()

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
}

const titleFromId = (id: string) => id
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

const buildSeries = (label: string, base: number) => {
  return Array.from({ length: 8 }).map((_, index) => {
    const t = now - (7 - index) * day
    return {
      t,
      v: Number((base + Math.sin(index / 2) * 0.4 + index * 0.05).toFixed(3)),
    }
  })
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
    description: 'Sample pulse series for pre-production validation.',
    insightTemplate: 'Monitoring signal: {value}',
    lastUpdated,
    requiredFilters: ['corridor', 'amount'],
    tooltipCopy: 'Pre-production sample data.',
    sourceNotes: 'Seeded during local development.',
    defaultRange: '30d',
    plusRanges: ['90d', '365d'],
  }

  return {
    metadata,
    series: [
      {
        id: 'median',
        label: 'Median',
        color: '#2563eb',
        points: buildSeries('Median', 2.1),
      },
      {
        id: 'leader',
        label: 'Leader',
        color: '#22c55e',
        points: buildSeries('Leader', 1.8),
      },
    ],
    insight: 'Pricing tightened modestly over the last week.',
    annotations: [
      {
        t: now - 2 * day,
        label: 'Promo spike',
        type: 'promo',
      },
    ],
  }
}

export const pulseDefaults = {
  corridors: [
    {
      value: 'us-ph',
      label: 'US to Philippines',
      fromFlag: 'US',
      toFlag: 'PH',
      fromCode: 'US',
      toCode: 'PH',
    },
    {
      value: 'us-mx',
      label: 'US to Mexico',
      fromFlag: 'US',
      toFlag: 'MX',
      fromCode: 'US',
      toCode: 'MX',
    },
    {
      value: 'gb-in',
      label: 'UK to India',
      fromFlag: 'GB',
      toFlag: 'IN',
      fromCode: 'GB',
      toCode: 'IN',
    },
  ],
  overview: {
    tiles: [
      {
        id: 'best-rate',
        label: 'Best Delivered',
        value: '$982.40',
        delta: '+1.2%',
        deltaType: 'positive',
        deltaLabel: 'vs 7d avg',
        tooltip: 'Top provider delivered amount vs last week.',
        chartId: 'all-in-cost',
        icon: 'trend-up',
      },
      {
        id: 'avg-markup',
        label: 'Avg Markup',
        value: '210 bps',
        delta: '-8 bps',
        deltaType: 'positive',
        deltaLabel: 'week over week',
        tooltip: 'Median FX markup across providers.',
        chartId: 'fx-markup',
        icon: 'target',
      },
      {
        id: 'reliability',
        label: 'Reliability',
        value: '97.8%',
        delta: '+0.6%',
        deltaType: 'positive',
        deltaLabel: '30d trend',
        tooltip: 'Quote success across providers.',
        chartId: 'quote-success',
        icon: 'shield',
      },
      {
        id: 'volatility',
        label: 'Volatility',
        value: 'Low',
        delta: 'Stable',
        deltaType: 'neutral',
        deltaLabel: 'last 14d',
        tooltip: 'Day-to-day pricing variance.',
        chartId: 'volatility-pulse',
        icon: 'activity',
      },
    ],
    charts: ['all-in-cost', 'fx-markup', 'provider-winner', 'volatility-pulse'],
    lastUpdated,
    corridorName: 'US to Philippines',
  },
  methodCoverage: [
    { provider: 'Wise', bank: true, cash: false, wallet: true, card: true, speed: 'Same day' },
    { provider: 'Remitly', bank: true, cash: true, wallet: true, card: true, speed: '15-30 min' },
    { provider: 'Xoom', bank: true, cash: true, wallet: false, card: true, speed: 'Minutes' },
  ],
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
    rows: [
      {
        timestamp: now - day,
        provider: 'Wise',
        deliveredAmount: 982.4,
        deliveredCurrency: 'PHP',
        fee: 4.99,
        feeCurrency: 'USD',
        rate: 55.12,
        markupBps: 180,
        provenance: 'verified',
      },
      {
        timestamp: now - 2 * day,
        provider: 'Remitly',
        deliveredAmount: 976.2,
        deliveredCurrency: 'PHP',
        fee: 3.99,
        feeCurrency: 'USD',
        rate: 54.84,
        markupBps: 210,
        provenance: 'observed',
      },
    ],
    totalRows: 2,
    page: 1,
    pageSize: 20,
  },
  hero: {
    points: Array.from({ length: 12 }).map((_, index) => ({
      timestamp: now - (11 - index) * day,
      midMarketRate: 55.9 + index * 0.02,
      bestProviderRate: 55.4 + index * 0.03,
      bestProvider: 'Wise',
      bankAverageRate: 54.7 + index * 0.01,
      spread: 1.2,
      spreadPercent: 2.1,
    })),
    currentSpread: 1.2,
    currentSpreadPercent: 2.1,
    bestProvider: 'Wise',
    lossOn1000: 18.5,
    currency: 'PHP',
    lastUpdated,
  },
  coverageSummary: {
    quotesInRange: 152,
    providersIncluded: 8,
    methodsIncluded: ['bank', 'wallet', 'cash'],
    lastUpdated,
  },
  snapshotSummary: {
    kpis: [
      {
        id: 'best-delivered',
        label: 'Best Delivered',
        value: 'PHP 55,100',
        delta: '+0.8%',
        deltaType: 'positive',
        tooltip: 'Top provider deliverable amount.',
      },
      {
        id: 'median-cost',
        label: 'Median Cost',
        value: '2.1%',
        delta: '-0.2%',
        deltaType: 'positive',
        tooltip: 'Median total cost percentage.',
      },
    ],
    quotesInRange: 48,
    providersIncluded: 6,
    methodsIncluded: ['bank', 'wallet'],
    leader: 'Wise',
    lastUpdated,
  },
  providerBenchmarking: [
    {
      provider: 'Wise',
      deliveredAmount: 982.4,
      totalCost: 17.6,
      totalCostBps: 176,
      fee: 4.99,
      markupBps: 120,
      speed: 'Same day',
      winRate: 0.42,
      reliability: 0.98,
    },
    {
      provider: 'Remitly',
      deliveredAmount: 976.2,
      totalCost: 23.8,
      totalCostBps: 238,
      fee: 3.99,
      markupBps: 180,
      speed: '15-30 min',
      winRate: 0.35,
      reliability: 0.96,
    },
  ],
  events: [
    {
      id: 'evt-1',
      timestamp: new Date(now - 6 * day).toISOString(),
      severity: 'medium',
      title: 'FX spike detected',
      description: 'Mid-market rate jumped 0.6% within 2 hours.',
      chartId: 'volatility-pulse',
    },
  ],
  providerHeatmap: {
    days: Array.from({ length: 7 }).map((_, index) => ({
      date: new Date(now - (6 - index) * day).toISOString().slice(0, 10),
      timestamp: now - (6 - index) * day,
      winner: index % 2 === 0 ? 'Wise' : 'Remitly',
      winnerColor: index % 2 === 0 ? '#2563eb' : '#22c55e',
      savings: 8 + index,
    })),
    providerStats: {
      Wise: { wins: 4, percentage: 57 },
      Remitly: { wins: 3, percentage: 43 },
    },
    lastUpdated,
  },
  smartSend: {
    level: 'good',
    message: 'Rates are stable with modest upside.',
    rationale: ['Volatility is low', 'Provider spreads are tightening'],
    lastUpdated,
  },
  marketSnapshot: {
    quotes: [
      {
        provider: 'Wise',
        color: '#2563eb',
        recipientGets: 982.4,
        fee: 4.99,
        rate: 55.12,
        markupBps: 180,
        speed: 'Same day',
        isPromo: false,
      },
      {
        provider: 'Remitly',
        color: '#22c55e',
        recipientGets: 976.2,
        fee: 3.99,
        rate: 54.84,
        markupBps: 210,
        speed: '15-30 min',
        isPromo: true,
        promoText: 'First transfer fee waived',
      },
    ],
    midMarketRate: 55.9,
    currency: 'PHP',
    amount: 1000,
    lastUpdated,
  },
  trueCost: [
    {
      id: 'wise',
      name: 'Wise',
      fee: 4.99,
      marginPct: 0.018,
      fxRate: 55.12,
      recipientGets: 982.4,
      delivery: 'Same day',
      reliability: 0.98,
      methods: ['bank', 'wallet', 'card'],
      bestFor: 'Best delivered value',
      trueCost: {
        upfrontFee: 4.99,
        hiddenMarkup: 12.5,
        hiddenMarkupPercent: 1.25,
        totalCost: 17.49,
        totalCostPercent: 1.75,
        deltaFromBest: 0,
        deltaPercent: 0,
        midMarketRate: 55.9,
        providerRate: 55.12,
        spreadBps: 180,
      },
    },
    {
      id: 'remitly',
      name: 'Remitly',
      fee: 3.99,
      marginPct: 0.021,
      fxRate: 54.84,
      recipientGets: 976.2,
      delivery: '15-30 min',
      reliability: 0.96,
      methods: ['bank', 'wallet', 'cash', 'card'],
      bestFor: 'Speed',
      trueCost: {
        upfrontFee: 3.99,
        hiddenMarkup: 20.4,
        hiddenMarkupPercent: 2.04,
        totalCost: 24.39,
        totalCostPercent: 2.44,
        deltaFromBest: 6.9,
        deltaPercent: 0.7,
        midMarketRate: 55.9,
        providerRate: 54.84,
        spreadBps: 210,
      },
    },
  ],
  marketDepth: {
    bestRate: 55.12,
    bestProvider: 'Wise',
    secondBestRate: 54.84,
    secondBestProvider: 'Remitly',
    medianRate: 54.3,
    worstRate: 53.2,
    worstProvider: 'Bank average',
    spreadRange: 1.92,
    spreadRangeBps: 210,
    providerCount: 7,
  },
  arbitrage: {
    provider: 'Wise',
    currentRate: 55.12,
    averageRate: 54.7,
    savingsPercent: 0.77,
    percentile: 92,
    isSignificant: true,
    recommendation: 'Lock in now while rates are favorable.',
  },
  bankComparison: {
    bankMarkup: 0.035,
    bankFee: 12,
    bankTotalCost: 47.5,
    bestSpecialistMarkup: 0.018,
    bestSpecialistFee: 4.99,
    bestSpecialistTotalCost: 17.5,
    bestSpecialistName: 'Wise',
    savings: 30.0,
    savingsPercent: 63,
  },
  costTrend: [
    {
      date: new Date(now - 6 * day).toISOString().slice(0, 10),
      averageHiddenFee: 18.2,
      bestProvider: 'Wise',
      bestProviderCost: 17.5,
      marketLeaderDays: 12,
    },
    {
      date: new Date(now - 3 * day).toISOString().slice(0, 10),
      averageHiddenFee: 19.1,
      bestProvider: 'Remitly',
      bestProviderCost: 18.7,
      marketLeaderDays: 9,
    },
  ],
}

export const pulseDefaultKeys = [
  'pulse:corridors',
  'pulse:overview',
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
