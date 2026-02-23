import type { Method } from '~/types/remit'

export type WatchTarget =
  | {
    type: 'corridor'
    from: string
    to: string
    method?: Method
  }
  | {
    type: 'fxPair'
    base: string
    quote: string
  }
  | {
    type: 'pulseChart'
    chartId: string
  }
  | {
    type: 'guide'
    slug: string
  }

export type WatchlistItem = {
  id: string
  target: WatchTarget
  label: string
  createdAt: string
  updatedAt: string
}

export type AlertComparator = 'gt' | 'gte' | 'lt' | 'lte' | 'crosses_above' | 'crosses_below'
export type AlertFrequency = 'weekly' | 'daily'

export type AlertRule = {
  metric: 'rate' | 'midMarketRate' | 'recipientGets' | 'totalCost' | 'fee' | 'index' | 'sendScore' | 'rci_threshold' | 'rvi_threshold'
  comparator: AlertComparator
  value: number
  currency?: string
}

export type Alert = {
  id: string
  watchlistItemId: string
  rule: AlertRule
  frequency: AlertFrequency
  enabled: boolean
  createdAt: string
  updatedAt: string
  lastTriggeredAt?: string
}

export type AlertHistoryEvent = {
  id: string
  alertId: string
  triggeredAt: string
  message: string
  snapshot?: Record<string, unknown>
}
