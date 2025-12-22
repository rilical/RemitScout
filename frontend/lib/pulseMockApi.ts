import type {
  PulseFilters,
  PulseOverview,
  ChartData,
  ChartSeries,
  ChartPoint,
  TableData,
  TableRow,
  HeadlineTile,
  MethodCoverageRow,
  CorridorOption,
  TimeRange,
} from '~/types/pulse'
import { getChartById, PROVIDER_COLORS } from './pulseChartRegistry'
import type { PulseTimeframe, PulseCorridor } from '~/stores/pulse'

const PROVIDERS = ['Wise', 'Remitly', 'XE', 'Xoom', 'WorldRemit', 'Sendwave']

const BANKS = ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank']

const BASE_MID_MARKET_RATES: Record<string, number> = {
  'usd-php': 56.25,
  'usd-mxn': 17.15,
  'usd-inr': 83.50,
  'gbp-inr': 106.20,
  'usd-ngn': 1550.00,
  'cad-php': 41.50,
  'aud-php': 37.20,
  'gbp-ngn': 1980.00,
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  MXN: '$',
  INR: '₹',
  NGN: '₦',
  USD: '$',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
}

const CORRIDORS: CorridorOption[] = [
  { value: 'united-states-to-philippines', label: 'US → Philippines', fromFlag: '🇺🇸', toFlag: '🇵🇭', fromCode: 'US', toCode: 'PH' },
  { value: 'united-states-to-mexico', label: 'US → Mexico', fromFlag: '🇺🇸', toFlag: '🇲🇽', fromCode: 'US', toCode: 'MX' },
  { value: 'united-states-to-india', label: 'US → India', fromFlag: '🇺🇸', toFlag: '🇮🇳', fromCode: 'US', toCode: 'IN' },
  { value: 'united-kingdom-to-india', label: 'UK → India', fromFlag: '🇬🇧', toFlag: '🇮🇳', fromCode: 'GB', toCode: 'IN' },
  { value: 'canada-to-india', label: 'CA → India', fromFlag: '🇨🇦', toFlag: '🇮🇳', fromCode: 'CA', toCode: 'IN' },
  { value: 'united-states-to-nigeria', label: 'US → Nigeria', fromFlag: '🇺🇸', toFlag: '🇳🇬', fromCode: 'US', toCode: 'NG' },
  { value: 'australia-to-philippines', label: 'AU → Philippines', fromFlag: '🇦🇺', toFlag: '🇵🇭', fromCode: 'AU', toCode: 'PH' },
  { value: 'united-states-to-vietnam', label: 'US → Vietnam', fromFlag: '🇺🇸', toFlag: '🇻🇳', fromCode: 'US', toCode: 'VN' },
]

function getDaysForRange(range: TimeRange): number {
  const map: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
  return map[range]
}

function generateTimestamps(days: number): number[] {
  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  return Array.from({ length: days }, (_, i) => now - (days - 1 - i) * msPerDay)
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function generateTrendingData(baseValue: number, volatility: number, days: number, trend: number = 0): number[] {
  const values: number[] = []
  let current = baseValue
  for (let i = 0; i < days; i++) {
    current += randomInRange(-volatility, volatility) + trend
    values.push(Math.max(0, current))
  }
  return values
}

function generateProviderSeries(providers: string[], baseValues: Record<string, number>, volatility: number, days: number): ChartSeries[] {
  const timestamps = generateTimestamps(days)
  return providers.map(provider => {
    const base = baseValues[provider.toLowerCase()] || baseValues.wise || 2.5
    const values = generateTrendingData(base, volatility, days)
    return {
      id: provider.toLowerCase(),
      label: provider,
      color: PROVIDER_COLORS[provider.toLowerCase()] || '#666',
      points: timestamps.map((t, i) => ({ t, v: values[i] })),
    }
  })
}

export function getCorridors(): CorridorOption[] {
  return CORRIDORS
}

export function getCorridorBySlug(slug: string): CorridorOption | undefined {
  return CORRIDORS.find(c => c.value === slug)
}

export async function getPulseOverview(filters: PulseFilters): Promise<PulseOverview> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const corridorInfo = filters.corridor !== 'global' ? getCorridorBySlug(filters.corridor) : null
  
  const tiles: HeadlineTile[] = [
    {
      id: 'all-in-cost',
      label: 'All-in Cost Today',
      value: '2.4%',
      delta: '-0.3%',
      deltaType: 'positive',
      deltaLabel: 'vs 7d avg',
      tooltip: 'Total cost including fees and FX markup',
      chartId: 'all-in-cost',
      icon: 'percent',
    },
    {
      id: 'fx-markup',
      label: 'FX Markup (median)',
      value: '140 bps',
      delta: '+5 bps',
      deltaType: 'negative',
      deltaLabel: 'vs 7d avg',
      tooltip: 'Exchange rate markup vs mid-market',
      chartId: 'fx-markup',
      icon: 'trending',
    },
    {
      id: 'best-provider',
      label: 'Best Provider',
      value: 'Remitly',
      delta: '+1.1%',
      deltaType: 'positive',
      deltaLabel: 'edge vs #2',
      tooltip: 'Provider with highest recipient amount',
      chartId: 'provider-winner',
      icon: 'trophy',
    },
    {
      id: 'volatility',
      label: 'Volatility (7d)',
      value: 'Medium',
      deltaType: 'neutral',
      tooltip: 'How much rates change day-to-day',
      chartId: 'volatility-pulse',
      icon: 'activity',
    },
    {
      id: 'reliability',
      label: 'Quote Success',
      value: '98.4%',
      delta: '+0.3%',
      deltaType: 'positive',
      deltaLabel: 'vs 7d avg',
      tooltip: 'API quote success rate',
      chartId: 'quote-success',
      icon: 'check',
    },
  ]

  return {
    tiles,
    charts: ['all-in-cost', 'fx-markup', 'recipient-gets', 'provider-winner', 'volatility-pulse', 'quote-anomalies', 'quote-success', 'method-coverage'],
    lastUpdated: new Date().toISOString(),
    corridorName: corridorInfo?.label,
  }
}

export async function getChartData(chartId: string, filters: PulseFilters, range: TimeRange = '30d'): Promise<ChartData | null> {
  await new Promise(resolve => setTimeout(resolve, 150))

  const metadata = getChartById(chartId)
  if (!metadata) return null

  const days = getDaysForRange(range)
  const timestamps = generateTimestamps(days)
  let series: ChartSeries[] = []
  let insight = ''

  switch (chartId) {
    case 'all-in-cost': {
      const baseValues: Record<string, number> = { wise: 2.2, remitly: 2.4, xe: 2.8, xoom: 3.1, worldremit: 3.4, sendwave: 2.6 }
      series = generateProviderSeries(PROVIDERS, baseValues, 0.15, days)
      const bestLine: ChartSeries = {
        id: 'best',
        label: 'Best Available',
        color: PROVIDER_COLORS.best,
        points: timestamps.map((t, i) => ({
          t,
          v: Math.min(...series.map(s => s.points[i].v)),
        })),
      }
      series = [bestLine, ...series]
      insight = 'Costs fell 0.3% this week'
      break
    }

    case 'fx-markup': {
      const baseValues: Record<string, number> = { wise: 45, remitly: 65, xe: 85, xoom: 120, worldremit: 140, sendwave: 75 }
      series = generateProviderSeries(PROVIDERS, baseValues, 10, days)
      insight = 'Median markup is 140 bps (+5 bps vs 7d avg)'
      break
    }

    case 'recipient-gets': {
      const baseAmount = filters.amount === 1000 ? 56000 : filters.amount === 500 ? 28000 : filters.amount === 200 ? 11200 : 5600
      const values = generateTrendingData(baseAmount, baseAmount * 0.005, days, 10)
      series = [{
        id: 'best',
        label: 'Best Provider',
        color: PROVIDER_COLORS.best,
        points: timestamps.map((t, i) => ({ t, v: values[i] })),
      }]
      insight = 'Recipients get +₱142 more than last week'
      break
    }

    case 'provider-winner': {
      const providerIndices = PROVIDERS.slice(0, 4)
      series = providerIndices.map((provider, pIdx) => ({
        id: provider.toLowerCase(),
        label: provider,
        color: PROVIDER_COLORS[provider.toLowerCase()] || '#666',
        points: timestamps.map((t, i) => ({
          t,
          v: (i + pIdx) % 4 === 0 ? 1 : 0,
        })),
      }))
      insight = 'Remitly has been #1 for 18 of the last 30 days'
      break
    }

    case 'volatility-pulse': {
      const values = Array.from({ length: days }, () => randomInRange(0.1, 2.5))
      series = [{
        id: 'volatility',
        label: 'Daily Change',
        color: '#f59e0b',
        points: timestamps.map((t, i) => ({ t, v: values[i] })),
      }]
      insight = 'Volatility is Medium — good time to transfer'
      break
    }

    case 'quote-anomalies': {
      series = PROVIDERS.slice(0, 4).map(provider => ({
        id: provider.toLowerCase(),
        label: provider,
        color: PROVIDER_COLORS[provider.toLowerCase()] || '#666',
        points: Array.from({ length: 20 }, () => ({
          t: randomInRange(-3, 3),
          v: randomInRange(-3, 3),
        })),
      }))
      insight = '2 anomalies detected in the last 7 days'
      break
    }

    case 'quote-success': {
      const baseValues: Record<string, number> = { wise: 99, remitly: 98, xe: 97, xoom: 96, worldremit: 95, sendwave: 94 }
      series = generateProviderSeries(PROVIDERS, baseValues, 1, days)
      insight = 'Overall reliability is 98.4% (+0.3% vs 7d avg)'
      break
    }

    case 'method-coverage': {
      series = []
      insight = '5 providers support bank transfer for this corridor'
      break
    }
  }

  return {
    metadata: { ...metadata, lastUpdated: new Date().toISOString() },
    series,
    insight,
  }
}

export async function getMethodCoverage(filters: PulseFilters): Promise<MethodCoverageRow[]> {
  await new Promise(resolve => setTimeout(resolve, 100))

  return [
    { provider: 'Wise', bank: true, cash: false, wallet: false, card: true, speed: 'Minutes–2d' },
    { provider: 'Remitly', bank: true, cash: true, wallet: true, card: true, speed: '15min–2d' },
    { provider: 'XE', bank: true, cash: false, wallet: false, card: true, speed: '1–4 days' },
    { provider: 'Xoom', bank: true, cash: true, wallet: false, card: true, speed: 'Min–days' },
    { provider: 'WorldRemit', bank: true, cash: true, wallet: true, card: true, speed: 'Min–days' },
    { provider: 'Sendwave', bank: false, cash: false, wallet: true, card: false, speed: 'Minutes' },
  ]
}

export async function getTableData(
  chartId: string,
  filters: PulseFilters,
  range: TimeRange = '7d',
  page: number = 1,
  pageSize: number = 20,
): Promise<TableData> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const days = getDaysForRange(range)
  const totalRows = days * PROVIDERS.length
  const rows: TableRow[] = []

  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, totalRows)

  const baseAmount = filters.amount === 1000 ? 56000 : filters.amount === 500 ? 28000 : filters.amount === 200 ? 11200 : 5600

  for (let i = startIdx; i < endIdx; i++) {
    const dayIdx = Math.floor(i / PROVIDERS.length)
    const providerIdx = i % PROVIDERS.length
    const timestamp = Date.now() - (days - dayIdx) * 24 * 60 * 60 * 1000

    rows.push({
      timestamp,
      provider: PROVIDERS[providerIdx],
      deliveredAmount: baseAmount + randomInRange(-500, 500),
      deliveredCurrency: 'PHP',
      fee: randomInRange(2, 8),
      feeCurrency: 'USD',
      rate: 56.2 + randomInRange(-0.5, 0.5),
      markupBps: Math.round(randomInRange(30, 150)),
      provenance: ['verified', 'observed', 'estimated'][Math.floor(Math.random() * 3)] as 'verified' | 'observed' | 'estimated',
    })
  }

  return {
    columns: [
      { key: 'timestamp', label: 'Timestamp', sortable: true, align: 'left', format: 'date' },
      { key: 'provider', label: 'Provider', sortable: true, align: 'left' },
      { key: 'deliveredAmount', label: 'Delivered', sortable: true, align: 'right', format: 'currency' },
      { key: 'fee', label: 'Fee', sortable: true, align: 'right', format: 'currency' },
      { key: 'rate', label: 'Rate', sortable: true, align: 'right', format: 'number' },
      { key: 'markupBps', label: 'Markup', sortable: true, align: 'right', format: 'bps' },
      { key: 'provenance', label: 'Source', sortable: false, align: 'center' },
    ],
    rows,
    totalRows,
    page,
    pageSize,
  }
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

// ============================================================================
// BLOOMBERG-STYLE DATA FUNCTIONS
// ============================================================================

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

function generateHourlyTimestamps(hours: number): number[] {
  const now = Date.now()
  const msPerHour = 60 * 60 * 1000
  return Array.from({ length: hours }, (_, i) => now - (hours - 1 - i) * msPerHour)
}

function getHoursForTimeframe(timeframe: PulseTimeframe): number {
  const map: Record<PulseTimeframe, number> = {
    '24H': 24,
    '7D': 168,
    '30D': 720,
    '1Y': 8760,
    'MAX': 17520,
  }
  return map[timeframe]
}

export async function getHeroChartData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe,
  amount: number = 1000
): Promise<HeroChartData> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const hours = getHoursForTimeframe(timeframe)
  const dataPoints = timeframe === '24H' ? hours : Math.min(hours, 168)
  const timestamps = generateHourlyTimestamps(dataPoints)
  
  const baseMidRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25
  const toCurrency = corridor.toCode
  
  const points: HeroChartDataPoint[] = timestamps.map((timestamp, i) => {
    const hourOfDay = new Date(timestamp).getHours()
    const dayVariation = Math.sin(i * 0.1) * 0.002
    const hourlyNoise = (Math.random() - 0.5) * 0.001
    
    const midMarketRate = baseMidRate * (1 + dayVariation + hourlyNoise)
    
    const providerMarkups = {
      Wise: 0.004 + Math.random() * 0.002,
      Remitly: 0.005 + Math.random() * 0.003,
      XE: 0.006 + Math.random() * 0.002,
      Xoom: 0.008 + Math.random() * 0.004,
    }
    
    const bestMarkup = Math.min(...Object.values(providerMarkups))
    const bestProvider = Object.entries(providerMarkups).find(([, m]) => m === bestMarkup)?.[0] || 'Wise'
    const bestProviderRate = midMarketRate * (1 - bestMarkup)
    
    const bankMarkup = 0.025 + Math.random() * 0.015
    const bankAverageRate = midMarketRate * (1 - bankMarkup)
    
    const spread = midMarketRate - bestProviderRate
    const spreadPercent = (spread / midMarketRate) * 100
    
    return {
      timestamp,
      midMarketRate,
      bestProviderRate,
      bestProvider,
      bankAverageRate,
      spread,
      spreadPercent,
    }
  })
  
  const lastPoint = points[points.length - 1]
  const lossOn1000 = (lastPoint.midMarketRate - lastPoint.bestProviderRate) * (amount / lastPoint.midMarketRate)
  
  return {
    points,
    currentSpread: lastPoint.spread,
    currentSpreadPercent: lastPoint.spreadPercent,
    bestProvider: lastPoint.bestProvider,
    lossOn1000: Math.round(lossOn1000 * 100) / 100,
    currency: toCurrency,
    lastUpdated: new Date().toISOString(),
  }
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
  providerStats: Record<string, { wins: number; percentage: number }>
  lastUpdated: string
}

export async function getProviderHeatmapData(
  corridor: PulseCorridor,
  timeframe: PulseTimeframe
): Promise<ProviderHeatmapData> {
  await new Promise(resolve => setTimeout(resolve, 80))

  const hoursTotal = getHoursForTimeframe(timeframe)
  const daysCount = Math.ceil(hoursTotal / 24)
  const actualDays = Math.min(daysCount, 90)
  
  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  
  const providers = ['Wise', 'Remitly', 'XE', 'Xoom']
  const providerWins: Record<string, number> = { Wise: 0, Remitly: 0, XE: 0, Xoom: 0 }
  
  const days: ProviderHeatmapDay[] = Array.from({ length: actualDays }, (_, i) => {
    const timestamp = now - (actualDays - 1 - i) * msPerDay
    const date = new Date(timestamp)
    const dayOfWeek = date.getDay()
    
    let winner: string
    const rand = Math.random()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      winner = rand < 0.4 ? 'Remitly' : rand < 0.7 ? 'Wise' : rand < 0.9 ? 'XE' : 'Xoom'
    } else if (dayOfWeek === 2) {
      winner = rand < 0.5 ? 'Wise' : rand < 0.8 ? 'Remitly' : rand < 0.95 ? 'XE' : 'Xoom'
    } else {
      winner = rand < 0.45 ? 'Wise' : rand < 0.75 ? 'Remitly' : rand < 0.9 ? 'XE' : 'Xoom'
    }
    
    providerWins[winner]++
    
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      timestamp,
      winner,
      winnerColor: PROVIDER_COLORS[winner.toLowerCase()] || '#666',
      savings: Math.round((0.5 + Math.random() * 2) * 100) / 100,
    }
  })
  
  const providerStats: Record<string, { wins: number; percentage: number }> = {}
  for (const [provider, wins] of Object.entries(providerWins)) {
    providerStats[provider] = {
      wins,
      percentage: Math.round((wins / actualDays) * 100),
    }
  }
  
  return {
    days,
    providerStats,
    lastUpdated: new Date().toISOString(),
  }
}

export type SmartSendLevel = 'great' | 'good' | 'fair' | 'wait'

export interface SmartSendData {
  level: SmartSendLevel
  currentRate: number
  avg30Day: number
  percentile: number
  percentFromAvg: number
  recommendation: string
  confidence: number
  lastUpdated: string
}

export async function getSmartSendData(
  corridor: PulseCorridor,
  amount: number = 1000
): Promise<SmartSendData> {
  await new Promise(resolve => setTimeout(resolve, 60))

  const baseMidRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25
  
  const currentMarkup = 0.004 + Math.random() * 0.004
  const currentRate = baseMidRate * (1 - currentMarkup)
  
  const avg30DayMarkup = 0.006
  const avg30Day = baseMidRate * (1 - avg30DayMarkup)
  
  const percentFromAvg = ((currentRate - avg30Day) / avg30Day) * 100
  const percentile = 50 + percentFromAvg * 10 + (Math.random() - 0.5) * 10
  const clampedPercentile = Math.max(0, Math.min(100, percentile))
  
  let level: SmartSendLevel
  let recommendation: string
  let confidence: number
  
  if (clampedPercentile >= 85) {
    level = 'great'
    recommendation = `Great time to send! Rates are in the top ${Math.round(100 - clampedPercentile)}% of the last 30 days.`
    confidence = 0.9
  } else if (clampedPercentile >= 60) {
    level = 'good'
    recommendation = `Good rates today. You're getting better than average value.`
    confidence = 0.75
  } else if (clampedPercentile >= 35) {
    level = 'fair'
    recommendation = `Rates are average. Consider waiting if your transfer isn't urgent.`
    confidence = 0.6
  } else {
    level = 'wait'
    recommendation = `Wait if you can. Rates are ${Math.abs(percentFromAvg).toFixed(1)}% below the 30-day average.`
    confidence = 0.7
  }
  
  return {
    level,
    currentRate,
    avg30Day,
    percentile: Math.round(clampedPercentile),
    percentFromAvg: Math.round(percentFromAvg * 100) / 100,
    recommendation,
    confidence,
    lastUpdated: new Date().toISOString(),
  }
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

export async function getMarketSnapshot(
  corridor: PulseCorridor,
  amount: number = 1000
): Promise<MarketSnapshotData> {
  await new Promise(resolve => setTimeout(resolve, 80))

  const midMarketRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25
  const toCurrency = corridor.toCode
  
  const providerData = [
    { provider: 'Wise', baseFee: 4.5, baseMarkup: 0.004, speed: '1-2 hours' },
    { provider: 'Remitly', baseFee: 0, baseMarkup: 0.008, speed: '15 min - 4 hours', promoChance: 0.3 },
    { provider: 'XE', baseFee: 0, baseMarkup: 0.010, speed: '1-4 days' },
    { provider: 'Xoom', baseFee: 5, baseMarkup: 0.012, speed: '15 min - 2 days' },
    { provider: 'WorldRemit', baseFee: 3.99, baseMarkup: 0.015, speed: 'Minutes - 1 day' },
    { provider: 'Western Union', baseFee: 8, baseMarkup: 0.025, speed: 'Minutes - 3 days' },
  ]
  
  const quotes: ProviderQuoteSnapshot[] = providerData.map(p => {
    const noise = (Math.random() - 0.5) * 0.003
    const markup = p.baseMarkup + noise
    const rate = midMarketRate * (1 - markup)
    const fee = p.baseFee + (Math.random() - 0.5) * 1
    const recipientGets = (amount - fee) * rate
    const isPromo = p.promoChance ? Math.random() < p.promoChance : false
    
    return {
      provider: p.provider,
      color: PROVIDER_COLORS[p.provider.toLowerCase().replace(' ', '')] || '#666',
      recipientGets: Math.round(recipientGets * 100) / 100,
      fee: Math.round(fee * 100) / 100,
      rate: Math.round(rate * 10000) / 10000,
      markupBps: Math.round(markup * 10000),
      speed: p.speed,
      isPromo,
      promoText: isPromo ? 'First transfer free!' : undefined,
    }
  })
  
  quotes.sort((a, b) => b.recipientGets - a.recipientGets)
  
  return {
    quotes,
    midMarketRate,
    currency: toCurrency,
    amount,
    lastUpdated: new Date().toISOString(),
  }
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code
}

// ============================================================================
// TRUE COST CALCULATOR API FUNCTIONS
// ============================================================================

import type { TrueCostBreakdown, MarketDepth, ArbitrageOpportunity, BankComparisonData, CostTrendData } from '~/types/remit'
import { buildTrueCostBreakdown, buildMarketDepth, buildBankComparison } from './trueCostCalculator'

export interface TrueCostQuote {
  provider: string
  trueCost: TrueCostBreakdown
  recipientGets: number
  speed: string
}

export async function getTrueCostBreakdown(
  corridor: PulseCorridor,
  amount: number = 1000
): Promise<TrueCostQuote[]> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const midMarketRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25

  const providerData = [
    { provider: 'Wise', fee: 4.5, spreadBps: 40, speed: '1-2 hours' },
    { provider: 'Remitly', fee: 0, spreadBps: 60, speed: '15 min - 4 hours' },
    { provider: 'XE', fee: 0, spreadBps: 100, speed: '1-4 days' },
    { provider: 'Xoom', fee: 5, spreadBps: 120, speed: '15 min - 2 days' },
    { provider: 'WorldRemit', fee: 3.99, spreadBps: 150, speed: 'Minutes - 1 day' },
    { provider: 'Bank', fee: 35, spreadBps: 560, speed: '2-5 days' },
  ]

  const quotes: TrueCostQuote[] = providerData.map((p, index) => {
    const providerRate = midMarketRate * (1 - p.spreadBps / 10000)
    const recipientGets = (amount - p.fee) * providerRate

    const bestProvider = providerData[0]
    const bestRate = midMarketRate * (1 - bestProvider.spreadBps / 10000)
    const bestHiddenMarkup = amount * (midMarketRate - bestRate) / midMarketRate
    const bestTotalCost = bestProvider.fee + bestHiddenMarkup

    const trueCost = buildTrueCostBreakdown(
      amount,
      p.fee,
      midMarketRate,
      providerRate,
      index === 0 ? 0 : bestTotalCost
    )

    return {
      provider: p.provider,
      trueCost,
      recipientGets: Math.round(recipientGets * 100) / 100,
      speed: p.speed,
    }
  })

  quotes.sort((a, b) => a.trueCost.totalCost - b.trueCost.totalCost)

  return quotes
}

export async function getMarketDepthData(
  corridor: PulseCorridor
): Promise<MarketDepth> {
  await new Promise(resolve => setTimeout(resolve, 80))

  const midMarketRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25

  const providers = [
    { name: 'Wise', rate: midMarketRate * 0.996 },
    { name: 'Remitly', rate: midMarketRate * 0.994 },
    { name: 'XE', rate: midMarketRate * 0.990 },
    { name: 'Xoom', rate: midMarketRate * 0.988 },
    { name: 'WorldRemit', rate: midMarketRate * 0.985 },
    { name: 'Western Union', rate: midMarketRate * 0.975 },
    { name: 'Bank', rate: midMarketRate * 0.944 },
  ]

  return buildMarketDepth(providers)
}

export async function getArbitrageOpportunities(
  corridor: PulseCorridor
): Promise<ArbitrageOpportunity | null> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const midMarketRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25
  const random = Math.random()

  if (random > 0.4) {
    const currentRate = midMarketRate * (0.996 + Math.random() * 0.002)
    const averageRate = midMarketRate * 0.992
    const savingsPercent = ((currentRate - averageRate) / averageRate) * 100
    const percentile = 75 + Math.random() * 20

    return {
      provider: 'Wise',
      currentRate,
      averageRate,
      savingsPercent,
      percentile: Math.round(percentile),
      isSignificant: savingsPercent > 0.3,
      recommendation: `This rate is in the top ${Math.round(100 - percentile)}% of rates we've seen in the last 30 days. Consider sending now to lock in this favorable rate.`,
    }
  }

  return null
}

export async function getBankComparisonData(
  corridor: PulseCorridor,
  amount: number = 1000
): Promise<BankComparisonData> {
  await new Promise(resolve => setTimeout(resolve, 80))

  const midMarketRate = BASE_MID_MARKET_RATES[corridor.slug] || 56.25

  const bankRate = midMarketRate * 0.944
  const bankFee = 35

  const bestSpecialistRate = midMarketRate * 0.996
  const bestSpecialistFee = 4.5

  return buildBankComparison(
    amount,
    midMarketRate,
    bankRate,
    bankFee,
    bestSpecialistRate,
    bestSpecialistFee,
    'Wise'
  )
}

export async function getCostTrendData(
  corridor: PulseCorridor,
  days: number = 7
): Promise<CostTrendData[]> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  const baseAvgCost = 4.5
  const providers = ['Wise', 'Remitly', 'XE', 'Xoom']

  return Array.from({ length: days }, (_, i) => {
    const timestamp = now - (days - 1 - i) * msPerDay
    const date = new Date(timestamp).toISOString().split('T')[0]

    const trend = -0.02 * (i / days)
    const noise = (Math.random() - 0.5) * 0.3
    const averageHiddenFee = baseAvgCost + trend + noise

    const bestProvider = providers[Math.floor(Math.random() * 2)]
    const bestProviderCost = averageHiddenFee - 0.5 - Math.random() * 0.5

    return {
      date,
      averageHiddenFee: Math.round(averageHiddenFee * 100) / 100,
      bestProvider,
      bestProviderCost: Math.round(bestProviderCost * 100) / 100,
      marketLeaderDays: Math.floor(Math.random() * days * 0.6),
    }
  })
}
