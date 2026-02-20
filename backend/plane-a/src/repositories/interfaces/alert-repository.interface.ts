export type AlertRuleInput = {
  watchlist_item_id: string
  metric:
    | 'rate'
    | 'recipientGets'
    | 'totalCost'
    | 'fee'
    | 'index'
    | 'midMarketRate'
    | 'sendScore'
    | 'rci_threshold'
    | 'rvi_threshold'
  comparator: 'gt' | 'gte' | 'lt' | 'lte' | 'crosses_above' | 'crosses_below'
  threshold: number
  currency?: string | null
  frequency: 'weekly' | 'daily'
  enabled: boolean
  cooldown_minutes?: number
}

export type AlertRuleRow = {
  id: string
  watchlist_item_id: string
  metric: string
  comparator: string
  threshold: number
  currency: string | null
  frequency: string
  enabled: boolean
  cooldown_minutes: number
  created_at: Date
  updated_at: Date
}

export type AlertWithStateRow = AlertRuleRow & {
  last_triggered_at: Date | null
  last_value: number | null
  in_alarm: boolean
}

export type AlertStateRow = {
  alert_id: string
  last_evaluated_at: Date | null
  last_value: number | null
  in_alarm: boolean
  last_triggered_at: Date | null
  last_notified_at: Date | null
  snoozed_until: Date | null
  version: number
}

export type AlertEventRow = {
  id: string
  alert_id: string
  triggered_at: Date
  value: number
  message: string
  context: Record<string, unknown> | null
  notification_status: 'queued' | 'sent' | 'failed'
  provider_safe: boolean
}

export interface IAlertRepository {
  listByUserId(userId: string): Promise<AlertWithStateRow[]>
  findById(id: string, userId: string): Promise<AlertRuleRow | null>
  findByWatchlistItemAndRule(
    watchlistItemId: string,
    metric: string,
    comparator: string,
    threshold: number,
    currency?: string | null,
  ): Promise<AlertRuleRow | null>
  create(input: AlertRuleInput): Promise<AlertRuleRow>
  update(
    id: string,
    userId: string,
    updates: {
      metric?: string
      comparator?: string
      threshold?: number
      currency?: string | null
      frequency?: string
      cooldown_minutes?: number
      enabled?: boolean
    },
  ): Promise<AlertRuleRow | null>
  delete(id: string, userId: string): Promise<boolean>
  countByUserId(userId: string): Promise<number>
  getAlertState(alertId: string): Promise<AlertStateRow | null>
  updateAlertState(
    alertId: string,
    updates: {
      last_evaluated_at?: Date
      last_value?: number | null
      in_alarm?: boolean
      last_triggered_at?: Date | null
      last_notified_at?: Date | null
      snoozed_until?: Date | null
      version?: number
    },
  ): Promise<void>
  createAlertEvent(
    alertId: string,
    value: number,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<AlertEventRow>
  updateAlertEventStatus(eventId: string, status: 'queued' | 'sent' | 'failed'): Promise<void>
  getAlertWithWatchlist(alertId: string): Promise<{
    alert: AlertRuleRow
    watchlist_item: {
      user_id: string
      target_type: string
      target_payload: Record<string, unknown>
    }
    state: AlertStateRow | null
  } | null>
}
