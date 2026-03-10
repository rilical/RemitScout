export type PulseTab = 'snapshot' | 'dispersion' | 'competition' | 'bank-gap' |
                       'coverage' | 'indices'

export type PulseLevel = 'none' | 'lite' | 'full'

export interface PulseTabDef {
  id: PulseTab
  label: string
  icon: string
  minLevel: PulseLevel
  chartIds: string[]
  apiEndpoints: string[]
}

export const PULSE_TABS: PulseTabDef[] = [
  {
    id: 'snapshot', label: 'Market Overview', icon: 'Activity', minLevel: 'lite',
    chartIds: ['all-in-cost', 'fx-markup'],
    apiEndpoints: ['overview', 'market-snapshot', 'smart-send', 'narrative'],
  },
  {
    id: 'dispersion', label: 'Pricing', icon: 'BarChart2', minLevel: 'full',
    chartIds: ['all-in-cost', 'fx-markup', 'fee-vs-markup', 'spread-distribution'],
    apiEndpoints: ['charts'],
  },
  {
    id: 'competition', label: 'Providers', icon: 'Users', minLevel: 'lite',
    chartIds: ['provider-winner', 'leader-change-frequency', 'leader-edge', 'pass-through-latency'],
    apiEndpoints: ['providers/benchmarking', 'providers/heatmap', 'charts'],
  },
  {
    id: 'bank-gap', label: 'Bank Gap', icon: 'Building', minLevel: 'lite',
    chartIds: [],
    apiEndpoints: ['bank-comparison', 'true-cost'],
  },
  {
    id: 'indices', label: 'Indices', icon: 'TrendingUp', minLevel: 'full',
    chartIds: ['teer-series', 'rci-series', 'rvi-series'],
    apiEndpoints: ['indices/series', 'indices/methodology'],
  },
  {
    id: 'coverage', label: 'Coverage', icon: 'Shield', minLevel: 'lite',
    chartIds: ['quote-success', 'provider-availability', 'data-freshness', 'corridor-liquidity'],
    apiEndpoints: ['coverage-summary', 'method-coverage', 'coverage-by-currency'],
  },
]

export function getVisibleTabs(level: PulseLevel): PulseTabDef[] {
  const rank: Record<PulseLevel, number> = { none: 0, lite: 1, full: 2 }
  return PULSE_TABS.filter(t => rank[level] >= rank[t.minLevel])
}
