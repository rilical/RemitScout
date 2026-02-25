import type { RecentSearch } from '~/types/remit'
import type { WatchTarget } from '~/types/tracking'

type CorridorWatchTarget = Extract<WatchTarget, { type: 'corridor' }>

type CorridorSelection = {
  from: string
  to: string
}

type CorridorWatchlistItem = {
  label: string
  target: CorridorWatchTarget
}

type RecentSearchSeed = Pick<RecentSearch, 'from' | 'to'>

export type DashboardAlertSeedInput = {
  selectedCorridor?: CorridorSelection | null
  watchlistCorridors?: CorridorWatchlistItem[] | null
  recentSearches?: RecentSearchSeed[] | null
}

export type DashboardAlertSeed = {
  target: CorridorWatchTarget
  label: string
}

const DEFAULT_ALERT_CORRIDOR = {
  from: 'US',
  to: 'PH',
} as const

function normalizeCountryCode(value: string): string {
  return value.trim().toUpperCase()
}

function normalizeCorridor(selection: CorridorSelection | null | undefined): CorridorSelection | null {
  if (!selection) return null
  const from = normalizeCountryCode(selection.from || '')
  const to = normalizeCountryCode(selection.to || '')
  if (!from || !to) return null
  return { from, to }
}

function isIsoCountryCode(value: string): boolean {
  return /^[A-Z]{2}$/.test(value)
}

function toAlertSeed(corridor: CorridorSelection, label: string, method: CorridorWatchTarget['method'] = 'bank'): DashboardAlertSeed {
  return {
    target: {
      type: 'corridor',
      from: corridor.from,
      to: corridor.to,
      method: method || 'bank',
    },
    label,
  }
}

export function resolveDashboardAlertSeed(input: DashboardAlertSeedInput): DashboardAlertSeed {
  const selected = normalizeCorridor(input.selectedCorridor)
  if (selected) {
    return toAlertSeed(selected, `${selected.from} → ${selected.to}`)
  }

  const firstWatchlistCorridor = input.watchlistCorridors?.[0]
  if (firstWatchlistCorridor?.target?.type === 'corridor') {
    const normalized = normalizeCorridor({
      from: firstWatchlistCorridor.target.from,
      to: firstWatchlistCorridor.target.to,
    })
    if (normalized) {
      return toAlertSeed(
        normalized,
        firstWatchlistCorridor.label || `${normalized.from} → ${normalized.to}`,
        firstWatchlistCorridor.target.method,
      )
    }
  }

  const firstRecentSearch = input.recentSearches?.[0]
  if (firstRecentSearch) {
    const normalized = normalizeCorridor({
      from: firstRecentSearch.from,
      to: firstRecentSearch.to,
    })
    if (normalized && isIsoCountryCode(normalized.from) && isIsoCountryCode(normalized.to)) {
      return toAlertSeed(normalized, `${normalized.from} → ${normalized.to}`)
    }
  }

  return toAlertSeed(
    { from: DEFAULT_ALERT_CORRIDOR.from, to: DEFAULT_ALERT_CORRIDOR.to },
    `${DEFAULT_ALERT_CORRIDOR.from} → ${DEFAULT_ALERT_CORRIDOR.to}`,
  )
}
