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

type AlertsApiResponse = {
  success: boolean
  alerts?: Alert[]
  alert?: Alert
  status?: 'created' | 'already_exists'
  error?: string
  message?: string
  limit?: number
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
  const { isLoggedIn } = useAuth()
  const { request } = useApi()

  const { state: alerts, hydrated: localStorageHydrated, reset: resetLocalStorage } = usePersistedState<Alert[]>(
    'alerts:items',
    () => [],
    { validate: (value): value is Alert[] => Array.isArray(value) },
  )

  const hydrated = useState<boolean>('alerts:api:hydrated', () => false)
  const syncing = useState<boolean>('alerts:syncing', () => false)

  const { state: historyByAlertId } = usePersistedState<Record<string, AlertHistoryEvent[]>>(
    'alerts:history',
    () => ({}),
    { validate: (value): value is Record<string, AlertHistoryEvent[]> => !!value && typeof value === 'object' },
  )

  const count = computed(() => alerts.value.length)

  async function fetchFromBackend() {
    if (!isLoggedIn.value) {
      hydrated.value = true
      return
    }

    try {
      syncing.value = true
      const response = await request<AlertsApiResponse>('/alerts')
      
      if (response.success && response.alerts) {
        alerts.value = response.alerts.sort(sortByUpdatedDesc)
        hydrated.value = true
      } else {
        console.warn('Failed to fetch alerts from backend:', response)
        hydrated.value = true
      }
    } catch (error) {
      console.error('Error fetching alerts from backend:', error)
      hydrated.value = true
    } finally {
      syncing.value = false
    }
  }

  async function syncToBackend(operation: 'create' | 'update' | 'delete', alert: Alert | Partial<Alert>, id?: string) {
    if (!isLoggedIn.value) {
      return
    }

    try {
      if (operation === 'create') {
        const fullAlert = alert as Alert
        const response = await request<AlertsApiResponse>('/alerts', {
          method: 'POST',
          body: {
            watchlistItemId: fullAlert.watchlistItemId,
            rule: fullAlert.rule,
            frequency: fullAlert.frequency,
            enabled: fullAlert.enabled,
          },
        })

        if (response.success && response.alert) {
          const existingIndex = alerts.value.findIndex(a => a.id === response.alert!.id)
          if (existingIndex >= 0) {
            alerts.value[existingIndex] = response.alert
          } else {
            alerts.value = [response.alert, ...alerts.value].sort(sortByUpdatedDesc)
          }
        }
      } else if (operation === 'update' && id) {
        const patch = alert as Partial<Alert>
        const response = await request<AlertsApiResponse>(`/alerts/${id}`, {
          method: 'PATCH',
          body: {
            rule: patch.rule,
            frequency: patch.frequency,
            enabled: patch.enabled,
          },
        })

        if (response.success && response.alert) {
          const index = alerts.value.findIndex(a => a.id === id)
          if (index >= 0) {
            alerts.value[index] = response.alert
            alerts.value = [...alerts.value].sort(sortByUpdatedDesc)
          }
        }
      } else if (operation === 'delete' && id) {
        await request<AlertsApiResponse>(`/alerts/${id}`, {
          method: 'DELETE',
        })
      }
    } catch (error) {
      console.error(`Error syncing ${operation} to backend:`, error)
    }
  }

  onMounted(async () => {
    if (isLoggedIn.value) {
      await fetchFromBackend()
    } else {
      hydrated.value = localStorageHydrated.value
    }
  })

  watch(isLoggedIn, async (loggedIn) => {
    if (loggedIn) {
      await fetchFromBackend()
    } else {
      hydrated.value = localStorageHydrated.value
    }
  })

  function findById(id: string) {
    return alerts.value.find(a => a.id === id) ?? null
  }

  function listByWatchlistItemId(watchlistItemId: string) {
    return alerts.value.filter(a => a.watchlistItemId === watchlistItemId)
  }

  function ruleKey(rule: AlertRule) {
    return `${rule.metric}:${rule.comparator}:${rule.value}:${rule.currency ?? ''}`
  }

  async function createForWatchlistItem(
    watchlistItemId: string,
    draft?: Partial<Pick<Alert, 'frequency' | 'enabled'>> & { rule?: Partial<AlertRule> },
  ): Promise<CreateAlertResult> {
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
      
      if (isLoggedIn.value) {
        await syncToBackend('update', existing, existing.id)
      }
      
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

    if (isLoggedIn.value) {
      await syncToBackend('create', next)
    }

    return { status: 'created', alert: next, watchlistItemId }
  }

  async function createForTarget(
    target: WatchTarget,
    draft?: Partial<Pick<Alert, 'frequency' | 'enabled'>> & {
      rule?: Partial<AlertRule>
      label?: string
    },
  ): Promise<CreateAlertResult> {
    const ensured = await watchlist.ensure(target, draft?.label ? { label: draft.label } : undefined)
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

  async function update(id: string, patch: Partial<Omit<Alert, 'id' | 'createdAt'>>) {
    const existing = findById(id)
    if (!existing) return
    
    const next: Alert = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    alerts.value = [next, ...alerts.value.filter(a => a.id !== id)].sort(sortByUpdatedDesc)

    if (isLoggedIn.value) {
      await syncToBackend('update', patch, id)
    }
  }

  async function remove(id: string) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index === -1) return

    alerts.value = alerts.value.filter(a => a.id !== id)
    const { [id]: _removed, ...rest } = historyByAlertId.value
    historyByAlertId.value = rest

    if (isLoggedIn.value) {
      await syncToBackend('delete', {} as Alert, id)
    }
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

  function reset() {
    alerts.value = []
    resetLocalStorage()
    if (isLoggedIn.value) {
      fetchFromBackend()
    }
  }

  return {
    alerts,
    hydrated: computed(() => hydrated.value && localStorageHydrated.value),
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
    syncing: readonly(syncing),
    refresh: fetchFromBackend,
  }
}
