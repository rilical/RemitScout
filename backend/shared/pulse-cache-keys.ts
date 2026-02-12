import type { PulseCacheFilters } from './pulse-types'

export type PulseTimeframeKey = '24h' | '7d' | '30d' | '1y' | 'max'
export type PulseRangeKey = '7d' | '30d' | '90d' | '365d'
export type PulseMethodKey = 'bank' | 'card' | 'cash' | 'wallet'

export type { PulseCacheFilters } from './pulse-types'

export const PULSE_TIMEFRAMES: PulseTimeframeKey[] = ['24h', '7d', '30d', '1y', 'max']
export const PULSE_RANGES: PulseRangeKey[] = ['7d', '30d', '90d', '365d']
export const PULSE_AMOUNTS = [100, 200, 500, 1000]
export const PULSE_PAYIN_METHODS: PulseMethodKey[] = ['bank', 'card', 'cash']
export const PULSE_PAYOUT_METHODS: PulseMethodKey[] = ['bank', 'cash', 'wallet']

export const PULSE_CHART_IDS = [
  'all-in-cost',
  'fx-markup',
  'fee-vs-markup',
  'spread-distribution',
  'provider-winner',
  'leader-change-frequency',
  'leader-edge',
  'pass-through-latency',
  'volatility-pulse',
  'quote-anomalies',
  'spread-volatility',
  'quote-success',
  'provider-availability',
  'data-freshness',
  'corridor-liquidity',
] as const

const normalizeToken = (value: string | null | undefined) => {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizePulseTimeframe = (value?: string | null): PulseTimeframeKey | null => {
  const normalized = normalizeToken(value)?.toLowerCase()
  if (!normalized) return null
  if (normalized === '24h' || normalized === '24hr' || normalized === '24hours') return '24h'
  if (normalized === '7d' || normalized === '7days') return '7d'
  if (normalized === '30d' || normalized === '30days') return '30d'
  if (normalized === '1y' || normalized === '1yr' || normalized === '365d' || normalized === '365days') return '1y'
  if (normalized === 'max') return 'max'
  return null
}

export const normalizePulseRange = (value?: string | null): PulseRangeKey | null => {
  const normalized = normalizeToken(value)?.toLowerCase()
  if (!normalized) return null
  if (normalized === '7d' || normalized === '7days') return '7d'
  if (normalized === '30d' || normalized === '30days') return '30d'
  if (normalized === '90d' || normalized === '90days') return '90d'
  if (normalized === '365d' || normalized === '365days' || normalized === '1y') return '365d'
  return null
}

export const normalizePulseMethod = (value?: string | null): PulseMethodKey | null => {
  const normalized = normalizeToken(value)?.toLowerCase()
  if (!normalized) return null
  if (normalized === 'bank' || normalized === 'card' || normalized === 'cash' || normalized === 'wallet') {
    return normalized
  }
  return null
}

export const normalizePulseCorridor = (value?: string | null): string | null => {
  const normalized = normalizeToken(value)?.toLowerCase()
  if (!normalized || normalized === 'global' || normalized === 'all') return null
  return normalized
}

export const buildPulseCacheBaseKey = (base: string): string => {
  const normalized = base.startsWith('pulse:') ? base.slice('pulse:'.length) : base
  return `pulse:${normalized}`
}

export const buildPulseCacheKey = (base: string, filters: PulseCacheFilters): string => {
  const baseKey = buildPulseCacheBaseKey(base)
  const corridor = normalizePulseCorridor(filters.corridor) ?? 'global'
  const timeframe = normalizePulseTimeframe(filters.timeframe) ?? 'all'
  const range = normalizePulseRange(filters.range) ?? 'all'
  const amount = Number.isFinite(Number(filters.amount)) ? String(filters.amount) : 'all'
  const payin = normalizePulseMethod(filters.payin) ?? 'all'
  const payout = normalizePulseMethod(filters.payout) ?? 'all'

  return `${baseKey}|corridor=${corridor}|timeframe=${timeframe}|range=${range}|amount=${amount}|payin=${payin}|payout=${payout}`
}

export const buildPulseCacheKeyCandidates = (base: string, filters: PulseCacheFilters): string[] => {
  const candidates: string[] = []
  const normalizedFilters: PulseCacheFilters = {
    corridor: normalizePulseCorridor(filters.corridor),
    timeframe: normalizePulseTimeframe(filters.timeframe),
    range: normalizePulseRange(filters.range),
    amount: Number.isFinite(Number(filters.amount)) ? Number(filters.amount) : null,
    payin: normalizePulseMethod(filters.payin),
    payout: normalizePulseMethod(filters.payout),
  }

  const hasAnyFilter = Object.values(normalizedFilters).some((value) => value !== null && value !== undefined)
  if (hasAnyFilter) {
    candidates.push(buildPulseCacheKey(base, normalizedFilters))

    if (normalizedFilters.payin || normalizedFilters.payout) {
      candidates.push(buildPulseCacheKey(base, { ...normalizedFilters, payin: null, payout: null }))
    }

    if (normalizedFilters.amount !== null && normalizedFilters.amount !== undefined) {
      candidates.push(buildPulseCacheKey(base, { ...normalizedFilters, amount: null }))
    }

    if (normalizedFilters.range) {
      candidates.push(buildPulseCacheKey(base, { ...normalizedFilters, range: null }))
    }

    if (normalizedFilters.timeframe) {
      candidates.push(buildPulseCacheKey(base, { ...normalizedFilters, timeframe: null }))
    }

    if (normalizedFilters.corridor) {
      candidates.push(buildPulseCacheKey(base, { ...normalizedFilters, corridor: null }))
    }
  }

  candidates.push(buildPulseCacheBaseKey(base))

  return Array.from(new Set(candidates))
}

export const resolvePulseInterval = (value?: string | null): string => {
  const timeframe = normalizePulseTimeframe(value)
  switch (timeframe) {
    case '24h':
      return '1 day'
    case '7d':
      return '7 days'
    case '30d':
      return '30 days'
    case '1y':
      return '365 days'
    case 'max':
      return '365 days'
    default:
      return '30 days'
  }
}

export const resolvePulseRangeInterval = (value?: string | null): string => {
  const range = normalizePulseRange(value)
  switch (range) {
    case '7d':
      return '7 days'
    case '30d':
      return '30 days'
    case '90d':
      return '90 days'
    case '365d':
      return '365 days'
    default:
      return '30 days'
  }
}

export const resolvePulseBucket = (interval: string): 'hour' | 'day' => {
  return interval === '1 day' ? 'hour' : 'day'
}
