import { createId } from '~/utils/id'
import type { Alert, AlertHistoryEvent, AlertRule, WatchTarget } from '~/types/tracking'

export type CreateAlertResult =
  | {
    status: 'created' | 'already_exists'
    alert: Alert
    watchlistItemId: string
  }
  | {
    status: 'watchlist_limit_reached'
    limit: number
    message: string
  }
  | {
    status: 'alert_limit_reached'
    limit: number
    message: string
    watchlistItemId: string
  }

function sortByUpdatedDesc(a: Alert, b: Alert) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function defaultRuleForTarget(target: WatchTarget): AlertRule {
  switch (target.type) {
    case 'corridor':
      return { metric: 'recipientGets', comparator: 'gte', value: 0 }
    case 'fxPair':
      return { metric: 'rate', comparator: 'gte', value: 0 }
    case 'pulseChart':
      return { metric: 'index', comparator: 'gte', value: 0 }
    case 'guide':
      return { metric: 'index', comparator: 'gte', value: 0 }
  }
}

export const useAlerts = () => {
  const { limits } = useEntitlements()
  const watchlist = useWatchlist()

  const { state: alerts, hydrated, reset } = usePersistedState<Alert[]>(
    'alerts:items',
    () => [],
    { validate: (value): value is Alert[] => Array.isArray(value) },
  )

  const { state: historyByAlertId } = usePersistedState<Record<string, AlertHistoryEvent[]>>(
    'alerts:history',
    () => ({}),
    { validate: (value): value is Record<string, AlertHistoryEvent[]> => !!value && typeof value === 'object' },
  )

  const count = computed(() => alerts.value.length)

  function findById(id: string) {
    return alerts.value.find(a => a.id === id) ?? null
  }

  function listByWatchlistItemId(watchlistItemId: string) {
    return alerts.value.filter(a => a.watchlistItemId === watchlistItemId)
  }

  function ruleKey(rule: AlertRule) {
    return `${rule.metric}:${rule.comparator}:${rule.value}:${rule.currency ?? ''}`
  }

  function createForWatchlistItem(
    watchlistItemId: string,
    draft?: Partial<Pick<Alert, 'frequency' | 'enabled'>> & { rule?: Partial<AlertRule> },
  ): CreateAlertResult {
    const limit = limits.value.alerts
    if (limit !== 'unlimited' && alerts.value.length >= limit) {
      return {
        status: 'alert_limit_reached',
        limit,
        message: `Free plan supports up to ${limit} alert${limit === 1 ? '' : 's'}.`,
        watchlistItemId,
      }
    }

    const now = new Date().toISOString()
    const baseRule = { metric: 'rate', comparator: 'gte', value: 0 } satisfies AlertRule
    const nextRule: AlertRule = { ...baseRule, ...(draft?.rule ?? {}) }

    const existing = alerts.value.find(
      a => a.watchlistItemId === watchlistItemId && ruleKey(a.rule) === ruleKey(nextRule),
    )
    if (existing) {
      existing.updatedAt = now
      alerts.value = [...alerts.value].sort(sortByUpdatedDesc)
      return { status: 'already_exists', alert: existing, watchlistItemId }
    }

    const next: Alert = {
      id: createId('al'),
      watchlistItemId,
      rule: nextRule,
      frequency: draft?.frequency ?? 'daily',
      enabled: draft?.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    }

    alerts.value = [next, ...alerts.value].sort(sortByUpdatedDesc)
    return { status: 'created', alert: next, watchlistItemId }
  }

  function createForTarget(
    target: WatchTarget,
    draft?: Partial<Pick<Alert, 'frequency' | 'enabled'>> & {
      rule?: Partial<AlertRule>
      label?: string
    },
  ): CreateAlertResult {
    const ensured = watchlist.ensure(target, draft?.label ? { label: draft.label } : undefined)
    if (ensured.status === 'limit_reached') {
      return {
        status: 'watchlist_limit_reached',
        limit: ensured.limit,
        message: ensured.message,
      }
    }

    const baseRule = defaultRuleForTarget(target)
    const mergedDraft = {
      ...draft,
      rule: { ...baseRule, ...(draft?.rule ?? {}) },
    }

    return createForWatchlistItem(ensured.item.id, mergedDraft)
  }

  function update(id: string, patch: Partial<Omit<Alert, 'id' | 'createdAt'>>) {
    const existing = findById(id)
    if (!existing) return
    const next: Alert = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    alerts.value = [next, ...alerts.value.filter(a => a.id !== id)].sort(sortByUpdatedDesc)
  }

  function remove(id: string) {
    alerts.value = alerts.value.filter(a => a.id !== id)
    const { [id]: _removed, ...rest } = historyByAlertId.value
    historyByAlertId.value = rest
  }

  function toggleEnabled(id: string) {
    const existing = findById(id)
    if (!existing) return
    update(id, { enabled: !existing.enabled })
  }

  function addHistoryEvent(alertId: string, message: string, snapshot?: Record<string, unknown>) {
    const now = new Date().toISOString()
    const event: AlertHistoryEvent = {
      id: createId('evt'),
      alertId,
      triggeredAt: now,
      message,
      snapshot,
    }
    historyByAlertId.value = {
      ...historyByAlertId.value,
      [alertId]: [event, ...(historyByAlertId.value[alertId] ?? [])].slice(0, 50),
    }
    const existing = findById(alertId)
    if (existing) {
      update(alertId, { lastTriggeredAt: now })
    }
  }

  function getHistory(alertId: string) {
    return historyByAlertId.value[alertId] ?? []
  }

  return {
    alerts,
    hydrated,
    count,
    findById,
    listByWatchlistItemId,
    createForTarget,
    createForWatchlistItem,
    update,
    remove,
    toggleEnabled,
    addHistoryEvent,
    getHistory,
    reset,
  }
}
