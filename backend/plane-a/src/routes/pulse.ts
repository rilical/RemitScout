import type { FastifyInstance } from 'fastify'

import { query } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { createTtlCache } from '../../../shared/cache'
import { buildChartData, pulseDefaults } from '../../../shared/pulse-defaults'
import {
  PULSE_AMOUNTS,
  PULSE_CHART_IDS,
  PULSE_PAYIN_METHODS,
  PULSE_PAYOUT_METHODS,
  buildPulseCacheKey,
  buildPulseCacheKeyCandidates,
  normalizePulseCorridor,
  normalizePulseMethod,
  normalizePulseTimeframe,
  normalizePulseRange,
  type PulseCacheFilters,
} from '../../../shared/pulse-cache-keys'
import { getExportTierInfo, TIER_1_CADENCE_SECONDS, TIER_2_CADENCE_SECONDS } from '../../../shared/corridor-tiers'
import { recordRequest } from '../../../shared/api-metrics'
import { requireEntitlement } from '../plugins/auth-plugin'
import { ValidationError } from '../../../shared/errors'
import type { PlaneAContainer } from '../container'

const logger = createLogger('plane-a.pulse')
const pulseIndicesCache = createTtlCache({ namespace: 'plane_a:pulse_indices' })
const pulseCorridorsCache = createTtlCache({ namespace: 'plane_a:pulse_corridors' })
const INDICES_AMOUNT_BUCKET = Number(process.env.GOLD_INDICES_AMOUNT_BUCKET || 500)
const INDEX_CHART_IDS = new Set([
  'all-in-cost',
  'fx-markup',
  'volatility-pulse',
  'indices-confidence',
  'indices-provider-count',
  'indices-suppression',
])
// Chart IDs that represent institutional "Pulse Pro" analysis surfaces (Enterprise only).
// Keep this in sync with the frontend Pulse chart registry types (stacked/scatter/matrix).
const PULSE_PRO_CHART_IDS = new Set(['provider-winner', 'quote-anomalies'])

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

const normalizeLowerToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s\-._/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

const payoutMethodsDefaultForScheduler = (payoutMethods: string[] | null): string[] => {
  if (!payoutMethods || payoutMethods.length === 0) return ['bank_deposit']
  return payoutMethods.map(normalizeLowerToken).filter(Boolean)
}

const capabilityAllowsPayout = (payoutMethods: string[] | null, requiredMethod: string): boolean => {
  const normalized = normalizeLowerToken(requiredMethod)
  if (!normalized) return true
  const methods = payoutMethodsDefaultForScheduler(payoutMethods)
  return methods.includes(normalized)
}

const resolvePayoutMethodForMethodProfile = (
  methodProfile: 'standard_bank' | 'standard_card' | 'cash_pickup',
): 'bank_deposit' | 'cash_pickup' => {
  if (methodProfile === 'cash_pickup') return 'cash_pickup'
  return 'bank_deposit'
}

type PulseScreenerRow = {
  corridorId: string
  slug: string
  label: string
  fromFlag: string
  toFlag: string
  sourceCountry?: string
  destCountry?: string
  sourceCurrency?: string
  destCurrency?: string
  dataAvailable: boolean
  updatedAt: string | null
  smartSendLevel: 'great' | 'good' | 'fair' | 'wait' | null
  bestProvider: string | null
  bestRecipientGets: number | null
  spreadRangeBps: number | null
  providerCount: number | null
  bankSavings: number | null
  bankSavingsPercent: number | null
  moverDeltaPct24h: number | null
  moverTimestampBucket: string | null
}

type PulseScreenerResponse = {
  success: true
  updatedAt: string | null
  rows: PulseScreenerRow[]
}

const normalizeCommaList = (value: string) => value
  .split(',')
  .map((part) => part.trim())
  .filter(Boolean)

const parseCorridorIdsParam = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => typeof item === 'string' ? normalizeCommaList(item) : [])
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return normalizeCommaList(value)
  }
  return []
}

const parseChartIdsParam = (value: unknown): string[] => {
  const raw = parseCorridorIdsParam(value)
  return raw
    .map((id) => id.trim())
    .filter(Boolean)
}

const parseBooleanParam = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true
    if (normalized === '0' || normalized === 'false' || normalized === 'no') return false
  }
  return fallback
}

const toSafeNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
    weight_confidence: number | null
    provider_count: number | null
    suppression_flag: boolean
    suppression_reason?: string | null
  }>,
): Array<{ id: string; label: string; color: string; points: Array<{ t: number; v: number }> }> => {
  const points: Array<{ t: number; v: number }> = []

  for (const row of rows) {
    const date = row.date instanceof Date ? row.date : new Date(row.date)
    const timestamp = Number.isNaN(date.getTime()) ? Date.now() : date.getTime()

    if (chartId === 'indices-suppression') {
      points.push({ t: timestamp, v: row.suppression_flag ? 1 : 0 })
      continue
    }

    if (chartId === 'indices-confidence') {
      if (row.weight_confidence === null) continue
      const value = row.weight_confidence * 100
      if (!Number.isFinite(value)) continue
      points.push({ t: timestamp, v: value })
      continue
    }

    if (chartId === 'indices-provider-count') {
      if (row.provider_count === null) continue
      const value = row.provider_count
      if (!Number.isFinite(value)) continue
      points.push({ t: timestamp, v: value })
      continue
    }

    // TEER/RCI/RVI indices points must not include suppressed days.
    if (row.suppression_flag) continue

    if (chartId === 'all-in-cost') {
      const value = row.rci_ratio !== null ? row.rci_ratio * 100 : null
      if (value === null) continue
      points.push({ t: timestamp, v: value })
      continue
    }

    if (chartId === 'fx-markup') {
      if (!row.mid_market_rate || !row.teer_rate || row.mid_market_rate <= 0) continue
      const value = ((row.mid_market_rate - row.teer_rate) / row.mid_market_rate) * 10000
      if (!Number.isFinite(value)) continue
      points.push({ t: timestamp, v: value })
      continue
    }

    if (chartId === 'volatility-pulse') {
      const value = row.rvi_bps
      if (value === null) continue
      points.push({ t: timestamp, v: value })
    }
  }

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

const buildSuppressionAnnotations = (rows: Array<{
  date: Date | string
  suppression_flag: boolean
  suppression_reason?: string | null
}>) => {
  const out: Array<{ t: number; label: string; type: 'event' }> = []

  for (const row of rows) {
    if (!row.suppression_flag) continue
    const date = row.date instanceof Date ? row.date : new Date(row.date)
    const timestamp = Number.isNaN(date.getTime()) ? Date.now() : date.getTime()
    const reason = typeof row.suppression_reason === 'string' ? row.suppression_reason.trim() : ''
    out.push({
      t: timestamp,
      label: reason ? `Suppressed: ${reason}` : 'Suppressed',
      type: 'event',
    })
  }

  return out
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
  const annotations = buildSuppressionAnnotations(rows)
  const lastUpdated = rows.reduce<Date | null>((latest, row) => {
    if (!row.created_at) return latest
    if (!latest || row.created_at > latest) return row.created_at
    return latest
  }, null)

  const response = {
    ...fallback,
    series,
    ...(annotations.length ? { annotations } : {}),
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
  const guardLite = { preHandler: requireEntitlement('pulse') }
  const guardPro = { preHandler: requireEntitlement('pulse_pro') }
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

  app.get('/pulse/corridors', guardLite, async () => {
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

  app.get('/pulse/screener', guardPro, async (request): Promise<PulseScreenerResponse> => {
    const startTime = Date.now()
    try {
      const queryParams = (request.query ?? {}) as Record<string, unknown>
      const corridorIdsRaw = parseCorridorIdsParam(queryParams.corridor_ids)
      const corridorIdsUnique = Array.from(new Set(corridorIdsRaw))
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
      if (corridorIdsUnique.length > 25) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'corridor_ids_limit_exceeded',
            limit: 25,
            received: corridorIdsUnique.length,
          },
        })
      }
      const corridorIds = corridorIdsUnique

      const includeMovers = parseBooleanParam(queryParams.include_movers, true)

      const timeframeRaw = typeof queryParams.timeframe === 'string' ? queryParams.timeframe : null
      const normalizedTimeframe = normalizePulseTimeframe(timeframeRaw)
      if (timeframeRaw && !normalizedTimeframe) {
        throw new ValidationError('Invalid request', { details: { error: 'invalid_timeframe' } })
      }
      const timeframe = normalizedTimeframe ?? '7d'

      const amountParamProvided = queryParams.amount !== undefined && queryParams.amount !== null && queryParams.amount !== ''
      const amountRaw = amountParamProvided ? toSafeNumber(queryParams.amount) : null
      if (amountParamProvided && amountRaw === null) {
        throw new ValidationError('Invalid request', { details: { error: 'invalid_amount' } })
      }
      const amount = amountRaw ?? 1000
      if (!PULSE_AMOUNTS.includes(amount as any)) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'invalid_amount_bucket',
            allowed: PULSE_AMOUNTS,
          },
        })
      }

      const payinRaw = typeof queryParams.payin === 'string' ? queryParams.payin : null
      const payinNormalized = normalizePulseMethod(payinRaw)
      if (payinRaw && !payinNormalized) {
        throw new ValidationError('Invalid request', { details: { error: 'invalid_payin_method' } })
      }
      const payin = payinNormalized ?? 'bank'
      if (!PULSE_PAYIN_METHODS.includes(payin as any)) {
        throw new ValidationError('Invalid request', { details: { error: 'invalid_payin_method' } })
      }

      const payoutRaw = typeof queryParams.payout === 'string' ? queryParams.payout : null
      const payoutNormalized = normalizePulseMethod(payoutRaw)
      if (payoutRaw && !payoutNormalized) {
        throw new ValidationError('Invalid request', { details: { error: 'invalid_payout_method' } })
      }
      const payout = payoutNormalized ?? 'bank'
      if (!PULSE_PAYOUT_METHODS.includes(payout as any)) {
        throw new ValidationError('Invalid request', { details: { error: 'invalid_payout_method' } })
      }

      const moversByCorridor = new Map<string, { deltaPct: number; timestampBucket: string }>()

      if (includeMovers && corridorIds.length > 0) {
        const result = await query<{
          corridor_id: string
          current_bucket: Date
          current_avg_rate: unknown
          prev_avg_rate: unknown | null
        }>(
          `WITH ranked AS (
            SELECT
              corridor_id,
              timestamp_bucket,
              avg_rate,
              ROW_NUMBER() OVER (PARTITION BY corridor_id ORDER BY timestamp_bucket DESC) AS rn
            FROM gold_export.corridor_rates
            WHERE corridor_id = ANY($1)
              AND timestamp_bucket >= NOW() - INTERVAL '48 hours'
          ),
          pivoted AS (
            SELECT
              corridor_id,
              MAX(CASE WHEN rn = 1 THEN timestamp_bucket END) AS current_bucket,
              MAX(CASE WHEN rn = 1 THEN avg_rate END) AS current_avg_rate,
              MAX(CASE WHEN rn = 2 THEN avg_rate END) AS prev_avg_rate
            FROM ranked
            WHERE rn <= 2
            GROUP BY corridor_id
          )
          SELECT
            corridor_id,
            current_bucket,
            current_avg_rate,
            prev_avg_rate
          FROM pivoted
          WHERE current_bucket IS NOT NULL
            AND current_bucket >= NOW() - INTERVAL '24 hours'`,
          [corridorIds],
          planeAPool,
        )

        for (const row of result.rows) {
          const corridorId = String(row.corridor_id || '')
          const currentAvg = toSafeNumber(row.current_avg_rate)
          const prevAvg = toSafeNumber(row.prev_avg_rate)
          const bucketIso = toIsoString(row.current_bucket)
          if (!corridorId || currentAvg === null || prevAvg === null || prevAvg <= 0 || !bucketIso) continue
          const deltaPct = (currentAvg - prevAvg) / prevAvg
          if (!Number.isFinite(deltaPct)) continue
          moversByCorridor.set(corridorId, { deltaPct, timestampBucket: bucketIso })
        }
      }

      if (corridorIds.length === 0) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('GET', '/pulse/screener', 200, durationSeconds)
        return { success: true, updatedAt: null, rows: [] }
      }

      const _baseKeys = ['pulse:smart-send', 'pulse:market-snapshot', 'pulse:market-depth', 'pulse:bank-comparison'] as const
      const keyMap = new Map<string, Record<(typeof _baseKeys)[number], string>>()
      const allKeys: string[] = []

      for (const corridorId of corridorIds) {
        const parsed = parseCorridorFromId(corridorId)
        const rawSlug = parsed
          ? `${parsed.sendCurrency.toLowerCase()}-${parsed.recvCurrency.toLowerCase()}`
          : corridorId
        const corridor = normalizePulseCorridor(rawSlug) ?? '__invalid__'
        const filters: PulseCacheFilters = {
          corridor,
          timeframe,
          range: null,
          amount,
          payin,
          payout,
        }

        const keys = {
          'pulse:smart-send': buildPulseCacheKey('pulse:smart-send', filters),
          'pulse:market-snapshot': buildPulseCacheKey('pulse:market-snapshot', filters),
          'pulse:market-depth': buildPulseCacheKey('pulse:market-depth', filters),
          'pulse:bank-comparison': buildPulseCacheKey('pulse:bank-comparison', filters),
        } as Record<(typeof _baseKeys)[number], string>

        keyMap.set(corridorId, keys)
        allKeys.push(...Object.values(keys))
      }

      const entries = await pulseCacheRepository.getEntries(allKeys)
      const entryByKey = new Map(entries.map((entry) => [entry.key, entry]))

      const rows: PulseScreenerRow[] = corridorIds.map((corridorId) => {
        const parsed = parseCorridorFromId(corridorId)
        const slug = parsed
          ? `${parsed.sendCurrency.toLowerCase()}-${parsed.recvCurrency.toLowerCase()}`
          : corridorId.toLowerCase()
        const label = parsed ? `${parsed.sendCurrency} ${arrow} ${parsed.recvCurrency}` : corridorId

        const metaFrom = parsed?.fromCountry ?? ''
        const metaTo = parsed?.toCountry ?? ''
        const fromFlag = toFlagEmoji(metaFrom)
        const toFlag = toFlagEmoji(metaTo)

        const keys = keyMap.get(corridorId)
        if (!keys) {
          return {
            corridorId,
            slug,
            label,
            fromFlag,
            toFlag,
            sourceCountry: parsed?.fromCountry,
            destCountry: parsed?.toCountry,
            sourceCurrency: parsed?.sendCurrency,
            destCurrency: parsed?.recvCurrency,
            dataAvailable: false,
            updatedAt: null,
            smartSendLevel: null,
            bestProvider: null,
            bestRecipientGets: null,
            spreadRangeBps: null,
            providerCount: null,
            bankSavings: null,
            bankSavingsPercent: null,
            moverDeltaPct24h: moversByCorridor.get(corridorId)?.deltaPct ?? null,
            moverTimestampBucket: moversByCorridor.get(corridorId)?.timestampBucket ?? null,
          }
        }

        const smartEntry = entryByKey.get(keys['pulse:smart-send'])
        const snapshotEntry = entryByKey.get(keys['pulse:market-snapshot'])
        const depthEntry = entryByKey.get(keys['pulse:market-depth'])
        const bankEntry = entryByKey.get(keys['pulse:bank-comparison'])

        if (!smartEntry || !snapshotEntry || !depthEntry || !bankEntry) {
          return {
            corridorId,
            slug,
            label,
            fromFlag,
            toFlag,
            sourceCountry: parsed?.fromCountry,
            destCountry: parsed?.toCountry,
            sourceCurrency: parsed?.sendCurrency,
            destCurrency: parsed?.recvCurrency,
            dataAvailable: false,
            updatedAt: null,
            smartSendLevel: null,
            bestProvider: null,
            bestRecipientGets: null,
            spreadRangeBps: null,
            providerCount: null,
            bankSavings: null,
            bankSavingsPercent: null,
            moverDeltaPct24h: moversByCorridor.get(corridorId)?.deltaPct ?? null,
            moverTimestampBucket: moversByCorridor.get(corridorId)?.timestampBucket ?? null,
          }
        }

        const smartUpdatedAt = toIsoString(smartEntry.updated_at)
        const snapshotUpdatedAt = toIsoString(snapshotEntry.updated_at)
        const depthUpdatedAt = toIsoString(depthEntry.updated_at)
        const bankUpdatedAt = toIsoString(bankEntry.updated_at)
        const updatedAtCandidates = [smartUpdatedAt, snapshotUpdatedAt, depthUpdatedAt, bankUpdatedAt].filter(Boolean) as string[]
        const updatedAt = updatedAtCandidates.length === 4
          ? updatedAtCandidates.sort((a, b) => a.localeCompare(b))[0]
          : null

        const smartPayload = parsePayload(smartEntry.payload)
        const snapshotPayload = parsePayload(snapshotEntry.payload)
        const depthPayload = parsePayload(depthEntry.payload)
        const bankPayload = parsePayload(bankEntry.payload)

        const smartSendLevel = (isObject(smartPayload) && typeof (smartPayload as any).level === 'string'
          && ['great', 'good', 'fair', 'wait'].includes((smartPayload as any).level))
          ? ((smartPayload as any).level as PulseScreenerRow['smartSendLevel'])
          : null

        const bestQuote = isObject(snapshotPayload) && Array.isArray((snapshotPayload as any).quotes)
          ? (snapshotPayload as any).quotes[0]
          : null
        const bestProvider = isObject(bestQuote) && typeof (bestQuote as any).provider === 'string'
          ? String((bestQuote as any).provider)
          : null
        const bestRecipientGets = isObject(bestQuote) ? toSafeNumber((bestQuote as any).recipientGets) : null

        const spreadRangeBps = isObject(depthPayload) ? toSafeNumber((depthPayload as any).spreadRangeBps) : null
        const providerCount = isObject(depthPayload) ? toSafeNumber((depthPayload as any).providerCount) : null

        const bankSavings = isObject(bankPayload) ? toSafeNumber((bankPayload as any).savings) : null
        const bankSavingsPercent = isObject(bankPayload) ? toSafeNumber((bankPayload as any).savingsPercent) : null

        return {
          corridorId,
          slug,
          label,
          fromFlag,
          toFlag,
          sourceCountry: parsed?.fromCountry,
          destCountry: parsed?.toCountry,
          sourceCurrency: parsed?.sendCurrency,
          destCurrency: parsed?.recvCurrency,
          dataAvailable: Boolean(updatedAt),
          updatedAt: updatedAt || null,
          smartSendLevel,
          bestProvider,
          bestRecipientGets,
          spreadRangeBps,
          providerCount,
          bankSavings,
          bankSavingsPercent,
          moverDeltaPct24h: moversByCorridor.get(corridorId)?.deltaPct ?? null,
          moverTimestampBucket: moversByCorridor.get(corridorId)?.timestampBucket ?? null,
        }
      })

      const latestUpdatedAt = rows.reduce<string | null>((latest, row) => {
        if (!row.updatedAt) return latest
        if (!latest) return row.updatedAt
        return row.updatedAt > latest ? row.updatedAt : latest
      }, null)

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/screener', 200, durationSeconds)

      return {
        success: true,
        updatedAt: latestUpdatedAt,
        rows,
      }
    } catch (error) {
      const statusCode = (error as any)?.statusCode
      const normalizedStatus = Number.isFinite(Number(statusCode)) ? Number(statusCode) : 500
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/screener', normalizedStatus >= 400 ? normalizedStatus : 500, durationSeconds)
      throw error
    }
  })

  app.get('/pulse/overview', guardLite, async (request) => {
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

  app.get('/pulse/charts', guardLite, async (request, reply) => {
    const startTime = Date.now()
    try {
      const queryParams = (request.query ?? {}) as Record<string, unknown>

      const chartIdsRaw = parseChartIdsParam(
        queryParams.chart_ids ?? queryParams.chartIds ?? queryParams.chart_id ?? queryParams.chartId,
      )
      const chartIdsUnique = Array.from(new Set(chartIdsRaw))
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
      const isProAccess = request.entitlementsContext?.entitlements.pulse_access === 'pro'
      const defaultChartIds = [...PULSE_CHART_IDS]
      const chartIds = chartIdsUnique.length > 0
        ? chartIdsUnique
        : (isProAccess ? defaultChartIds : defaultChartIds.filter((id) => !PULSE_PRO_CHART_IDS.has(id)))

      if (!isProAccess && chartIdsUnique.length > 0) {
        const forbidden = chartIds.filter((id) => PULSE_PRO_CHART_IDS.has(id))
        if (forbidden.length > 0) {
          const durationSeconds = (Date.now() - startTime) / 1000
          recordRequest('GET', '/pulse/charts', 403, durationSeconds)
          reply.code(403)
          return reply.send({ error: 'forbidden', entitlement: 'pulse_pro' })
        }
      }

      if (chartIds.length > 50) {
        throw new ValidationError('Invalid request', {
          details: {
            error: 'chart_ids_limit_exceeded',
            limit: 50,
            received: chartIds.length,
          },
        })
      }

      for (const id of chartIds) {
        if (!/^[a-z0-9-]{1,64}$/i.test(id)) {
          throw new ValidationError('Invalid request', {
            details: {
              error: 'invalid_chart_id',
              chart_id: id,
            },
          })
        }
      }

      const filters = buildPulseFilters(queryParams)

      const charts = await Promise.all(chartIds.map(async (chartId) => {
        if (INDEX_CHART_IDS.has(chartId)) {
          const indices = await loadIndices(chartId, filters, queryParams)
          const dataAvailable = Array.isArray(indices.series) && indices.series.length > 0
          const updatedAt = indices.metadata?.lastUpdated || null
          return {
            id: chartId,
            dataAvailable,
            updatedAt: updatedAt || null,
            source: 'gold_export' as const,
            chart: {
              ...indices,
              dataAvailable,
              updatedAt: updatedAt || null,
              source: 'gold_export' as const,
            },
          }
        }

        const { payload, updatedAt } = await loadPulse(`chart:${chartId}`, filters, null)
        const normalized = normalizeChartPayload(chartId, payload, updatedAt)
        const dataAvailable = Boolean(updatedAt)

        return {
          id: chartId,
          dataAvailable,
          updatedAt: updatedAt || null,
          source: updatedAt ? ('gold_cache' as const) : ('none' as const),
          chart: {
            ...normalized,
            dataAvailable,
            updatedAt: updatedAt || null,
            source: updatedAt ? ('gold_cache' as const) : ('none' as const),
          },
        }
      }))

      const updatedAt = charts.reduce<string | null>((latest, entry) => {
        if (!entry.updatedAt) return latest
        if (!latest) return entry.updatedAt
        return entry.updatedAt > latest ? entry.updatedAt : latest
      }, null)

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/charts', 200, durationSeconds)

      return {
        success: true as const,
        updatedAt,
        dataAvailable: charts.some((entry) => entry.dataAvailable),
        charts,
      }
    } catch (error) {
      const statusCode = (error as any)?.statusCode
      const normalizedStatus = Number.isFinite(Number(statusCode)) ? Number(statusCode) : 500
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/charts', normalizedStatus >= 400 ? normalizedStatus : 500, durationSeconds)
      throw error
    }
  })

  app.get('/pulse/charts/:chartId', guardLite, async (request, reply) => {
    const chartId = (request.params as { chartId?: string }).chartId
    if (!chartId) {
      throw new ValidationError('Invalid request', { details: { error: 'missing_chart_id' } })
    }
    if (
      PULSE_PRO_CHART_IDS.has(chartId)
      && request.entitlementsContext?.entitlements.pulse_access !== 'pro'
    ) {
      reply.code(403)
      return reply.send({ error: 'forbidden', entitlement: 'pulse_pro' })
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

  app.get('/pulse/coverage-by-currency', guardPro, async (request) => {
    const startTime = Date.now()
    try {
      const queryParams = (request.query ?? {}) as Record<string, unknown>
      const filters = buildPulseFilters(queryParams)

      const sendCurrenciesRaw = parseCorridorIdsParam(queryParams.send_currencies)
      const requestedCurrencies = (sendCurrenciesRaw.length ? sendCurrenciesRaw : ['USD', 'AED', 'GBP', 'EUR'])
        .map((value) => String(value || '').trim().toUpperCase())
        .filter(Boolean)
      const sendCurrencies = Array.from(new Set(requestedCurrencies))
        .filter((value) => /^[A-Z]{3}$/.test(value))
        .slice(0, 10)

      const allowedMethodProfiles = new Set(['standard_bank', 'standard_card', 'cash_pickup'])
      const methodProfileParam = typeof queryParams.method_profile === 'string'
        ? queryParams.method_profile.trim()
        : null
      const derivedMethodProfile = resolveIndicesMethodProfile(filters) || 'standard_bank'
      const methodProfile = (methodProfileParam && allowedMethodProfiles.has(methodProfileParam))
        ? (methodProfileParam as 'standard_bank' | 'standard_card' | 'cash_pickup')
        : derivedMethodProfile

      const amountBucketRaw = typeof queryParams.amount_bucket === 'string' || typeof queryParams.amount_bucket === 'number'
        ? Number(queryParams.amount_bucket)
        : null
      const amountBucket = Number.isFinite(amountBucketRaw) && amountBucketRaw && amountBucketRaw > 0
        ? Math.round(amountBucketRaw)
        : INDICES_AMOUNT_BUCKET

      const latestDateResult = await query<{ max_date: Date | null }>(
        `SELECT MAX(date) AS max_date
           FROM gold_export.cdp_daily
          WHERE amount_bucket = $1
            AND method_profile = $2`,
        [amountBucket, methodProfile],
        planeAPool,
      )

      const latestDate = latestDateResult.rows[0]?.max_date ?? null
      if (!latestDate) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('GET', '/pulse/coverage-by-currency', 200, durationSeconds)
        return {
          success: true as const,
          date: null,
          updatedAt: null,
          rows: [],
        }
      }

      const updatedAtResult = await query<{ updated_at: Date | null }>(
        `SELECT MAX(created_at) AS updated_at
           FROM gold_export.cdp_daily
          WHERE amount_bucket = $1
            AND method_profile = $2
            AND date = $3`,
        [amountBucket, methodProfile, latestDate],
        planeAPool,
      )
      const updatedAt = toIsoString(updatedAtResult.rows[0]?.updated_at) || null

      const result = await query<{
        send_currency: string
        corridors_total: number
        corridors_suppressed: number
        corridors_available: number
        corridors_with_3_plus_providers: number
        corridors_with_1_to_2_providers: number
        corridors_with_0_providers: number
        weight_confidence_p10: number | null
        weight_confidence_p50: number | null
        weight_confidence_p90: number | null
      }>(
        `SELECT
            SPLIT_PART(corridor_id, '-', 3) AS send_currency,
            COUNT(*)::int AS corridors_total,
            COUNT(*) FILTER (WHERE suppression_flag IS TRUE)::int AS corridors_suppressed,
            COUNT(*) FILTER (WHERE suppression_flag IS FALSE)::int AS corridors_available,
            COUNT(*) FILTER (WHERE COALESCE(provider_count, 0) >= 3)::int AS corridors_with_3_plus_providers,
            COUNT(*) FILTER (WHERE COALESCE(provider_count, 0) BETWEEN 1 AND 2)::int AS corridors_with_1_to_2_providers,
            COUNT(*) FILTER (WHERE COALESCE(provider_count, 0) = 0)::int AS corridors_with_0_providers,
            percentile_cont(0.1) WITHIN GROUP (ORDER BY weight_confidence) FILTER (WHERE weight_confidence IS NOT NULL) AS weight_confidence_p10,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY weight_confidence) FILTER (WHERE weight_confidence IS NOT NULL) AS weight_confidence_p50,
            percentile_cont(0.9) WITHIN GROUP (ORDER BY weight_confidence) FILTER (WHERE weight_confidence IS NOT NULL) AS weight_confidence_p90
          FROM gold_export.cdp_daily
         WHERE amount_bucket = $1
           AND method_profile = $2
           AND date = $3
           AND SPLIT_PART(corridor_id, '-', 3) = ANY($4)
         GROUP BY send_currency
         ORDER BY send_currency ASC`,
        [amountBucket, methodProfile, latestDate, sendCurrencies],
        planeAPool,
      )

      const rowByCurrency = new Map(result.rows.map((row) => [row.send_currency.toUpperCase(), row]))
      const rows = sendCurrencies.map((sendCurrency) => {
        const row = rowByCurrency.get(sendCurrency.toUpperCase())
        if (!row) {
          return {
            sendCurrency,
            corridorsTotal: 0,
            corridorsSuppressed: 0,
            corridorsAvailable: 0,
            corridorsWith3PlusProviders: 0,
            corridorsWith1to2Providers: 0,
            corridorsWith0Providers: 0,
            weightConfidenceP10: null,
            weightConfidenceP50: null,
            weightConfidenceP90: null,
          }
        }

        return {
          sendCurrency,
          corridorsTotal: Number(row.corridors_total) || 0,
          corridorsSuppressed: Number(row.corridors_suppressed) || 0,
          corridorsAvailable: Number(row.corridors_available) || 0,
          corridorsWith3PlusProviders: Number(row.corridors_with_3_plus_providers) || 0,
          corridorsWith1to2Providers: Number(row.corridors_with_1_to_2_providers) || 0,
          corridorsWith0Providers: Number(row.corridors_with_0_providers) || 0,
          weightConfidenceP10: row.weight_confidence_p10 !== null ? Number(row.weight_confidence_p10) : null,
          weightConfidenceP50: row.weight_confidence_p50 !== null ? Number(row.weight_confidence_p50) : null,
          weightConfidenceP90: row.weight_confidence_p90 !== null ? Number(row.weight_confidence_p90) : null,
        }
      })

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/coverage-by-currency', 200, durationSeconds)

      return {
        success: true as const,
        date: latestDate.toISOString().slice(0, 10),
        updatedAt,
        rows,
      }
    } catch (error) {
      const statusCode = (error as any)?.statusCode
      const normalizedStatus = Number.isFinite(Number(statusCode)) ? Number(statusCode) : 500
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/coverage-by-currency', normalizedStatus >= 400 ? normalizedStatus : 500, durationSeconds)
      throw error
    }
  })

  app.get('/pulse/coverage-by-currency/gaps', guardPro, async (request) => {
    const startTime = Date.now()
    try {
      const queryParams = (request.query ?? {}) as Record<string, unknown>
      const filters = buildPulseFilters(queryParams)

      const sendCurrencyRaw = typeof queryParams.send_currency === 'string'
        ? queryParams.send_currency.trim().toUpperCase()
        : ''
      if (!/^[A-Z]{3}$/.test(sendCurrencyRaw)) {
        throw new ValidationError('Invalid request', {
          details: { error: 'invalid_send_currency', send_currency: sendCurrencyRaw || null },
        })
      }

      const allowedMethodProfiles = new Set(['standard_bank', 'standard_card', 'cash_pickup'])
      const methodProfileParam = typeof queryParams.method_profile === 'string'
        ? queryParams.method_profile.trim()
        : null
      const derivedMethodProfile = resolveIndicesMethodProfile(filters) || 'standard_bank'
      const methodProfile = (methodProfileParam && allowedMethodProfiles.has(methodProfileParam))
        ? (methodProfileParam as 'standard_bank' | 'standard_card' | 'cash_pickup')
        : derivedMethodProfile

      const requiredPayoutMethod = resolvePayoutMethodForMethodProfile(methodProfile)

      const amountBucketRaw = typeof queryParams.amount_bucket === 'string' || typeof queryParams.amount_bucket === 'number'
        ? Number(queryParams.amount_bucket)
        : null
      const amountBucket = Number.isFinite(amountBucketRaw) && amountBucketRaw && amountBucketRaw > 0
        ? Math.round(amountBucketRaw)
        : INDICES_AMOUNT_BUCKET

      const binRaw = typeof queryParams.bin === 'string' ? queryParams.bin.trim().toLowerCase() : 'none'
      const bin = (binRaw === 'low' || binRaw === 'none') ? binRaw : 'none'

      const limitRaw = typeof queryParams.limit === 'string' || typeof queryParams.limit === 'number'
        ? Number(queryParams.limit)
        : null
      const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw as any) ? Math.round(limitRaw as any) : 50))

      const staleSecondsRaw = typeof queryParams.stale_seconds === 'string' || typeof queryParams.stale_seconds === 'number'
        ? Number(queryParams.stale_seconds)
        : null
      const staleSeconds = Number.isFinite(staleSecondsRaw as any) && (staleSecondsRaw as any) > 0
        ? Math.round(staleSecondsRaw as any)
        : 3 * 60 * 60

      const requireProduction = parseBooleanParam(queryParams.require_production, true)

      const latestDateResult = await query<{ max_date: Date | null }>(
        `SELECT MAX(date) AS max_date
           FROM gold_export.cdp_daily
          WHERE amount_bucket = $1
            AND method_profile = $2`,
        [amountBucket, methodProfile],
        planeAPool,
      )
      const latestDate = latestDateResult.rows[0]?.max_date ?? null
      if (!latestDate) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('GET', '/pulse/coverage-by-currency/gaps', 200, durationSeconds)
        return {
          success: true as const,
          date: null,
          updatedAt: null,
          sendCurrency: sendCurrencyRaw,
          methodProfile,
          amountBucket,
          bin,
          rows: [],
        }
      }

      const updatedAtResult = await query<{ updated_at: Date | null }>(
        `SELECT MAX(created_at) AS updated_at
           FROM gold_export.cdp_daily
          WHERE amount_bucket = $1
            AND method_profile = $2
            AND date = $3`,
        [amountBucket, methodProfile, latestDate],
        planeAPool,
      )
      const updatedAt = toIsoString(updatedAtResult.rows[0]?.updated_at) || null

      const corridorRows = await query<{
        corridor_id: string
        provider_count: number | null
        suppression_flag: boolean
        suppression_reason: string | null
        weight_confidence: number | null
      }>(
        `SELECT corridor_id,
                provider_count,
                suppression_flag,
                suppression_reason,
                weight_confidence
           FROM gold_export.cdp_daily
          WHERE amount_bucket = $1
            AND method_profile = $2
            AND date = $3
            AND SPLIT_PART(corridor_id, '-', 3) = $4
            AND (
              ($5::text = 'none' AND COALESCE(provider_count, 0) = 0)
              OR
              ($5::text = 'low' AND COALESCE(provider_count, 0) BETWEEN 1 AND 2)
            )
          ORDER BY corridor_id ASC
          LIMIT $6`,
        [amountBucket, methodProfile, latestDate, sendCurrencyRaw, bin, limit],
        planeAPool,
      )

      const corridorIds = corridorRows.rows.map((row) => row.corridor_id).filter(Boolean)
      if (corridorIds.length === 0) {
        const durationSeconds = (Date.now() - startTime) / 1000
        recordRequest('GET', '/pulse/coverage-by-currency/gaps', 200, durationSeconds)
        return {
          success: true as const,
          date: latestDate.toISOString().slice(0, 10),
          updatedAt,
          sendCurrency: sendCurrencyRaw,
          methodProfile,
          amountBucket,
          bin,
          rows: [],
        }
      }

      type RightsRow = {
        provider_id: string
        allowed_collect: boolean | null
        allowed_b2b: boolean | null
        stoplist_status: string | null
        status: string | null
        source_countries: string[] | null
        destination_countries: string[] | null
      }

      type CapabilityRow = {
        provider_id: string
        corridor_id: string
        payout_methods: string[] | null
        is_supported: boolean | null
        source: string | null
        last_verified_at: Date | string | null
      }

      type LatestQuoteRow = {
        provider_id: string
        corridor_id: string
        amount_bucket: number
        collected_at: Date | string | null
      }

      const [rightsResult, capResult, quoteResult] = await Promise.all([
        query<RightsRow>(
          `SELECT provider_id,
                  allowed_collect,
                  allowed_b2b,
                  stoplist_status,
                  status,
                  source_countries,
                  destination_countries
             FROM silver.rights_matrix
            WHERE allowed_collect IS TRUE
              AND allowed_b2b IS TRUE
              AND LOWER(COALESCE(stoplist_status, '')) = 'active'
              AND ($1::boolean = false OR LOWER(COALESCE(status, '')) = 'production')`,
          [requireProduction],
          planeAPool,
        ),
        query<CapabilityRow>(
          `SELECT provider_id,
                  corridor_id,
                  payout_methods,
                  is_supported,
                  source,
                  last_verified_at
             FROM silver.provider_corridor_capability
            WHERE corridor_id = ANY($1::text[])`,
          [corridorIds],
          planeAPool,
        ),
        query<LatestQuoteRow>(
          `SELECT provider_id,
                  corridor_id,
                  amount_bucket,
                  collected_at
             FROM silver.latest_quote_by_provider
            WHERE corridor_id = ANY($1::text[])
              AND amount_bucket = $2`,
          [corridorIds, amountBucket],
          planeAPool,
        ),
      ])

      const rightsByProvider = new Map<string, RightsRow>()
      for (const row of rightsResult.rows) {
        if (!row.provider_id) continue
        rightsByProvider.set(row.provider_id, row)
      }

      const capsByCorridor = new Map<string, Map<string, CapabilityRow>>()
      for (const row of capResult.rows) {
        if (!row.corridor_id || !row.provider_id) continue
        if (!capsByCorridor.has(row.corridor_id)) {
          capsByCorridor.set(row.corridor_id, new Map())
        }
        capsByCorridor.get(row.corridor_id)!.set(row.provider_id, row)
      }

      const quotesByCorridorProvider = new Map<string, Date>()
      for (const row of quoteResult.rows) {
        if (!row.corridor_id || !row.provider_id) continue
        if (!row.collected_at) continue
        const date = row.collected_at instanceof Date ? row.collected_at : new Date(row.collected_at)
        if (Number.isNaN(date.getTime())) continue
        const key = `${row.corridor_id}:${row.provider_id}`
        const existing = quotesByCorridorProvider.get(key)
        if (!existing || date > existing) quotesByCorridorProvider.set(key, date)
      }

      const includesCountry = (list: string[] | null, code: string): boolean => {
        if (!list || list.length === 0) return false
        const upper = code.trim().toUpperCase()
        return list.some((c) => c && c.trim().toUpperCase() === upper)
      }

      const allActiveProviders = Array.from(rightsByProvider.keys())

      const now = Date.now()
      const rows = corridorRows.rows.map((row) => {
        const parsed = parseCorridorFromId(row.corridor_id)
        const fromCountry = parsed?.fromCountry ?? null
        const toCountry = parsed?.toCountry ?? null
        const sendCurrency = parsed?.sendCurrency ?? sendCurrencyRaw
        const recvCurrency = parsed?.recvCurrency ?? null

        const rightsEligibleProviders: string[] = []
        if (fromCountry && toCountry) {
          for (const providerId of allActiveProviders) {
            const rights = rightsByProvider.get(providerId)
            if (!rights) continue
            if (!includesCountry(rights.source_countries, fromCountry)) continue
            if (!includesCountry(rights.destination_countries, toCountry)) continue
            rightsEligibleProviders.push(providerId)
          }
        }

        const capMap = capsByCorridor.get(row.corridor_id) ?? new Map<string, CapabilityRow>()
        const supportedProviders: string[] = []
        let capabilityMissing = 0
        let capabilityUnsupported = 0
        let methodMismatch = 0

        for (const providerId of rightsEligibleProviders) {
          const cap = capMap.get(providerId) ?? null
          if (!cap) {
            capabilityMissing += 1
            continue
          }
          if (!cap.is_supported) {
            capabilityUnsupported += 1
            continue
          }
          if (!capabilityAllowsPayout(cap.payout_methods ?? null, requiredPayoutMethod)) {
            methodMismatch += 1
            continue
          }
          supportedProviders.push(providerId)
        }

        let freshestQuoteAt: string | null = null
        let freshestQuoteAgeSeconds: number | null = null
        if (supportedProviders.length > 0) {
          let freshest: Date | null = null
          for (const providerId of supportedProviders) {
            const key = `${row.corridor_id}:${providerId}`
            const collectedAt = quotesByCorridorProvider.get(key) ?? null
            if (!collectedAt) continue
            if (!freshest || collectedAt > freshest) freshest = collectedAt
          }
          if (freshest) {
            freshestQuoteAt = freshest.toISOString()
            freshestQuoteAgeSeconds = Math.max(0, Math.floor((now - freshest.getTime()) / 1000))
          }
        }

        type GapReason = 'rights' | 'capability' | 'method_mismatch' | 'freshness' | 'unknown'
        let reason: GapReason = 'unknown'
        if (rightsEligibleProviders.length === 0) {
          reason = 'rights'
        } else if (supportedProviders.length === 0) {
          if (capabilityMissing > 0) reason = 'capability'
          else if (methodMismatch > 0) reason = 'method_mismatch'
          else if (capabilityUnsupported > 0) reason = 'capability'
          else reason = 'capability'
        } else {
          const age = freshestQuoteAgeSeconds
          if (age === null || age > staleSeconds) {
            reason = 'freshness'
          }
        }

        return {
          corridorId: row.corridor_id,
          fromCountry,
          toCountry,
          sendCurrency,
          recvCurrency,
          providerCount: row.provider_count !== null ? Number(row.provider_count) : null,
          suppressionFlag: Boolean(row.suppression_flag),
          suppressionReason: row.suppression_reason ?? null,
          weightConfidence: row.weight_confidence !== null ? Number(row.weight_confidence) : null,
          gap: {
            reason,
            rightsEligibleProviders: rightsEligibleProviders.length,
            supportedProviders: supportedProviders.length,
            capabilityMissing,
            capabilityUnsupported,
            methodMismatch,
            freshestQuoteAt,
            freshestQuoteAgeSeconds,
            staleSeconds,
          },
        }
      })

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/coverage-by-currency/gaps', 200, durationSeconds)

      return {
        success: true as const,
        date: latestDate.toISOString().slice(0, 10),
        updatedAt,
        sendCurrency: sendCurrencyRaw,
        methodProfile,
        amountBucket,
        bin,
        rows,
      }
    } catch (error) {
      const statusCode = (error as any)?.statusCode
      const normalizedStatus = Number.isFinite(Number(statusCode)) ? Number(statusCode) : 500
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/pulse/coverage-by-currency/gaps', normalizedStatus >= 400 ? normalizedStatus : 500, durationSeconds)
      throw error
    }
  })

  app.get('/pulse/method-coverage', guardLite, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('method-coverage', filters, pulseDefaults.methodCoverage)
    return mapMethodCoverage(payload)
  })

  app.get('/pulse/table', guardLite, async (request) => {
    const query = (request.query ?? {}) as Record<string, unknown>
    const amount = toNumber(query.amount, 1000)
    const page = Math.max(1, toNumber(query.page, 1))
    const pageSize = Math.max(1, toNumber(query.pageSize, 20))
    const filters = buildPulseFilters(query)
    const { payload } = await loadPulse('table', filters, pulseDefaults.table)
    return mapTableData(payload, amount, page, pageSize)
  })

  app.get('/pulse/hero', guardLite, async (request) => {
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

  app.get('/pulse/coverage-summary', guardLite, async (request) => {
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

  app.get('/pulse/snapshot-summary', guardLite, async (request) => {
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

  app.get('/pulse/providers/benchmarking', guardPro, async (request) => {
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

  app.get('/pulse/events', guardPro, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('events', filters, pulseDefaults.events)
    return mapEvents(payload)
  })

  app.get('/pulse/providers/heatmap', guardPro, async (request) => {
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

  app.get('/pulse/smart-send', guardLite, async (request) => {
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

  app.get('/pulse/market-snapshot', guardLite, async (request) => {
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

  app.get('/pulse/true-cost', guardLite, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('true-cost', filters, pulseDefaults.trueCost)
    return Array.isArray(payload) ? payload : pulseDefaults.trueCost
  })

  app.get('/pulse/market-depth', guardPro, async (request) => {
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

  app.get('/pulse/arbitrage', guardPro, async (request) => {
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

  app.get('/pulse/bank-comparison', guardLite, async (request) => {
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

  app.get('/pulse/cost-trend', guardLite, async (request) => {
    const filters = buildPulseFilters((request.query ?? {}) as Record<string, unknown>)
    const { payload } = await loadPulse('cost-trend', filters, pulseDefaults.costTrend)
    return Array.isArray(payload) ? payload : pulseDefaults.costTrend
  })

  app.get('/pulse/fx-rate-history', guardLite, async (request) => {
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
