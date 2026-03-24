import { getChartById, PROVIDER_COLORS } from '~/lib/pulseChartRegistry'
import type {
  ChartData,
  ChartSeries,
  CorridorOption,
  MethodCoverageRow,
  PulseCoverageSummary,
  PulseOverview,
  PulseProviderBenchmarkRow,
  PulseSnapshotSummary,
  TableData,
  TimeRange,
} from '~/types/pulse'

type QueryValue = string | string[] | undefined
type QueryMap = Record<string, QueryValue>

const DEMO_MOCK_ENV_KEYS = [
  'NUXT_PUBLIC_PULSE_FORCE_MOCK',
  'PULSE_FORCE_MOCK',
] as const

type MockProvider = {
  name: string
  fee: number
  markupBps: number
  speed: string
  winRate: number
  reliability: number
}

type MockCorridor = CorridorOption & {
  midMarketRate: number
  bankFee: number
  bankMarkupBps: number
  confidence: number
  volatilityBps: number
  providers: MockProvider[]
}

const nowIso = () => new Date().toISOString()
const toStringValue = (value: QueryValue): string => Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
const normalizeId = (value: string) => value.trim().toLowerCase()
const round = (value: number, digits = 2) => Number(value.toFixed(digits))

export const shouldUsePulseDevMock = (query: QueryMap): boolean => {
  const mockMode = toStringValue(query.mock).trim().toLowerCase()
  if (mockMode === 'pulse') return true

  return DEMO_MOCK_ENV_KEYS.some((key) => {
    const value = process.env[key]
    return value === '1' || value?.toLowerCase() === 'true'
  })
}

const COLOR_BY_PROVIDER: Record<string, string> = {
  'Wise': PROVIDER_COLORS.wise,
  'Remitly': PROVIDER_COLORS.remitly,
  'WorldRemit': PROVIDER_COLORS.worldremit,
  'Western Union': PROVIDER_COLORS.westernunion,
  'Xoom': PROVIDER_COLORS.xoom,
  'Paysend': '#8B5CF6',
}

const PROVIDER_NAMES = ['Wise', 'Remitly', 'WorldRemit', 'Xoom', 'Western Union', 'Paysend'] as const

const makeProviders = (markups: number[], fees: number[], speeds: string[]): MockProvider[] =>
  PROVIDER_NAMES.map((name, index) => ({
    name,
    fee: fees[index],
    markupBps: markups[index],
    speed: speeds[index],
    winRate: round((34 - index * 4) / 100, 2),
    reliability: round((99 - index * 0.6) / 100, 3),
  }))

export const MOCK_PULSE_CORRIDORS: MockCorridor[] = [
  {
    value: 'us-mx-usd-mxn',
    label: 'United States → Mexico',
    fromFlag: '🇺🇸',
    toFlag: '🇲🇽',
    fromCode: 'USD',
    toCode: 'MXN',
    corridorId: 'us-mx-usd-mxn',
    slug: 'us-mx-usd-mxn',
    sourceCountry: 'US',
    destCountry: 'MX',
    sourceCurrency: 'USD',
    destCurrency: 'MXN',
    collectionTier: 'tier_2',
    collectionCadenceMinutes: 360,
    dataPoints: 1200,
    daysAvailable: 90,
    isUsdOrigin: true,
    sufficient: true,
    lastUpdated: nowIso(),
    midMarketRate: 17.21,
    bankFee: 8.5,
    bankMarkupBps: 185,
    confidence: 0.86,
    volatilityBps: 28,
    providers: makeProviders([42, 56, 63, 79, 96, 71], [1.99, 2.49, 2.89, 3.49, 4.99, 2.25], ['Minutes', 'Same day', 'Same day', 'Minutes', '1 day', 'Same day']),
  },
  {
    value: 'us-ph-usd-php',
    label: 'United States → Philippines',
    fromFlag: '🇺🇸',
    toFlag: '🇵🇭',
    fromCode: 'USD',
    toCode: 'PHP',
    corridorId: 'us-ph-usd-php',
    slug: 'us-ph-usd-php',
    sourceCountry: 'US',
    destCountry: 'PH',
    sourceCurrency: 'USD',
    destCurrency: 'PHP',
    collectionTier: 'tier_2',
    collectionCadenceMinutes: 360,
    dataPoints: 980,
    daysAvailable: 90,
    isUsdOrigin: true,
    sufficient: true,
    lastUpdated: nowIso(),
    midMarketRate: 56.14,
    bankFee: 9.25,
    bankMarkupBps: 172,
    confidence: 0.88,
    volatilityBps: 31,
    providers: makeProviders([39, 51, 58, 76, 90, 66], [1.5, 2.1, 2.7, 3.4, 4.75, 2.0], ['Minutes', 'Same day', 'Same day', 'Minutes', '1 day', 'Same day']),
  },
  {
    value: 'us-in-usd-inr',
    label: 'United States → India',
    fromFlag: '🇺🇸',
    toFlag: '🇮🇳',
    fromCode: 'USD',
    toCode: 'INR',
    corridorId: 'us-in-usd-inr',
    slug: 'us-in-usd-inr',
    sourceCountry: 'US',
    destCountry: 'IN',
    sourceCurrency: 'USD',
    destCurrency: 'INR',
    collectionTier: 'tier_2',
    collectionCadenceMinutes: 360,
    dataPoints: 1500,
    daysAvailable: 90,
    isUsdOrigin: true,
    sufficient: true,
    lastUpdated: nowIso(),
    midMarketRate: 82.54,
    bankFee: 7.75,
    bankMarkupBps: 148,
    confidence: 0.9,
    volatilityBps: 24,
    providers: makeProviders([35, 48, 54, 70, 88, 61], [1.25, 1.95, 2.35, 3.1, 4.5, 1.85], ['Minutes', 'Same day', 'Same day', 'Minutes', '1 day', 'Same day']),
  },
  {
    value: 'gb-ng-gbp-ngn',
    label: 'United Kingdom → Nigeria',
    fromFlag: '🇬🇧',
    toFlag: '🇳🇬',
    fromCode: 'GBP',
    toCode: 'NGN',
    corridorId: 'gb-ng-gbp-ngn',
    slug: 'gb-ng-gbp-ngn',
    sourceCountry: 'GB',
    destCountry: 'NG',
    sourceCurrency: 'GBP',
    destCurrency: 'NGN',
    collectionTier: 'tier_2',
    collectionCadenceMinutes: 720,
    dataPoints: 600,
    daysAvailable: 90,
    isUsdOrigin: false,
    sufficient: true,
    lastUpdated: nowIso(),
    midMarketRate: 2112.8,
    bankFee: 10.5,
    bankMarkupBps: 214,
    confidence: 0.77,
    volatilityBps: 54,
    providers: makeProviders([68, 82, 95, 121, 144, 103], [1.99, 2.79, 3.35, 4.25, 5.75, 2.5], ['Same day', '1 day', 'Same day', 'Minutes', '1 day', 'Same day']),
  },
  {
    value: 'ae-pk-aed-pkr',
    label: 'United Arab Emirates → Pakistan',
    fromFlag: '🇦🇪',
    toFlag: '🇵🇰',
    fromCode: 'AED',
    toCode: 'PKR',
    corridorId: 'ae-pk-aed-pkr',
    slug: 'ae-pk-aed-pkr',
    sourceCountry: 'AE',
    destCountry: 'PK',
    sourceCurrency: 'AED',
    destCurrency: 'PKR',
    collectionTier: 'tier_2',
    collectionCadenceMinutes: 720,
    dataPoints: 450,
    daysAvailable: 90,
    isUsdOrigin: false,
    sufficient: true,
    lastUpdated: nowIso(),
    midMarketRate: 76.82,
    bankFee: 11.2,
    bankMarkupBps: 236,
    confidence: 0.73,
    volatilityBps: 58,
    providers: makeProviders([74, 88, 97, 128, 151, 111], [1.9, 2.7, 3.15, 4.4, 5.9, 2.4], ['Same day', '1 day', 'Same day', 'Minutes', '1 day', 'Same day']),
  },
  {
    value: 'ca-in-cad-inr',
    label: 'Canada → India',
    fromFlag: '🇨🇦',
    toFlag: '🇮🇳',
    fromCode: 'CAD',
    toCode: 'INR',
    corridorId: 'ca-in-cad-inr',
    slug: 'ca-in-cad-inr',
    sourceCountry: 'CA',
    destCountry: 'IN',
    sourceCurrency: 'CAD',
    destCurrency: 'INR',
    collectionTier: 'tier_2',
    collectionCadenceMinutes: 720,
    dataPoints: 520,
    daysAvailable: 90,
    isUsdOrigin: false,
    sufficient: true,
    lastUpdated: nowIso(),
    midMarketRate: 60.87,
    bankFee: 8.9,
    bankMarkupBps: 164,
    confidence: 0.81,
    volatilityBps: 37,
    providers: makeProviders([44, 53, 66, 81, 102, 72], [1.45, 2.05, 2.55, 3.15, 4.8, 1.99], ['Minutes', 'Same day', 'Same day', 'Minutes', '1 day', 'Same day']),
  },
]

const COUNTRY_NAME_BY_CODE: Record<string, string> = {
  AE: 'United Arab Emirates',
  CA: 'Canada',
  GB: 'United Kingdom',
  IN: 'India',
  MX: 'Mexico',
  NG: 'Nigeria',
  PH: 'Philippines',
  PK: 'Pakistan',
  US: 'United States',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED ',
  CAD: 'C$',
  GBP: '£',
  INR: '₹',
  MXN: 'MX$',
  NGN: '₦',
  PHP: '₱',
  PKR: '₨',
  USD: '$',
}

const getRangeDays = (range: string): number => {
  switch (range) {
    case '7d': return 7
    case '90d': return 90
    case '365d': return 180
    default: return 30
  }
}

const buildTimestamps = (days: number, points = Math.min(Math.max(days, 7), 24)) => {
  const safePoints = Math.max(7, Math.min(points, 24))
  const spanDays = Math.max(days - 1, 1)
  return Array.from({ length: safePoints }, (_, index) => {
    const offsetDays = Math.round((spanDays / (safePoints - 1)) * (safePoints - 1 - index))
    const value = new Date()
    value.setUTCHours(0, 0, 0, 0)
    value.setUTCDate(value.getUTCDate() - offsetDays)
    return value.getTime()
  })
}

const getMockCorridor = (query: QueryMap): MockCorridor => {
  const corridorId = normalizeId(toStringValue(query.corridor_id))
  const corridorSlug = normalizeId(toStringValue(query.corridor))
  return MOCK_PULSE_CORRIDORS.find((entry) => {
    const optionId = normalizeId(entry.corridorId ?? '')
    const optionSlug = normalizeId(entry.slug ?? entry.value)
    return optionId === corridorId || optionSlug === corridorSlug
  }) ?? MOCK_PULSE_CORRIDORS[0]
}

const getAmount = (query: QueryMap, fallback = 500) => {
  const parsed = Number(toStringValue(query.amount))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const providerColor = (name: string) => COLOR_BY_PROVIDER[name] ?? '#2563EB'

const formatRecipient = (value: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `
  const maximumFractionDigits = value >= 1000 ? 0 : 2
  return `${symbol}${value.toLocaleString('en-US', { maximumFractionDigits })}`
}

const buildProviderRows = (corridor: MockCorridor, amount: number) => corridor.providers.map((provider, index) => {
  const rate = corridor.midMarketRate * (1 - provider.markupBps / 10_000)
  const recipientGets = (amount - provider.fee) * rate
  const totalCost = provider.fee + amount * (provider.markupBps / 10_000)
  return {
    provider: provider.name,
    color: providerColor(provider.name),
    recipientGets: round(recipientGets),
    fee: provider.fee,
    rate: round(rate, 4),
    markupBps: provider.markupBps,
    speed: provider.speed,
    isPromo: index === 0,
    promoText: index === 0 ? 'Limited-fee promo' : undefined,
    totalCost: round(totalCost),
    totalCostPct: round((totalCost / amount) * 100, 2),
    winRate: provider.winRate,
    reliability: provider.reliability,
  }
})

const buildWinnerSnapshots = (corridor: MockCorridor, amount: number, range: TimeRange) => {
  const rows = buildProviderRows(corridor, amount).sort((left, right) => right.recipientGets - left.recipientGets)
  const contenders = rows.slice(0, Math.min(4, rows.length))
  const timestamps = buildTimestamps(getRangeDays(range), Math.min(Math.max(getRangeDays(range), 7), 14))
  const pattern = [0, 0, 1, 1, 0, 2, 0, 1, 0, 3, 0, 1, 2, 0]

  return timestamps.map((timestamp, index) => {
    const winnerIndex = pattern[index % pattern.length] % contenders.length
    const winner = contenders[winnerIndex]
    const runner = contenders[(winnerIndex + 1) % contenders.length]
    const edgeBps = 7 + ((index * 3) % 11)
    const delivered = round(winner.recipientGets * (0.998 + Math.sin(index / 2.2 + corridor.midMarketRate / 30) * 0.004), 2)

    return {
      timestamp,
      winner: winner.provider,
      winnerColor: winner.color,
      edgeBps,
      delivered,
      runner: runner.provider,
      detail: `${formatRecipient(delivered, corridor.toCode)} recipient gets · ${edgeBps} bps ahead of ${runner.provider}`,
    }
  })
}

const buildLeaderChangesFromSnapshots = (
  snapshots: ReturnType<typeof buildWinnerSnapshots>,
) => snapshots
  .slice(1)
  .map((snapshot, index) => ({
    timestamp: snapshot.timestamp,
    changed: snapshots[index]?.winner !== snapshot.winner ? 1 : 0,
  }))

const normalizeRoundedWeights = (weights: number[], digits = 4) => {
  const rounded = weights.map(weight => round(weight, digits))
  const scale = 10 ** digits
  const sumUnits = rounded.reduce((total, weight) => total + Math.round(weight * scale), 0)
  const diffUnits = scale - sumUnits
  const lastIndex = rounded.length - 1
  if (lastIndex >= 0 && diffUnits !== 0) {
    rounded[lastIndex] = round(rounded[lastIndex] + diffUnits / scale, digits)
  }
  return rounded
}

const buildChartSeries = (labels: number[], values: number[], id: string, label: string, color: string): ChartSeries => ({
  id,
  label,
  color,
  points: labels.map((timestamp, index) => ({ t: timestamp, v: round(values[index] ?? values[values.length - 1] ?? 0, 2) })),
})

const withMetadata = (chartId: string, series: ChartSeries[], insight: string): ChartData => {
  const updatedAt = nowIso()
  const metadata = getChartById(chartId)
  return {
    metadata: metadata
      ? { ...metadata, lastUpdated: updatedAt }
      : {
          id: chartId,
          title: chartId,
          category: 'cost-markup',
          categoryLabel: 'Pricing & Margin',
          type: 'line',
          unit: 'value',
          unitLabel: 'value',
          description: chartId,
          insightTemplate: insight,
          lastUpdated: updatedAt,
          requiredFilters: ['corridor', 'amount'],
          tooltipCopy: chartId,
          sourceNotes: 'Local preview mock',
          defaultRange: '30d',
          plusRanges: ['90d'],
        },
    series,
    insight,
    dataAvailable: series.length > 0,
    updatedAt,
    source: 'gold_export',
  }
}

const buildChartsForCorridor = (corridor: MockCorridor, chartId: string, range: TimeRange, amount: number): ChartData => {
  const timestamps = buildTimestamps(getRangeDays(range))
  const baseRows = buildProviderRows(corridor, amount)
  const best = baseRows[0]
  const second = baseRows[1] ?? baseRows[0]
  const spreadRange = Math.max(...baseRows.map(row => row.markupBps)) - Math.min(...baseRows.map(row => row.markupBps))
  const seed = corridor.midMarketRate / 10
  const winnerSnapshots = buildWinnerSnapshots(corridor, amount, range)

  const trend = (base: number, amplitude: number, slope = 0) =>
    timestamps.map((_, index) => base + Math.sin(index / 2 + seed) * amplitude + slope * index)

  switch (chartId) {
    case 'all-in-cost':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(best.totalCostPct, 0.08, -0.005), 'all-in-cost', 'All-in cost', '#0B1F59'),
      ], 'Total transfer cost has remained within a narrow range over the selected window.')
    case 'fx-markup':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(best.markupBps, 6, -0.5), 'fx-markup', 'FX markup', '#2563EB'),
      ], 'FX markup is steady with a slight improvement over the selected window.')
    case 'fee-vs-markup':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(best.fee / amount * 10_000, 3, -0.12), 'fee-component', 'Fee', '#8CB8FF'),
        buildChartSeries(timestamps, trend(best.markupBps, 5, -0.4), 'markup-component', 'FX markup', '#2563EB'),
      ], 'Most of the transfer cost comes from FX markup rather than fixed fees.')
    case 'spread-distribution':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(Math.max(18, spreadRange * 0.42), 2.4, 0.05), 'p25', 'P25', '#8CB8FF'),
        buildChartSeries(timestamps, trend(Math.max(28, spreadRange * 0.64), 3.1, 0.08), 'p50', 'P50', '#2563EB'),
        buildChartSeries(timestamps, trend(Math.max(38, spreadRange * 0.82), 3.8, 0.1), 'p75', 'P75', '#0B1F59'),
      ], 'Provider spreads stay clustered, with the median moving modestly day to day.')
    case 'provider-winner': {
      return withMetadata(
        chartId,
        baseRows.map(row => ({
          id: normalizeId(row.provider),
          label: row.provider,
          color: row.color,
          points: winnerSnapshots.map(snapshot => ({
            t: snapshot.timestamp,
            v: snapshot.winner === row.provider ? 1 : 0,
            label: snapshot.winner === row.provider ? snapshot.detail : undefined,
          })),
        })),
        `${best.provider} has led most publication snapshots in the selected period.`,
      )
    }
    case 'leader-change-frequency':
      {
        const leaderChanges = buildLeaderChangesFromSnapshots(winnerSnapshots)
        return withMetadata(chartId, [
          {
            id: 'leader-flips',
            label: 'Leader changes',
            color: '#2563EB',
            points: leaderChanges.map(point => ({
              t: point.timestamp,
              v: point.changed,
            })),
          },
        ], 'Leadership changes remain limited, which suggests stable provider ranking.')
      }
    case 'leader-edge':
      return withMetadata(chartId, [
        {
          id: 'leader-edge',
          label: 'Leader edge',
          color: '#0B1F59',
          points: winnerSnapshots.map(snapshot => ({
            t: snapshot.timestamp,
            v: snapshot.edgeBps,
            label: `${snapshot.winner} leads ${snapshot.runner} by ${snapshot.edgeBps} bps`,
          })),
        },
      ], 'The winning provider keeps a measurable edge over the runner-up.')
    case 'pass-through-latency':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(28, 4.5, -0.25), 'latency', 'Latency', '#2563EB'),
      ], 'Provider pricing updates are flowing through within the same day.')
    case 'quote-success':
      return withMetadata(chartId, baseRows.slice(0, 3).map((row, index) =>
        buildChartSeries(timestamps, trend(98 - index * 1.5, 0.4, 0.02), normalizeId(row.provider), row.provider, providerColor(row.provider)),
      ), 'Quote coverage is healthy across the strongest providers.')
    case 'provider-availability':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(baseRows.length - 0.2, 0.4, 0).map(value => Math.max(1, Math.round(value))), 'provider-count', 'Providers', '#2563EB'),
      ], 'Provider availability is stable across the selected corridor.')
    case 'data-freshness':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(18, 3, -0.1).map(value => Math.max(4, value)), 'freshness-p50', 'P50', '#10B981'),
        buildChartSeries(timestamps, trend(42, 6, -0.15).map(value => Math.max(10, value)), 'freshness-p95', 'P95', '#F59E0B'),
      ], 'Data freshness is well within the expected collection cadence.')
    case 'corridor-liquidity':
      return withMetadata(chartId, [
        buildChartSeries(timestamps, trend(78, 5, 0.2).map(value => Math.max(50, value)), 'liquidity', 'Liquidity', '#2563EB'),
      ], 'Liquidity remains solid enough to compare providers like for like.')
    default:
      return withMetadata(chartId, [], 'No preview data available for this chart.')
  }
}

const percentile = (values: number[], ratio: number) => {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))
  return sorted[index]
}

const buildOverview = (corridor: MockCorridor, amount: number): PulseOverview => {
  const rows = buildProviderRows(corridor, amount).sort((left, right) => right.recipientGets - left.recipientGets)
  const delivered = rows.map(row => row.recipientGets)
  const spreadRange = Math.max(...rows.map(row => row.markupBps)) - Math.min(...rows.map(row => row.markupBps))
  return {
    tiles: [
      {
        id: 'market-spread',
        label: 'Market spread',
        value: `${spreadRange} bps`,
        delta: '-4 bps',
        deltaType: 'positive',
        deltaLabel: 'vs 7d',
        tooltip: 'Difference between the most and least expensive provider in basis points.',
        icon: 'activity',
      },
      {
        id: 'bestRecipientGets',
        label: 'Best recipient gets',
        value: formatRecipient(rows[0].recipientGets, corridor.toCode),
        delta: '+0.6%',
        deltaType: 'positive',
        deltaLabel: 'vs 7d',
        tooltip: 'Highest delivered amount among active providers.',
        icon: 'trophy',
      },
      {
        id: 'worst-price',
        label: 'Lowest recipient gets',
        value: formatRecipient(rows[rows.length - 1].recipientGets, corridor.toCode),
        delta: '-0.2%',
        deltaType: 'negative',
        deltaLabel: 'vs 7d',
        tooltip: 'Lowest delivered amount among active providers.',
        icon: 'arrow-down',
      },
      {
        id: 'median-rate',
        label: 'Median recipient gets',
        value: formatRecipient(percentile(delivered, 0.5), corridor.toCode),
        delta: '+0.1%',
        deltaType: 'positive',
        deltaLabel: 'vs 7d',
        tooltip: 'Median delivered amount across active providers.',
        icon: 'bar-chart-2',
      },
    ],
    charts: ['all-in-cost', 'fx-markup', 'fee-vs-markup', 'spread-distribution'],
    lastUpdated: nowIso(),
    corridorName: corridor.label,
  }
}

const buildSnapshotSummary = (corridor: MockCorridor, amount: number): PulseSnapshotSummary => {
  const rows = buildProviderRows(corridor, amount).sort((left, right) => right.recipientGets - left.recipientGets)
  const best = rows[0]
  return {
    kpis: [
      {
        id: 'bestRecipientGets',
        label: 'Best recipient gets',
        value: formatRecipient(best.recipientGets, corridor.toCode),
        delta: '+0.6%',
        deltaType: 'positive',
        tooltip: 'Highest delivered amount across active providers.',
      },
      {
        id: 'total-cost',
        label: 'Total cost',
        value: `${best.totalCostPct.toFixed(2)}%`,
        delta: '-6 bps',
        deltaType: 'positive',
        tooltip: 'Total transfer cost as a share of the send amount.',
      },
      {
        id: 'best-provider',
        label: 'Best provider',
        value: best.provider,
        delta: '',
        deltaType: 'neutral',
        tooltip: 'Current provider delivering the strongest value at this benchmark.',
      },
      {
        id: 'volatility',
        label: 'Volatility',
        value: `${corridor.volatilityBps} bps`,
        delta: '-3 bps',
        deltaType: 'positive',
        tooltip: 'Observed pricing movement across the most recent publication window.',
      },
      {
        id: 'confidence',
        label: 'Confidence',
        value: `${Math.round(corridor.confidence * 100)}%`,
        delta: '',
        deltaType: 'neutral',
        tooltip: 'Coverage confidence for the current corridor and benchmark profile.',
      },
    ],
    quotesInRange: corridor.dataPoints ?? 0,
    providersIncluded: rows.length,
    methodsIncluded: ['bank'],
    leader: best.provider,
    lastUpdated: nowIso(),
  }
}

const buildMarketSnapshot = (corridor: MockCorridor, amount: number) => {
  const quotes = buildProviderRows(corridor, amount)
  return {
    quotes: quotes.map(row => ({
      provider: row.provider,
      color: row.color,
      recipientGets: row.recipientGets,
      fee: row.fee,
      rate: row.rate,
      markupBps: row.markupBps,
      speed: row.speed,
      isPromo: row.isPromo,
      promoText: row.promoText,
    })),
    midMarketRate: corridor.midMarketRate,
    currency: corridor.toCode,
    amount,
    lastUpdated: nowIso(),
  }
}

const buildBenchmarking = (corridor: MockCorridor, amount: number): PulseProviderBenchmarkRow[] =>
  buildProviderRows(corridor, amount)
    .sort((left, right) => right.recipientGets - left.recipientGets)
    .map(row => ({
      provider: row.provider,
      deliveredAmount: row.recipientGets,
      totalCost: row.totalCostPct,
      totalCostBps: Math.round(row.totalCostPct * 100),
      fee: row.fee,
      markupBps: row.markupBps,
      speed: row.speed,
      winRate: row.winRate,
      reliability: row.reliability,
    }))

const buildHeatmap = (corridor: MockCorridor, amount: number) => {
  const snapshots = buildWinnerSnapshots(corridor, amount, '30d')
  const providerStats: Record<string, { wins: number, percentage: number }> = {}

  const days = snapshots.map((snapshot) => {
    providerStats[snapshot.winner] = providerStats[snapshot.winner] ?? { wins: 0, percentage: 0 }
    providerStats[snapshot.winner].wins += 1
    return {
      date: new Date(snapshot.timestamp).toISOString().slice(0, 10),
      timestamp: snapshot.timestamp,
      winner: snapshot.winner,
      winnerColor: snapshot.winnerColor,
      savings: round(snapshot.edgeBps / 100, 2),
    }
  })

  Object.values(providerStats).forEach((entry) => {
    entry.percentage = round((entry.wins / days.length) * 100, 1)
  })

  return {
    days,
    providerStats,
    lastUpdated: nowIso(),
  }
}

const buildSmartSend = (corridor: MockCorridor) => {
  const level = corridor.volatilityBps < 30 ? 'great' : corridor.volatilityBps < 50 ? 'good' : 'fair'
  return {
    level,
    message: level === 'great'
      ? 'Current pricing is attractive for this corridor.'
      : 'Pricing is stable enough to compare providers confidently.',
    rationale: [
      'Top providers are tightly clustered around the benchmark.',
      'Coverage confidence is strong enough to compare like-for-like.',
      'Recent volatility remains within a normal range for this corridor.',
    ],
    lastUpdated: nowIso(),
    recommendation: 'Compare providers now while pricing is stable.',
    currentRate: corridor.midMarketRate,
    avg30Day: round(corridor.midMarketRate * 0.997, 4),
    percentFromAvg: round(0.3, 2),
    confidence: corridor.confidence,
    percentile: Math.round(corridor.confidence * 100),
  }
}

const buildNarrative = (corridor: MockCorridor, amount: number) => {
  const origin = COUNTRY_NAME_BY_CODE[corridor.sourceCountry ?? ''] ?? corridor.sourceCountry
  const destination = COUNTRY_NAME_BY_CODE[corridor.destCountry ?? ''] ?? corridor.destCountry
  return {
    summary: `${origin} to ${destination} is showing stable bank-transfer pricing at the $${amount} benchmark. Provider coverage is deep enough to compare leaders on recipient value rather than isolated promo quotes.`,
    generatedAt: nowIso(),
    source: 'local_mock_preview',
    dataAvailable: true,
    updatedAt: nowIso(),
  }
}

const buildCoverageSummary = (corridor: MockCorridor): PulseCoverageSummary => ({
  quotesInRange: corridor.dataPoints ?? 0,
  providersIncluded: corridor.providers.length,
  methodsIncluded: ['bank'],
  lastUpdated: nowIso(),
})

const buildMethodCoverage = (corridor: MockCorridor): MethodCoverageRow[] =>
  corridor.providers.map(provider => ({
    provider: provider.name,
    bank: true,
    speed: provider.speed,
  }))

const buildCoverageByCurrency = (corridor: MockCorridor) => ({
  success: true,
  date: new Date().toISOString().slice(0, 10),
  updatedAt: nowIso(),
  rows: [
    { sendCurrency: corridor.fromCode, corridorsTotal: 6, corridorsSuppressed: 0, corridorsAvailable: 6, corridorsWith3PlusProviders: 6, corridorsWith1to2Providers: 0, corridorsWith0Providers: 0, weightConfidenceP10: 0.72, weightConfidenceP50: 0.84, weightConfidenceP90: 0.92 },
    { sendCurrency: 'GBP', corridorsTotal: 4, corridorsSuppressed: 1, corridorsAvailable: 3, corridorsWith3PlusProviders: 3, corridorsWith1to2Providers: 0, corridorsWith0Providers: 1, weightConfidenceP10: 0.55, weightConfidenceP50: 0.7, weightConfidenceP90: 0.82 },
    { sendCurrency: 'CAD', corridorsTotal: 3, corridorsSuppressed: 0, corridorsAvailable: 3, corridorsWith3PlusProviders: 2, corridorsWith1to2Providers: 1, corridorsWith0Providers: 0, weightConfidenceP10: 0.6, weightConfidenceP50: 0.77, weightConfidenceP90: 0.84 },
    { sendCurrency: 'AED', corridorsTotal: 3, corridorsSuppressed: 1, corridorsAvailable: 2, corridorsWith3PlusProviders: 1, corridorsWith1to2Providers: 1, corridorsWith0Providers: 1, weightConfidenceP10: 0.48, weightConfidenceP50: 0.66, weightConfidenceP90: 0.75 },
  ],
})

const buildCoverageGaps = (corridor: MockCorridor) => ({
  success: true,
  date: new Date().toISOString().slice(0, 10),
  updatedAt: nowIso(),
  sendCurrency: corridor.fromCode,
  methodProfile: 'standard_bank',
  amountBucket: 500,
  bin: 'low',
  rows: [
    {
      corridorId: corridor.corridorId,
      fromCountry: corridor.sourceCountry,
      toCountry: corridor.destCountry,
      sendCurrency: corridor.fromCode,
      recvCurrency: corridor.toCode,
      providerCount: corridor.providers.length,
      suppressionFlag: false,
      suppressionReason: null,
      weightConfidence: corridor.confidence,
      gap: {
        reason: 'freshness',
        rightsEligibleProviders: corridor.providers.length + 1,
        supportedProviders: corridor.providers.length,
        capabilityMissing: 0,
        capabilityUnsupported: 0,
        methodMismatch: 0,
        freshestQuoteAt: nowIso(),
        freshestQuoteAgeSeconds: 900,
        staleSeconds: 3600,
      },
    },
  ],
})

const buildTrueCost = (corridor: MockCorridor, amount: number) =>
  buildProviderRows(corridor, amount).map((row, index) => ({
    id: `${normalizeId(row.provider)}-${index}`,
    name: row.provider,
    fee: row.fee,
    feeAmount: row.fee,
    marginPct: round(row.markupBps / 100, 2),
    fxRate: row.rate,
    recipientGets: row.recipientGets,
    delivery: row.speed,
    speed: row.speed,
    reliability: row.reliability / 100,
    methods: ['bank'],
    bestFor: index === 0 ? 'Best delivered amount' : 'Reliable transfers',
    trueCost: {
      upfrontFee: row.fee,
      hiddenMarkup: round(amount * (row.markupBps / 10_000), 2),
      hiddenMarkupPercent: round(row.markupBps / 100, 2),
      totalCost: row.totalCost,
      totalCostPercent: row.totalCostPct,
      deltaFromBest: round(row.totalCost - buildProviderRows(corridor, amount)[0].totalCost, 2),
      deltaPercent: round(row.totalCostPct - buildProviderRows(corridor, amount)[0].totalCostPct, 2),
      midMarketRate: corridor.midMarketRate,
      providerRate: row.rate,
      spreadBps: row.markupBps,
    },
  }))

const buildBankComparison = (corridor: MockCorridor, amount: number) => {
  const bestProvider = buildProviderRows(corridor, amount).sort((left, right) => left.totalCost - right.totalCost)[0]
  const bankTotalCost = corridor.bankFee + amount * (corridor.bankMarkupBps / 10_000)
  const bestSpecialistTotalCost = bestProvider.totalCost
  const savings = round(bankTotalCost - bestSpecialistTotalCost, 2)
  return {
    bankMarkup: corridor.bankMarkupBps,
    bankFee: corridor.bankFee,
    bankTotalCost: round(bankTotalCost, 2),
    bestSpecialistMarkup: bestProvider.markupBps,
    bestSpecialistFee: bestProvider.fee,
    bestSpecialistTotalCost: round(bestSpecialistTotalCost, 2),
    bestSpecialistName: bestProvider.provider,
    savings,
    savingsPercent: round((savings / bankTotalCost) * 100, 2),
  }
}

const buildCostTrend = (corridor: MockCorridor, amount: number) => {
  const comparison = buildBankComparison(corridor, amount)
  const bestProvider = buildProviderRows(corridor, amount).sort((left, right) => right.recipientGets - left.recipientGets)[0]
  const timestamps = buildTimestamps(30, 12)
  const bankCostPct = comparison.bankTotalCost / amount * 100
  const specialistCostPct = comparison.bestSpecialistTotalCost / amount * 100
  const winnerSnapshots = buildWinnerSnapshots(corridor, amount, '30d')

  return timestamps.map((timestamp, index) => ({
    date: new Date(timestamp).toISOString().slice(0, 10),
    averageHiddenFee: round(bankCostPct + Math.sin(index / 2.4 + corridor.midMarketRate / 18) * 0.06 + index * 0.004, 2),
    bestProvider: bestProvider.provider,
    bestProviderCost: round(specialistCostPct + Math.cos(index / 2.1 + corridor.midMarketRate / 20) * 0.03 + index * 0.002, 2),
    marketLeaderDays: winnerSnapshots
      .slice(0, Math.min(winnerSnapshots.length, index + 2))
      .filter(snapshot => snapshot.winner === bestProvider.provider)
      .length,
  }))
}

const buildTableData = (corridor: MockCorridor, amount: number): TableData => {
  const rows = buildProviderRows(corridor, amount).map((row, index) => ({
    timestamp: Date.now() - index * 86_400_000,
    provider: row.provider,
    deliveredAmount: row.recipientGets,
    deliveredCurrency: corridor.toCode,
    fee: row.fee,
    feeCurrency: corridor.fromCode,
    rate: row.rate,
    markupBps: row.markupBps,
    provenance: 'verified' as const,
  }))

  return {
    columns: [
      { key: 'timestamp', label: 'Date', sortable: true, align: 'left', format: 'date' },
      { key: 'provider', label: 'Provider', sortable: true, align: 'left' },
      { key: 'deliveredAmount', label: 'Recipient gets', sortable: true, align: 'right', format: 'currency' },
      { key: 'deliveredCurrency', label: 'Currency', sortable: false, align: 'left' },
      { key: 'fee', label: 'Fee', sortable: true, align: 'right', format: 'currency' },
      { key: 'feeCurrency', label: 'Fee currency', sortable: false, align: 'left' },
      { key: 'rate', label: 'FX rate', sortable: true, align: 'right', format: 'number' },
      { key: 'markupBps', label: 'FX markup', sortable: true, align: 'right', format: 'bps' },
      { key: 'provenance', label: 'Source', sortable: false, align: 'left' },
    ],
    rows,
    totalRows: rows.length,
    page: 1,
    pageSize: rows.length,
  }
}

const buildIndicesSeries = (corridor: MockCorridor, days: number, amountBucket: number) => {
  const timestamps = buildTimestamps(days, Math.min(days, 30))
  const teerBase = round(corridor.midMarketRate * 1.01, 2)
  const rciBase = round(76 + corridor.confidence * 12, 1)
  const rviBase = corridor.volatilityBps
  const series = timestamps.map((timestamp, index) => ({
    date: new Date(timestamp).toISOString().slice(0, 10),
    teer: round(teerBase + Math.sin(index / 3) * 0.9 - index * 0.03, 2),
    rci: round(rciBase + Math.cos(index / 4) * 2.4 + index * 0.08, 1),
    rvi_bps: round(rviBase + Math.sin(index / 2.5) * 4 + index * 0.12, 1),
    providerCount: corridor.providers.length,
    suppressionFlag: false,
    suppressionReason: null,
    midMarketRate: corridor.midMarketRate,
    weightConfidence: corridor.confidence,
    weightWindowDays: 30,
  }))

  return {
    corridorId: corridor.corridorId,
    amountBucket,
    methodProfile: 'standard_bank',
    weightingModel: 'quality_weighted_v2',
    methodologyVersion: '2.2',
    lastUpdated: nowIso(),
    series,
    dataWindow: {
      requestedDays: days,
      availableDays: corridor.daysAvailable ?? 90,
      returnedDays: series.length,
      startDate: series[0]?.date ?? '',
      endDate: series[series.length - 1]?.date ?? '',
      capped: days > 30,
    },
  }
}

const buildIndicesHeadline = (corridor: MockCorridor, amountBucket: number) => {
  const source = buildIndicesSeries(corridor, 30, amountBucket).series
  const latest = source[source.length - 1]
  const point7 = source[Math.max(0, source.length - 8)]
  const point30 = source[0]
  const confidence = corridor.confidence >= 0.8 ? 'high' : corridor.confidence >= 0.6 ? 'medium' : 'low'

  return {
    teer: {
      value: latest?.teer ?? 0,
      delta7d: round((latest?.teer ?? 0) - (point7?.teer ?? 0), 2),
      delta30d: round((latest?.teer ?? 0) - (point30?.teer ?? 0), 2),
      confidence,
    },
    rci: {
      value: latest?.rci ?? 0,
      delta7d: round((latest?.rci ?? 0) - (point7?.rci ?? 0), 2),
      delta30d: round((latest?.rci ?? 0) - (point30?.rci ?? 0), 2),
    },
    rvi: {
      value: latest?.rvi_bps ?? 0,
      delta7d: round((latest?.rvi_bps ?? 0) - (point7?.rvi_bps ?? 0), 2),
      delta30d: round((latest?.rvi_bps ?? 0) - (point30?.rvi_bps ?? 0), 2),
    },
    lastUpdated: nowIso(),
  }
}

const buildIndicesMethodology = (corridor: MockCorridor) => {
  const suppressedIndex = corridor.confidence < 0.8 ? corridor.providers.length - 1 : -1
  const activeProviders = corridor.providers.filter((_, index) => index !== suppressedIndex)
  const rawWeights = activeProviders.map(provider => Math.max(1, 120 - provider.markupBps))
  const totalWeight = rawWeights.reduce((sum, weight) => sum + weight, 0)
  const roundedWeights = normalizeRoundedWeights(rawWeights.map(weight => weight / totalWeight))

  return {
    providers: corridor.providers.map((provider, index) => {
      const activeIndex = activeProviders.findIndex(activeProvider => activeProvider.name === provider.name)
      const suppressed = index === suppressedIndex
      return {
        name: provider.name,
        weight: suppressed ? 0 : roundedWeights[activeIndex] ?? 0,
        quoteCount: 110 - index * 9,
        freshness: `${12 + index * 4}m`,
        suppressed,
        suppressionReason: suppressed
          ? 'Coverage window below preferred freshness threshold'
          : undefined,
      }
    }),
    totalProviders: corridor.providers.length,
    contributingProviders: activeProviders.length,
    suppressedProviders: suppressedIndex >= 0 ? 1 : 0,
    weightConfidence: corridor.confidence,
    weightWindowDays: 30,
    methodologyVersion: '2.2',
  }
}

export const getPulseDevMockResponse = (path: string, query: QueryMap): unknown | null => {
  const corridor = getMockCorridor(query)
  const amount = getAmount(query)

  if (path === 'corridors') return MOCK_PULSE_CORRIDORS
  if (path === 'overview') return buildOverview(corridor, amount)
  if (path === 'snapshot-summary') return buildSnapshotSummary(corridor, amount)
  if (path === 'smart-send') return buildSmartSend(corridor)
  if (path === 'narrative') return buildNarrative(corridor, amount)
  if (path === 'market-snapshot') return buildMarketSnapshot(corridor, amount)
  if (path === 'providers/benchmarking') return buildBenchmarking(corridor, amount)
  if (path === 'providers/heatmap') return buildHeatmap(corridor, amount)
  if (path === 'coverage-summary') return buildCoverageSummary(corridor)
  if (path === 'method-coverage') return buildMethodCoverage(corridor)
  if (path === 'coverage-by-currency') return buildCoverageByCurrency(corridor)
  if (path === 'coverage-by-currency/gaps') return buildCoverageGaps(corridor)
  if (path === 'true-cost') return buildTrueCost(corridor, amount)
  if (path === 'bank-comparison') return buildBankComparison(corridor, amount)
  if (path === 'cost-trend') return buildCostTrend(corridor, amount)
  if (path === 'table') return buildTableData(corridor, amount)
  if (path === 'charts') {
    const chartIds = toStringValue(query.chart_ids).split(',').map(value => value.trim()).filter(Boolean)
    const range = (toStringValue(query.range) || '30d') as TimeRange
    return {
      success: true,
      updatedAt: nowIso(),
      dataAvailable: true,
      charts: chartIds.map(chartId => ({
        id: chartId,
        dataAvailable: true,
        updatedAt: nowIso(),
        source: 'gold_export',
        chart: buildChartsForCorridor(corridor, chartId, range, amount),
      })),
    }
  }
  if (path.startsWith('charts/')) {
    const chartId = path.slice('charts/'.length)
    const range = (toStringValue(query.range) || '30d') as TimeRange
    return buildChartsForCorridor(corridor, chartId, range, amount)
  }

  return null
}

export const getIndicesDevMockResponse = (path: string, query: QueryMap): unknown | null => {
  const corridor = getMockCorridor(query)
  const amountBucket = getAmount(query)
  const days = Math.max(7, Math.min(180, Number(toStringValue(query.days) || 30)))

  if (path === 'series') return buildIndicesSeries(corridor, days, amountBucket)
  if (path === 'headline') return buildIndicesHeadline(corridor, amountBucket)
  if (path === 'methodology') return buildIndicesMethodology(corridor)

  return null
}
