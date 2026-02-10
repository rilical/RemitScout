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

export const usePulseStore = defineStore('pulse', {
  state: (): PulseState => ({
    corridor: DEFAULT_CORRIDOR,
    timeframe: '7D',
    viewMode: 'sender',
    amount: 1000,
    lastUpdated: '',
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
        'MAX': 365,
      }
      return map[state.timeframe]
    },

    timeframeHours: (state): number => {
      const map: Record<PulseTimeframe, number> = {
        '24H': 24,
        '7D': 168,
        '30D': 720,
        '1Y': 8760,
        'MAX': 8760,
      }
      return map[state.timeframe]
    },

    isAnalystMode: state => state.viewMode === 'analyst',

    lastUpdatedRelative: (state) => {
      if (!state.lastUpdated) return '—'
      const last = new Date(state.lastUpdated).getTime()
      if (Number.isNaN(last)) return '—'
      const diff = Date.now() - last
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
    },

    setTimeframe(timeframe: PulseTimeframe) {
      this.timeframe = timeframe
    },

    setViewMode(mode: PulseViewMode) {
      this.viewMode = mode
    },

    toggleViewMode() {
      this.viewMode = this.viewMode === 'sender' ? 'analyst' : 'sender'
    },

    setAmount(amount: number) {
      this.amount = amount
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setLastUpdated(iso: string) {
      this.lastUpdated = iso
    },

    async initFromRoute(query: Record<string, string | undefined>) {
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
        if (this.corridor.corridorId) {
          params.corridor_id = this.corridor.corridorId
        }
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
