import type { FastifyInstance } from 'fastify'

import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { createTtlCache } from '../../../shared/cache'
import { buildChartData, pulseDefaults } from '../../../shared/pulse-defaults'
import {
  buildPulseCacheKeyCandidates,
  normalizePulseRange,
  type PulseCacheFilters,
} from '../../../shared/pulse-cache-keys'
import { getExportTierInfo, TIER_1_CADENCE_SECONDS, TIER_2_CADENCE_SECONDS } from '../../../shared/corridor-tiers'
import { requireEntitlement } from '../plugins/auth-plugin'
import { ValidationError } from '../../../shared/errors'
import type { PlaneAContainer } from '../container'

const logger = createLogger('plane-a.pulse')
const pulseIndicesCache = createTtlCache({ namespace: 'plane_a:pulse_indices' })
const pulseCorridorsCache = createTtlCache({ namespace: 'plane_a:pulse_corridors' })
const INDICES_AMOUNT_BUCKET = Number(process.env.GOLD_INDICES_AMOUNT_BUCKET || 500)
const INDEX_CHART_IDS = new Set(['all-in-cost', 'fx-markup', 'volatility-pulse'])

const arrow = '\u2192'

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toIsoString = (value: unknown): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value as string)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const parsePayload = (payload: unknown): unknown => {
  if (typeof payload !== 'string') return payload
  try {
    return JSON.parse(payload)
  } catch (error) {
    logger.debug('pulse_payload_parse_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return payload
  }
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeChartPayload = (chartId: string, payload: unknown, updatedAt: string) => {
  const fallback = buildChartData(chartId)
  if (!isObject(payload)) {
    return {
      ...fallback,
      metadata: {
        ...fallback.metadata,
        lastUpdated: updatedAt || fallback.metadata.lastUpdated,
      },
    }
  }

  const metadata = isObject(payload.metadata)
    ? { ...fallback.metadata, ...(payload.metadata as Record<string, unknown>) }
    : { ...fallback.metadata }
  const series = Array.isArray(payload.series) ? payload.series : fallback.series
  const insight = typeof payload.insight === 'string' ? payload.insight : fallback.insight
  const annotations = Array.isArray(payload.annotations) ? payload.annotations : fallback.annotations

  return {
    metadata: {
      ...metadata,
      lastUpdated: updatedAt || metadata.lastUpdated || fallback.metadata.lastUpdated,
    },
    series,
    ...(annotations ? { annotations } : {}),
    insight,
  }
}

const resolveRangeDays = (range?: string | null): number => {
  const normalized = normalizePulseRange(range) ?? '30d'
  switch (normalized) {
    case '7d':
      return 7
    case '90d':
      return 90
    case '365d':
      return 365
    default:
      return 30
  }
}

const resolveIndicesMethodProfile = (
  filters: PulseCacheFilters,
): 'standard_bank' | 'standard_card' | 'cash_pickup' | null => {
  const payin = typeof filters.payin === 'string' ? filters.payin.toLowerCase() : null
  const payout = typeof filters.payout === 'string' ? filters.payout.toLowerCase() : null

  if (payout === 'cash') return 'cash_pickup'
  if (payout === 'bank' || payout === null) {
    if (payin === 'card') return 'standard_card'
    if (payin === 'bank' || payin === null) return 'standard_bank'
  }

  return null
}

const getIndicesCacheTtlMs = (corridorId?: string | null) => {
  if (!corridorId) return 60 * 60 * 1000
  const info = getExportTierInfo(corridorId, 2)
  const cadenceMinutes = Math.round(
    (info.collectionTier === 'tier_1' ? TIER_1_CADENCE_SECONDS : TIER_2_CADENCE_SECONDS) / 60,
  )
  return Math.max(1, cadenceMinutes) * 60 * 1000
}

const toFlagEmoji = (code?: string | null): string => {
  if (!code || typeof code !== 'string') return String.fromCodePoint(0x1f30d)
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 2) return String.fromCodePoint(0x1f30d)
  const base = 0x1f1e6
  return String.fromCodePoint(
    base + normalized.charCodeAt(0) - 65,
    base + normalized.charCodeAt(1) - 65,
  )
}

const formatCorridorLabelFromSlug = (slug?: string | null): string | undefined => {
  if (!slug || typeof slug !== 'string') return undefined
  const parts = slug.split('-').map((part) => part.trim().toUpperCase()).filter(Boolean)
  if (parts.length !== 2) return undefined
  return `${parts[0]} ${arrow} ${parts[1]}`
}

const parseCurrencyPairFromSlug = (slug?: string | null) => {
  if (!slug || typeof slug !== 'string') return null
  const parts = slug.split('-').map((part) => part.trim().toUpperCase()).filter(Boolean)
  if (parts.length !== 2) return null
  return { base: parts[0], quote: parts[1] }
}

const parseCorridorFromId = (corridorId?: string | null) => {
  if (!corridorId || typeof corridorId !== 'string') return null
  const parts = corridorId.split('-').map((part) => part.trim()).filter(Boolean)
  if (parts.length < 4) return null
  return {
    fromCountry: parts[0].toUpperCase(),
    toCountry: parts[1].toUpperCase(),
    sendCurrency: parts[2].toUpperCase(),
    recvCurrency: parts[3].toUpperCase(),
  }
}

const resolveIndicesCorridorId = async (
  goldIndicesRepository: PlaneAContainer['repositories']['goldIndices'],
  filters: PulseCacheFilters,
  explicitCorridorId?: string | null,
): Promise<string | null> => {
  if (explicitCorridorId) return explicitCorridorId

  const corridorFromId = parseCorridorFromId(filters.corridor ?? null)
  if (corridorFromId) {
    return corridorFromId
      ? `${corridorFromId.fromCountry}-${corridorFromId.toCountry}-${corridorFromId.sendCurrency}-${corridorFromId.recvCurrency}`
      : null
  }

  const pair = parseCurrencyPairFromSlug(filters.corridor ?? null)
  if (!pair) return null

  return await goldIndicesRepository.resolveCorridorId({
    sourceCurrency: pair.base,
    destCurrency: pair.quote,
  })
}

const buildIndicesChartSeries = (
  chartId: string,
  rows: Array<{
    date: Date | string
    teer_rate: number | null
    rci_ratio: number | null
    rvi_bps: number | null
    mid_market_rate: number | null
    suppression_flag: boolean
  }>,
): Array<{ id: string; label: string; color: string; points: Array<{ t: number; v: number }> }> => {
  const points = rows
    .filter((row) => !row.suppression_flag)
    .map((row) => {
      const date = row.date instanceof Date ? row.date : new Date(row.date)
      const timestamp = Number.isNaN(date.getTime()) ? Date.now() : date.getTime()

      if (chartId === 'all-in-cost') {
        const value = row.rci_ratio !== null ? row.rci_ratio * 100 : null
        return value !== null ? { t: timestamp, v: value } : null
      }
      if (chartId === 'fx-markup') {
        if (!row.mid_market_rate || !row.teer_rate || row.mid_market_rate <= 0) return null
        const value = ((row.mid_market_rate - row.teer_rate) / row.mid_market_rate) * 10000
        return Number.isFinite(value) ? { t: timestamp, v: value } : null
      }
      if (chartId === 'volatility-pulse') {
        const value = row.rvi_bps
        return value !== null ? { t: timestamp, v: value } : null
      }

      return null
    })
    .filter((point): point is { t: number; v: number } => Boolean(point))

  if (!points.length) return []

  return [
    {
      id: chartId,
      label: chartId,
      color: '#2563eb',
      points,
    },
  ]
}

const loadPulseEntry = async (
  pulseCacheRepository: PlaneAContainer['repositories']['pulseCache'],
  baseKey: string,
  filters: PulseCacheFilters,
  fallback: unknown,
): Promise<{ payload: unknown; updatedAt: string }> => {
  try {
    const candidates = buildPulseCacheKeyCandidates(baseKey, filters)
    const entries = await pulseCacheRepository.getEntries(candidates)
    const entryMap = new Map(entries.map((entry) => [entry.key, entry]))
    const entry = candidates.map((key) => entryMap.get(key)).find(Boolean)
    // Do not fabricate freshness. If Gold cache is missing, updatedAt must be empty.
    const updatedAt = toIsoString(entry?.updated_at) || ''
    if (!entry) {
      return { payload: fallback, updatedAt }
    }
    const payload = parsePayload(entry.payload)
    return {
      payload: payload ?? fallback,
      updatedAt,
    }
  } catch (error) {
    logger.warn('pulse_cache_load_failed', {
      key: baseKey,
      error: error instanceof Error ? error.message : String(error),
    })
    return { payload: fallback, updatedAt: '' }
  }
}

const loadIndicesChartData = async (
  goldIndicesRepository: PlaneAContainer['repositories']['goldIndices'],
  chartId: string,
  filters: PulseCacheFilters,
  query: Record<string, unknown>,
): Promise<ReturnType<typeof buildChartData>> => {
  const fallback = buildChartData(chartId)
  const explicitCorridorId = typeof query.corridor_id === 'string' ? query.corridor_id : null
  const corridorId = await resolveIndicesCorridorId(goldIndicesRepository, filters, explicitCorridorId)
  const methodProfile = resolveIndicesMethodProfile(filters)

  if (!corridorId || !methodProfile) {
    return fallback
  }

  const rangeDays = resolveRangeDays(filters.range)
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setUTCDate(endDate.getUTCDate() - (rangeDays - 1))

  const cacheKey = [
    'indices',
    chartId,
    corridorId,
    methodProfile,
    INDICES_AMOUNT_BUCKET,
    rangeDays,
    endDate.toISOString().slice(0, 10),
  ].join(':')

  const cached = await pulseIndicesCache.get(cacheKey)
  if (cached) {
    return cached as ReturnType<typeof buildChartData>
  }

  const rows = await goldIndicesRepository.getIndicesSeries({
    corridorId,
    amountBucket: INDICES_AMOUNT_BUCKET,
    methodProfile,
    startDate,
    endDate,
  })

  const series = buildIndicesChartSeries(chartId, rows)
  const lastUpdated = rows.reduce<Date | null>((latest, row) => {
    if (!row.created_at) return latest
    if (!latest || row.created_at > latest) return row.created_at
    return latest
  }, null)

  const response = {
    ...fallback,
    series,
    metadata: {
      ...fallback.metadata,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : fallback.metadata.lastUpdated,
    },
  }

  const ttlMs = getIndicesCacheTtlMs(corridorId)
  await pulseIndicesCache.set(cacheKey, response, ttlMs)
  return response
}

const buildPulseFilters = (query: Record<string, unknown>): PulseCacheFilters => {
  const corridor = typeof query.corridor === 'string' ? query.corridor : null
  const timeframe = typeof query.timeframe === 'string' && query.timeframe.trim()
    ? query.timeframe
    : '30d'
  const range = typeof query.range === 'string' ? query.range : null
  const amountRaw = typeof query.amount === 'string' || typeof query.amount === 'number'
    ? Number(query.amount)
    : null
  const payin = typeof query.fundingMethod === 'string'
    ? query.fundingMethod
    : typeof query.payin === 'string'
      ? query.payin
      : null
  const payout = typeof query.payoutMethod === 'string'
    ? query.payoutMethod
    : typeof query.payout === 'string'
      ? query.payout
      : null

  return {
    corridor,
    timeframe,
    range,
    amount: Number.isFinite(amountRaw) ? amountRaw : null,
    payin,
    payout,
  }
}

const deriveMethodsIncluded = (payload: unknown): string[] => {
  if (!Array.isArray(payload)) return []
  const methods = new Set<string>()
  for (const row of payload) {
    if (!isObject(row)) continue
    const payin = typeof row.payin_method === 'string' ? row.payin_method : ''
    const payout = typeof row.payout_method === 'string' ? row.payout_method : ''
    if (payin.includes('bank')) methods.add('bank')
    if (payin.includes('card')) methods.add('card')
    if (payin.includes('cash')) methods.add('cash')
    if (payout.includes('bank')) methods.add('bank')
    if (payout.includes('cash')) methods.add('cash')
    if (payout.includes('wallet')) methods.add('wallet')
  }
  return Array.from(methods.values())
}

const mapMethodCoverage = (payload: unknown) => {
  if (Array.isArray(payload)) {
    const hasProvider = payload.some((row) => isObject(row) && 'provider' in row)
    if (hasProvider) return payload
    const methods = deriveMethodsIncluded(payload)
    return [
      {
        provider: 'All Providers',
        bank: methods.includes('bank'),
        cash: methods.includes('cash'),
        wallet: methods.includes('wallet'),
        card: methods.includes('card'),
        speed: 'Varies',
      },
    ]
  }
  return pulseDefaults.methodCoverage
}

const mapCorridors = (payload: unknown) => {
  if (Array.isArray(payload)) {
    const isOption = payload.every(
      (row) => isObject(row) && typeof row.value === 'string' && typeof row.label === 'string',
    )
    if (isOption) return payload

    return payload
      .map((row) => {
        if (!isObject(row)) return null
        const sendCurrency = String(row.send_currency || '').toUpperCase()
        const recvCurrency = String(row.recv_currency || '').toUpperCase()
        if (!sendCurrency || !recvCurrency) return null
        const value = `${sendCurrency.toLowerCase()}-${recvCurrency.toLowerCase()}`
        const corridorId = typeof row.corridor_id === 'string' ? row.corridor_id : undefined
        const sourceCountry = typeof row.from_country === 'string' ? row.from_country.toUpperCase() : ''
        const destCountry = typeof row.to_country === 'string' ? row.to_country.toUpperCase() : ''
        const lastUpdated = toIsoString(row.last_updated) || null

        return {
          corridorId,
          slug: value,
          value,
          label: `${sendCurrency} ${arrow} ${recvCurrency}`,
          sourceCountry: sourceCountry || undefined,
          destCountry: destCountry || undefined,
          sourceCurrency: sendCurrency,
          destCurrency: recvCurrency,
          fromFlag: toFlagEmoji(sourceCountry),
          toFlag: toFlagEmoji(destCountry),
          fromCode: sendCurrency,
          toCode: recvCurrency,
          lastUpdated,
        }
      })
      .filter(Boolean)
  }
  return pulseDefaults.corridors
}

const mapCoverageSummary = (
  payload: unknown,
  updatedAt: string,
  methodCoverage: unknown,
  overviewPayload: unknown,
  snapshotPayload: unknown,
) => {
  if (isObject(payload) && 'quotesInRange' in payload) {
    const typed = payload as Record<string, unknown>
    return {
      ...typed,
      lastUpdated: typed.lastUpdated || updatedAt,
    }
  }

  const overview = isObject(overviewPayload) ? overviewPayload : {}
  const snapshot = isObject(snapshotPayload) ? snapshotPayload : {}
  const quotesInRange = toNumber(
    snapshot.total_quotes ?? overview.corridors_with_quotes ?? 0,
    0,
  )
  const providersIncluded = toNumber(
    snapshot.unique_providers ?? overview.active_providers ?? 0,
    0,
  )
  const methodsIncluded = deriveMethodsIncluded(methodCoverage)
  return {
    quotesInRange,
    providersIncluded,
    methodsIncluded,
    lastUpdated: updatedAt,
  }
}

const mapSnapshotSummary = (
  payload: unknown,
  updatedAt: string,
  methodCoverage: unknown,
  providerBenchmarking: unknown,
) => {
  if (isObject(payload) && 'kpis' in payload) {
    const typed = payload as Record<string, unknown>
    return {
      ...typed,
      lastUpdated: typed.lastUpdated || updatedAt,
    }
  }

  const snapshot = isObject(payload) ? payload : {}
  const quoteCount = toNumber(snapshot.total_quotes, 0)
  const providerCount = toNumber(snapshot.unique_providers, 0)
  const corridorCount = toNumber(snapshot.unique_corridors, 0)
  const methodsIncluded = deriveMethodsIncluded(methodCoverage)
  let leader = 'n/a'

  if (Array.isArray(providerBenchmarking)) {
    const top = providerBenchmarking
      .filter((row) => isObject(row))
      .sort((a, b) => toNumber((b as any).quote_count, 0) - toNumber((a as any).quote_count, 0))[0]
    if (top && isObject(top)) {
      leader = String(top.provider_name || top.provider_id || 'n/a')
    }
  }

  return {
    kpis: [
      {
        id: 'quotes-in-range',
        label: 'Quotes in Range',
        value: `${quoteCount}`,
        delta: 'n/a',
        deltaType: 'neutral',
        tooltip: 'Total quotes in the selected window.',
      },
      {
        id: 'active-providers',
        label: 'Active Providers',
        value: `${providerCount}`,
        delta: 'n/a',
        deltaType: 'neutral',
        tooltip: 'Providers with recent quotes.',
      },
      {
        id: 'active-corridors',
        label: 'Active Corridors',
        value: `${corridorCount}`,
        delta: 'n/a',
        deltaType: 'neutral',
        tooltip: 'Corridors with recent quotes.',
      },
    ],
    quotesInRange: quoteCount,
    providersIncluded: providerCount,
    methodsIncluded,
    leader,
    lastUpdated: updatedAt,
  }
}

const mapProviderBenchmarking = (payload: unknown, amount: number) => {
  if (Array.isArray(payload)) {
    const hasProviderName = payload.some((row) => isObject(row) && 'provider' in row)
    if (hasProviderName) return payload
    const maxCount = Math.max(
      1,
      ...payload.map((row) => (isObject(row) ? toNumber((row as any).quote_count, 0) : 0)),
    )
    return payload
      .filter((row) => isObject(row))
      .map((row) => {
        const record = row as Record<string, unknown>
        const avgRate = toNumber(record.avg_rate, 0)
        const avgFee = toNumber(record.avg_fee, 0)
        const freshness = toNumber(record.avg_freshness_minutes, 0)
        const quoteCount = toNumber(record.quote_count, 0)
        const deliveredAmount = avgRate * amount
        const totalCostBps = amount > 0 ? (avgFee / amount) * 10000 : 0
        const reliability = Math.max(0, Math.min(1, 1 - freshness / 120))
        return {
          provider: String(record.provider_name || record.provider_id || 'Unknown'),
          deliveredAmount,
          totalCost: avgFee,
          totalCostBps,
          fee: avgFee,
          markupBps: 0,
          speed: freshness ? `${Math.round(freshness)} min` : 'n/a',
          winRate: quoteCount / maxCount,
          reliability,
        }
      })
  }
  return pulseDefaults.providerBenchmarking
}

const mapEvents = (payload: unknown) => {
  if (Array.isArray(payload)) {
    const hasSeverity = payload.some((row) => isObject(row) && 'severity' in row)
    if (hasSeverity) return payload
    return payload
      .filter((row) => isObject(row))
      .map((row) => {
        const record = row as Record<string, unknown>
        const httpStatus = toNumber(record.http_status, 0)
        const blockReason = String(record.block_reason || '')
        const provider = String(record.provider_id || 'provider')
        const corridor = String(record.corridor_id || 'corridor')
        const severity = httpStatus >= 500 || blockReason ? 'high' : httpStatus >= 400 ? 'medium' : 'low'
        return {
          id: String(record.id || `${provider}-${corridor}-${httpStatus}`),
          // Never fabricate timestamps; missing created_at must surface as empty.
          timestamp: toIsoString(record.created_at) || '',
          severity,
          title: blockReason ? `Block: ${blockReason}` : `HTTP ${httpStatus}`,
          description: `${provider} on ${corridor}`,
          chartId: 'quote-success',
        }
      })
  }
  return pulseDefaults.events
}

const mapTableData = (payload: unknown, amount: number, page: number, pageSize: number) => {
  if (isObject(payload) && Array.isArray(payload.rows)) {
    const rows = payload.rows as any[]
    const totalRows = toNumber(payload.totalRows, rows.length)
    return {
      columns: payload.columns ?? pulseDefaults.table.columns,
      rows,
      totalRows,
      page,
      pageSize,
    }
  }

  if (Array.isArray(payload)) {
    const rows = payload
      .filter((row) => isObject(row))
      .map((row) => {
        const record = row as Record<string, unknown>
        const corridorId = String(record.corridor_id || record.corridor_label || '')
        const corridorInfo = parseCorridorFromId(corridorId)
        const recvCurrency = corridorInfo?.recvCurrency || 'USD'
        const rate = toNumber(record.avg_rate, 0)
        return {
          timestamp: Date.now(),
          provider: corridorId || 'Market',
          deliveredAmount: amount * rate,
          deliveredCurrency: recvCurrency,
          fee: toNumber(record.min_fee, 0),
          feeCurrency: 'USD',
          rate,
          markupBps: 0,
          provenance: 'observed',
        }
      })
    const totalRows = rows.length
    const start = Math.max(0, (page - 1) * pageSize)
    const pagedRows = rows.slice(start, start + pageSize)
    return {
      columns: pulseDefaults.table.columns,
      rows: pagedRows,
      totalRows,
      page,
      pageSize,
    }
  }

  const totalRows = pulseDefaults.table.rows.length
  const start = Math.max(0, (page - 1) * pageSize)
  const rows = pulseDefaults.table.rows.slice(start, start + pageSize)
  return {
    columns: pulseDefaults.table.columns,
    rows,
    totalRows,
    page,
    pageSize,
  }
}

const mapOverview = (
  overviewPayload: unknown,
  coveragePayload: unknown,
  snapshotPayload: unknown,
  updatedAt: string,
  corridorName?: string,
) => {
  if (isObject(overviewPayload) && Array.isArray((overviewPayload as any).tiles)) {
    const typed = overviewPayload as Record<string, unknown>
    return {
      ...typed,
      lastUpdated: typed.lastUpdated || updatedAt,
      corridorName: corridorName ?? typed.corridorName,
    }
  }

  const overview = isObject(overviewPayload) ? overviewPayload : {}
  const coverage = isObject(coveragePayload) ? coveragePayload : {}
  const snapshot = isObject(snapshotPayload) ? snapshotPayload : {}

  const coveragePct = toNumber(coverage.coverage_percentage, 0)
  const activeProviders = toNumber(
    snapshot.unique_providers ?? overview.active_providers ?? 0,
    0,
  )
  const corridorsLive = toNumber(
    overview.corridors_with_quotes ?? coverage.covered_corridors ?? 0,
    0,
  )
  const freshnessMinutes = toNumber(overview.avg_freshness_minutes, 0)

  return {
    tiles: [
      {
        id: 'coverage',
        label: 'Coverage',
        value: `${coveragePct.toFixed(1)}%`,
        delta: 'n/a',
        deltaType: 'neutral',
        deltaLabel: '24h',
        tooltip: 'Percent of corridors with recent quotes.',
        chartId: 'quote-success',
        icon: 'check',
      },
      {
        id: 'active-providers',
        label: 'Active Providers',
        value: `${activeProviders}`,
        delta: 'n/a',
        deltaType: 'neutral',
        deltaLabel: '24h',
        tooltip: 'Providers with fresh quotes.',
        chartId: 'provider-winner',
        icon: 'trophy',
      },
      {
        id: 'corridors-live',
        label: 'Active Corridors',
        value: `${corridorsLive}`,
        delta: 'n/a',
        deltaType: 'neutral',
        deltaLabel: '24h',
        tooltip: 'Corridors with recent quotes.',
        chartId: 'all-in-cost',
        icon: 'trending',
      },
      {
        id: 'avg-freshness',
        label: 'Avg Freshness',
        value: `${freshnessMinutes.toFixed(1)} min`,
        delta: 'n/a',
        deltaType: 'neutral',
        deltaLabel: 'p50',
        tooltip: 'Average quote age in minutes.',
        chartId: 'quote-success',
        icon: 'activity',
      },
    ],
    charts: pulseDefaults.overview.charts,
    lastUpdated: updatedAt,
    corridorName,
  }
}


const toDateOnly = (value: Date) => value.toISOString().split('T')[0]

type GoldTrackedCorridorRow = {
  corridor_id: string
  source_country: string
  dest_country: string
  source_currency: string
  dest_currency: string
  data_points: number
  last_updated: Date | null
  min_date: Date | null
  max_date: Date | null
}

const loadTrackedCorridorsFromGold = async (planeAPool: PlaneAContainer['pool']) => {
  const result = await query<GoldTrackedCorridorRow>(
    `SELECT
       corridor_id,
       SPLIT_PART(corridor_id, '-', 1) AS source_country,
       SPLIT_PART(corridor_id, '-', 2) AS dest_country,
       SPLIT_PART(corridor_id, '-', 3) AS source_currency,
       SPLIT_PART(corridor_id, '-', 4) AS dest_currency,
       COUNT(*)::int AS data_points,
       MAX(created_at) AS last_updated,
       MIN(date) AS min_date,
       MAX(date) AS max_date
     FROM gold_export.cdp_daily
     WHERE amount_bucket = $1
     GROUP BY corridor_id
     ORDER BY corridor_id`,
    [INDICES_AMOUNT_BUCKET],
    planeAPool,
  )

  const mapped = result.rows.map((row) => {
    const sourceCountry = row.source_country?.toUpperCase() || ''
    const destCountry = row.dest_country?.toUpperCase() || ''
    const sourceCurrency = row.source_currency?.toUpperCase() || ''
    const destCurrency = row.dest_currency?.toUpperCase() || ''
    const slug = `${sourceCurrency.toLowerCase()}-${destCurrency.toLowerCase()}`

    const tierInfo = getExportTierInfo(row.corridor_id, 2)
    const collectionCadenceMinutes = Math.round(
      ((tierInfo.collectionTier === 'tier_1' && !config.planeB?.disableTier1)
        ? TIER_1_CADENCE_SECONDS
        : TIER_2_CADENCE_SECONDS) / 60,
    )

    return {
      corridorId: row.corridor_id,
      slug,
      value: slug,
      label: `${sourceCurrency} ${arrow} ${destCurrency}`,
      sourceCountry: sourceCountry || undefined,
      destCountry: destCountry || undefined,
      sourceCurrency,
      destCurrency,
      fromFlag: toFlagEmoji(sourceCountry),
      toFlag: toFlagEmoji(destCountry),
      fromCode: sourceCurrency,
      toCode: destCurrency,
      minDate: row.min_date ? toDateOnly(row.min_date) : null,
      maxDate: row.max_date ? toDateOnly(row.max_date) : null,
      lastUpdated: row.last_updated ? row.last_updated.toISOString() : null,
      dataPoints: row.data_points ?? 0,
      dataTier: tierInfo.exportTier,
      collectionTier: tierInfo.collectionTier,
      collectionCadenceMinutes,
      exportCadenceMinutes: tierInfo.cadenceMinutes,
      isUsdOrigin: sourceCurrency === 'USD',
    }
  })

  // Dedupe by currency slug if multiple corridor_ids share a currency pair.
  type TrackedCorridor = (typeof mapped)[number]

  const bySlug = new Map<string, TrackedCorridor>()

  const getRank = (entry: TrackedCorridor) => {
    const usBias = entry.sourceCountry === 'US' ? 1 : 0
    const points = typeof entry.dataPoints == 'number' ? entry.dataPoints : 0
    const updatedAt = entry.lastUpdated ? new Date(entry.lastUpdated).getTime() : 0
    return [usBias, points, updatedAt]
  }

  for (const entry of mapped) {
    const existing = bySlug.get(entry.slug)
    if (!existing) {
      bySlug.set(entry.slug, entry)
      continue
    }

    const [usA, pointsA, updatedA] = getRank(entry)
    const [usB, pointsB, updatedB] = getRank(existing)

    if (usA != usB) {
      if (usA > usB) bySlug.set(entry.slug, entry)
      continue
    }
    if (pointsA != pointsB) {
      if (pointsA > pointsB) bySlug.set(entry.slug, entry)
      continue
    }
    if (updatedA > updatedB) {
      bySlug.set(entry.slug, entry)
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    const pointsA = typeof a.dataPoints == 'number' ? a.dataPoints : 0
    const pointsB = typeof b.dataPoints == 'number' ? b.dataPoints : 0
    if (pointsA != pointsB) return pointsB - pointsA

    const updatedA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0
    const updatedB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0
    if (updatedA != updatedB) return updatedB - updatedA

    return String(a.slug).localeCompare(String(b.slug))
  })
}

export const pulseRoutes = async (app: FastifyInstance) => {
  const { pool: planeAPool, repositories } = app.container
  const pulseCacheRepository = repositories.pulseCache
  const goldIndicesRepository = repositories.goldIndices
  const guard = { preHandler: requireEntitlement('pulse') }
  const loadPulse = (
    baseKey: string,
    filters: PulseCacheFilters,
    fallback: unknown,
  ) => loadPulseEntry(pulseCacheRepository, baseKey, filters, fallback)
  const loadIndices = (
    chartId: string,
    filters: PulseCacheFilters,
    query: Record<string, unknown>,
  ) => loadIndicesChartData(goldIndicesRepository, chartId, filters, query)

  app.get('/pulse/corridors', guard, async () => {
    const cacheKey = [
      'bucket',
      INDICES_AMOUNT_BUCKET,
      config.planeB?.disableTier1 ? 'tier1_off' : 'tier1_on',
    ].join(':')

    const cached = await pulseCorridorsCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const tracked = await loadTrackedCorridorsFromGold(planeAPool)
      if (tracked.length > 0) {
        await pulseCorridorsCache.set(cacheKey, tracked, 60 * 60 * 1000)
        return tracked
      }
      throw new Error('no_gold_corridors')
    } catch (error) {
      logger.warn('pulse_corridors_gold_load_failed', {
        error: error instanceof Error ? error.message : String(error),
      })

      const { payload } = await loadPulse('corridors', {}, pulseDefaults.corridors)
      const fallback = mapCorridors(payload)
      await pulseCorridorsCache.set(cacheKey, fallback, 10 * 60 * 1000)
      return fallback
    }
  })

  app.get('/pulse/overview', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const corridorName = formatCorridorLabelFromSlug(
      typeof request.query === 'object' && request.query ? (request.query as any).corridor : undefined,
    )
    const [overview, coverage, snapshot] = await Promise.all([
      loadPulse('overview', filters, null),
      loadPulse('coverage-summary', filters, null),
      loadPulse('snapshot-summary', filters, null),
    ])
    const updatedAt = overview.updatedAt
    const payload = mapOverview(
      overview.payload,
      coverage.payload,
      snapshot.payload,
      updatedAt,
      corridorName,
    )
    return {
      ...payload,
      dataAvailable: Boolean(updatedAt),
      updatedAt: updatedAt || null,
      source: updatedAt ? 'gold_cache' : 'none',
    }
  })

  app.get('/pulse/charts/:chartId', guard, async (request, _reply) => {
    const chartId = (request.params as { chartId?: string }).chartId
    if (!chartId) {
            throw new ValidationError('Invalid request', { details: { error: 'missing_chart_id' } })
    }
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    if (INDEX_CHART_IDS.has(chartId)) {
      const indices = await loadIndices(chartId, filters, (request.query ?? {}) as Record<string, unknown>)
      return {
        ...indices,
        dataAvailable: Array.isArray(indices.series) && indices.series.length > 0,
        updatedAt: indices.metadata?.lastUpdated || null,
        source: 'gold_export',
      }
    }
    const { payload, updatedAt } = await loadPulse(`chart:${chartId}`, filters, null)
    return {
      ...normalizeChartPayload(chartId, payload, updatedAt),
      dataAvailable: Boolean(updatedAt),
      updatedAt: updatedAt || null,
      source: updatedAt ? 'gold_cache' : 'none',
    }
  })

  app.get('/pulse/method-coverage', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('method-coverage', filters, pulseDefaults.methodCoverage)
    return mapMethodCoverage(payload)
  })

  app.get('/pulse/table', guard, async (request) => {
    const query = (request.query ?? {}) as Record<string, unknown>
    const amount = toNumber(query.amount, 1000)
    const page = Math.max(1, toNumber(query.page, 1))
    const pageSize = Math.max(1, toNumber(query.pageSize, 20))
    const filters = buildPulseFilters(query)
    const { payload } = await loadPulse('table', filters, pulseDefaults.table)
    return mapTableData(payload, amount, page, pageSize)
  })

  app.get('/pulse/hero', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse('hero', filters, pulseDefaults.hero)
    if (isObject(payload)) {
      return {
        ...payload,
        lastUpdated: (payload as any).lastUpdated || updatedAt,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return {
      ...pulseDefaults.hero,
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    }
  })

  app.get('/pulse/coverage-summary', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const [coverage, methodCoverage, overview, snapshot] = await Promise.all([
      loadPulse('coverage-summary', filters, pulseDefaults.coverageSummary),
      loadPulse('method-coverage', filters, pulseDefaults.methodCoverage),
      loadPulse('overview', filters, null),
      loadPulse('snapshot-summary', filters, null),
    ])
    const payload = mapCoverageSummary(
      coverage.payload,
      coverage.updatedAt,
      methodCoverage.payload,
      overview.payload,
      snapshot.payload,
    )
    return {
      ...payload,
      dataAvailable: Boolean(coverage.updatedAt),
      updatedAt: coverage.updatedAt || null,
      source: coverage.updatedAt ? 'gold_cache' : 'none',
    }
  })

  app.get('/pulse/snapshot-summary', guard, async (request) => {
    const query = (request.query ?? {}) as Record<string, unknown>
    const amount = toNumber(query.amount, 1000)
    const filters = buildPulseFilters(query)
    const [snapshot, methodCoverage, providerBenchmarking] = await Promise.all([
      loadPulse('snapshot-summary', filters, pulseDefaults.snapshotSummary),
      loadPulse('method-coverage', filters, pulseDefaults.methodCoverage),
      loadPulse('provider-benchmarking', filters, pulseDefaults.providerBenchmarking),
    ])
    const summary = mapSnapshotSummary(
      snapshot.payload,
      snapshot.updatedAt,
      methodCoverage.payload,
      providerBenchmarking.payload,
    )
    if (summary && isObject(summary) && !(summary as any).amount) {
      (summary as any).amount = amount
    }
    if (summary && isObject(summary)) {
      return {
        ...(summary as any),
        dataAvailable: Boolean(snapshot.updatedAt),
        updatedAt: snapshot.updatedAt || null,
        source: snapshot.updatedAt ? 'gold_cache' : 'none',
      }
    }
    return summary
  })

  app.get('/pulse/providers/benchmarking', guard, async (request) => {
    const query = (request.query ?? {}) as Record<string, unknown>
    const amount = toNumber(query.amount, 1000)
    const filters = buildPulseFilters(query)
    const { payload } = await loadPulse(
      'provider-benchmarking',
      filters,
      pulseDefaults.providerBenchmarking,
    )
    return mapProviderBenchmarking(payload, amount)
  })

  app.get('/pulse/events', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('events', filters, pulseDefaults.events)
    return mapEvents(payload)
  })

  app.get('/pulse/providers/heatmap', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse(
      'provider-heatmap',
      filters,
      pulseDefaults.providerHeatmap,
    )
    if (isObject(payload) && Array.isArray((payload as any).days)) {
      return {
        ...payload,
        lastUpdated: (payload as any).lastUpdated || updatedAt,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return {
      ...pulseDefaults.providerHeatmap,
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    }
  })

  app.get('/pulse/smart-send', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse('smart-send', filters, pulseDefaults.smartSend)
    if (isObject(payload)) {
      return {
        ...payload,
        lastUpdated: (payload as any).lastUpdated || updatedAt,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return {
      ...pulseDefaults.smartSend,
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    }
  })

  app.get('/pulse/market-snapshot', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse(
      'market-snapshot',
      filters,
      pulseDefaults.marketSnapshot,
    )
    if (isObject(payload)) {
      return {
        ...payload,
        lastUpdated: (payload as any).lastUpdated || updatedAt,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return {
      ...pulseDefaults.marketSnapshot,
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    }
  })

  app.get('/pulse/true-cost', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('true-cost', filters, pulseDefaults.trueCost)
    return Array.isArray(payload) ? payload : pulseDefaults.trueCost
  })

  app.get('/pulse/market-depth', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse('market-depth', filters, pulseDefaults.marketDepth)
    if (isObject(payload)) {
      return {
        ...payload,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return {
      ...pulseDefaults.marketDepth,
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    }
  })

  app.get('/pulse/arbitrage', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse('arbitrage', filters, pulseDefaults.arbitrage)
    if (isObject(payload)) {
      return {
        ...payload,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return pulseDefaults.arbitrage
  })

  app.get('/pulse/bank-comparison', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload, updatedAt } = await loadPulse(
      'bank-comparison',
      filters,
      pulseDefaults.bankComparison,
    )
    if (isObject(payload)) {
      return {
        ...payload,
        dataAvailable: Boolean(updatedAt),
        updatedAt: updatedAt || null,
        source: updatedAt ? 'gold_cache' : 'none',
      }
    }
    return {
      ...pulseDefaults.bankComparison,
      dataAvailable: false,
      updatedAt: null,
      source: 'none',
    }
  })

  app.get('/pulse/cost-trend', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('cost-trend', filters, pulseDefaults.costTrend)
    return Array.isArray(payload) ? payload : pulseDefaults.costTrend
  })

  app.get('/pulse/fx-rate-history', guard, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const pair = parseCurrencyPairFromSlug(filters.corridor)
    const fallback = {
      baseCurrency: pair?.base ?? null,
      quoteCurrency: pair?.quote ?? null,
      history: [],
      // Never pretend data is fresh when Gold cache is missing.
      lastUpdated: '',
    }

    const { payload, updatedAt } = await loadPulse('fx-rate-history', filters, fallback)
    if (isObject(payload) && 'history' in payload) {
      return {
        ...payload,
        lastUpdated: (payload as Record<string, unknown>).lastUpdated || updatedAt,
      }
    }
    return fallback
  })
}
