import { defineStore } from 'pinia'
import type { PulseFilters, TimeRange } from '~/types/pulse'

export type PulseTimeframe = '24H' | '7D' | '30D' | '1Y' | 'MAX'
export type PulseViewMode = 'sender' | 'analyst'

export interface PulseCorridor {
  from: string
  to: string
  fromCode: string
  toCode: string
  fromFlag: string
  toFlag: string
  label: string
  slug: string
  corridorId?: string
}

export interface PulseState {
  corridor: PulseCorridor
  timeframe: PulseTimeframe
  viewMode: PulseViewMode
  amount: number
  lastUpdated: string
  isLoading: boolean
}

const DEFAULT_CORRIDOR: PulseCorridor = {
  from: 'United States',
  to: 'Philippines',
  fromCode: 'USD',
  toCode: 'PHP',
  fromFlag: '🇺🇸',
  toFlag: '🇵🇭',
  label: 'USD → PHP',
  slug: 'usd-php',
  corridorId: 'US-PH-USD-PHP',
}

export const POPULAR_CORRIDORS: PulseCorridor[] = [
  DEFAULT_CORRIDOR,
  {
    from: 'United States',
    to: 'Mexico',
    fromCode: 'USD',
    toCode: 'MXN',
    fromFlag: '🇺🇸',
    toFlag: '🇲🇽',
    label: 'USD → MXN',
    slug: 'usd-mxn',
    corridorId: 'US-MX-USD-MXN',
  },
  {
    from: 'United States',
    to: 'India',
    fromCode: 'USD',
    toCode: 'INR',
    fromFlag: '🇺🇸',
    toFlag: '🇮🇳',
    label: 'USD → INR',
    slug: 'usd-inr',
    corridorId: 'US-IN-USD-INR',
  },
  {
    from: 'United Kingdom',
    to: 'India',
    fromCode: 'GBP',
    toCode: 'INR',
    fromFlag: '🇬🇧',
    toFlag: '🇮🇳',
    label: 'GBP → INR',
    slug: 'gbp-inr',
    corridorId: 'GB-IN-GBP-INR',
  },
  {
    from: 'United States',
    to: 'Nigeria',
    fromCode: 'USD',
    toCode: 'NGN',
    fromFlag: '🇺🇸',
    toFlag: '🇳🇬',
    label: 'USD → NGN',
    slug: 'usd-ngn',
    corridorId: 'US-NG-USD-NGN',
  },
  {
    from: 'Canada',
    to: 'Philippines',
    fromCode: 'CAD',
    toCode: 'PHP',
    fromFlag: '🇨🇦',
    toFlag: '🇵🇭',
    label: 'CAD → PHP',
    slug: 'cad-php',
    corridorId: 'CA-PH-CAD-PHP',
  },
  {
    from: 'Australia',
    to: 'Philippines',
    fromCode: 'AUD',
    toCode: 'PHP',
    fromFlag: '🇦🇺',
    toFlag: '🇵🇭',
    label: 'AUD → PHP',
    slug: 'aud-php',
    corridorId: 'AU-PH-AUD-PHP',
  },
  {
    from: 'United Kingdom',
    to: 'Nigeria',
    fromCode: 'GBP',
    toCode: 'NGN',
    fromFlag: '🇬🇧',
    toFlag: '🇳🇬',
    label: 'GBP → NGN',
    slug: 'gbp-ngn',
    corridorId: 'GB-NG-GBP-NGN',
  },
]

export const usePulseStore = defineStore('pulse', {
  state: (): PulseState => ({
    corridor: DEFAULT_CORRIDOR,
    timeframe: '7D',
    viewMode: 'sender',
    amount: 1000,
    lastUpdated: new Date().toISOString(),
    isLoading: false,
  }),

  getters: {
    corridorSlug: state => state.corridor.slug,

    corridorLabel: state => state.corridor.label,

    timeframeDays: (state): number => {
      const map: Record<PulseTimeframe, number> = {
        '24H': 1,
        '7D': 7,
        '30D': 30,
        '1Y': 365,
        'MAX': 730,
      }
      return map[state.timeframe]
    },

    timeframeHours: (state): number => {
      const map: Record<PulseTimeframe, number> = {
        '24H': 24,
        '7D': 168,
        '30D': 720,
        '1Y': 8760,
        'MAX': 17520,
      }
      return map[state.timeframe]
    },

    isAnalystMode: state => state.viewMode === 'analyst',

    lastUpdatedRelative: (state) => {
      const diff = Date.now() - new Date(state.lastUpdated).getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return 'just now'
      if (minutes === 1) return '1 min ago'
      if (minutes < 60) return `${minutes} mins ago`
      const hours = Math.floor(minutes / 60)
      if (hours === 1) return '1 hour ago'
      return `${hours} hours ago`
    },

    filtersForApi: (state): PulseFilters => ({
      corridor: state.corridor.slug,
      corridorId: state.corridor.corridorId,
      amount: state.amount as 100 | 200 | 500 | 1000,
      fundingMethod: 'bank',
      payoutMethod: 'bank',
    }),
  },

  actions: {
    setCorridor(corridor: PulseCorridor) {
      this.corridor = corridor
      this.refreshData()
    },

    setCorridorBySlug(slug: string) {
      const corridor = POPULAR_CORRIDORS.find(c => c.slug === slug)
      if (corridor) {
        this.corridor = corridor
        this.refreshData()
      }
    },

    setTimeframe(timeframe: PulseTimeframe) {
      this.timeframe = timeframe
      this.refreshData()
    },

    setViewMode(mode: PulseViewMode) {
      this.viewMode = mode
    },

    toggleViewMode() {
      this.viewMode = this.viewMode === 'sender' ? 'analyst' : 'sender'
    },

    setAmount(amount: number) {
      this.amount = amount
      this.refreshData()
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    refreshData() {
      this.lastUpdated = new Date().toISOString()
    },

    async initFromRoute(query: Record<string, string | undefined>) {
      if (query.corridor) {
        this.setCorridorBySlug(query.corridor)
      }
      if (query.timeframe && ['24H', '7D', '30D', '1Y', 'MAX'].includes(query.timeframe)) {
        this.timeframe = query.timeframe as PulseTimeframe
      }
      if (query.mode && ['sender', 'analyst'].includes(query.mode)) {
        this.viewMode = query.mode as PulseViewMode
      }
      if (query.amount) {
        const amount = Number.parseInt(query.amount, 10)
        if ([100, 200, 500, 1000, 5000, 10000].includes(amount)) {
          this.amount = amount
        }
      }
    },

    getQueryParams(): Record<string, string> {
      const params: Record<string, string> = {}
      if (this.corridor.slug !== 'usd-php') {
        params.corridor = this.corridor.slug
      }
      if (this.timeframe !== '7D') {
        params.timeframe = this.timeframe
      }
      if (this.viewMode !== 'sender') {
        params.mode = this.viewMode
      }
      if (this.amount !== 1000) {
        params.amount = String(this.amount)
      }
      return params
    },
  },
})
