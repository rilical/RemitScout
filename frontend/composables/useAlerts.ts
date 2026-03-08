import { createId } from '~/utils/id'
import type { Alert, AlertHistoryEvent, AlertRule, WatchTarget } from '~/types/tracking'
import { extractPlanStateFailure, mapPlanStateFailureMessage, resolvePlanStateFailureCode } from '~/composables/usePlanStateError'

export type CreateAlertResult
  = | {
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
  | {
    status: 'error'
    message: string
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
      throw new Error('Guide alerts are not supported yet.')
    case 'triangulatedCorridor':
      return { metric: 'rate', comparator: 'gte', value: 0 }
  }
}

export const useAlerts = () => {
  const { limits } = useEntitlements()
  const watchlist = useWatchlist()
  const { isLoggedIn } = useAuth()
  const { request } = useApi()
  const toast = useToast()

  const { state: alerts, hydrated: localStorageHydrated, reset: resetLocalStorage } = usePersistedState<Alert[]>(
    'alerts:items',
    () => [],
    { validate: (value): value is Alert[] => Array.isArray(value), requiredConsent: 'functional' },
  )

  const hydrated = useState<boolean>('alerts:api:hydrated', () => false)
  const syncing = useState<boolean>('alerts:syncing', () => false)

  const { state: historyByAlertId } = usePersistedState<Record<string, AlertHistoryEvent[]>>(
    'alerts:history',
    () => ({}),
    { validate: (value): value is Record<string, AlertHistoryEvent[]> => !!value && typeof value === 'object', requiredConsent: 'functional' },
  )

  const count = computed(() => alerts.value.length)

  const alertKey = (watchlistItemId: string, rule: AlertRule) => `${watchlistItemId}:${ruleKey(rule)}`

  const upsertAlert = (next: Alert) => {
    const existingIndex = alerts.value.findIndex(a => a.id === next.id)
    if (existingIndex >= 0) {
      alerts.value[existingIndex] = next
      alerts.value = [...alerts.value].sort(sortByUpdatedDesc)
      return
    }
    alerts.value = [next, ...alerts.value].sort(sortByUpdatedDesc)
  }

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
      }
      else {
        useLogger('alerts').warn('Failed to fetch alerts from backend', response)
        hydrated.value = true
      }
    }
    catch (error) {
      useLogger('alerts').error('Error fetching alerts from backend', error)
      hydrated.value = true
    }
    finally {
      syncing.value = false
    }
  }

  async function syncLocalAlerts(localAlerts: Alert[], idMap: Record<string, string>) {
    if (!localAlerts.length) return false

    const serverKeys = new Set(alerts.value.map(alert => alertKey(alert.watchlistItemId, alert.rule)))
    let created = false

    for (const localAlert of localAlerts) {
      const mappedWatchlistId = idMap[localAlert.watchlistItemId] || localAlert.watchlistItemId
      if (!mappedWatchlistId) continue
      const key = alertKey(mappedWatchlistId, localAlert.rule)
      if (serverKeys.has(key)) {
        continue
      }

      try {
        const result = await createAlertInBackend({
          watchlistItemId: mappedWatchlistId,
          rule: localAlert.rule,
          frequency: localAlert.frequency,
          enabled: localAlert.enabled,
        })
        if (result.status === 'created' || result.status === 'already_exists') {
          created = true
          serverKeys.add(key)
        }
      }
      catch (error) {
        useLogger('alerts').error('Error syncing local alert to backend', error)
      }
    }

    return created
  }

  async function createAlertInBackend(payload: {
    watchlistItemId: string
    rule: AlertRule
    frequency: Alert['frequency']
    enabled: boolean
  }): Promise<CreateAlertResult> {
    let response: AlertsApiResponse
    try {
      response = await request<AlertsApiResponse>('/alerts', {
        method: 'POST',
        body: {
          watchlistItemId: payload.watchlistItemId,
          rule: payload.rule,
          frequency: payload.frequency,
          enabled: payload.enabled,
        },
      })
    }
    catch (error) {
      const failure = extractPlanStateFailure(error)
      const failureCode = resolvePlanStateFailureCode(failure)
      if (failureCode === 'plus_required' || failureCode === 'enterprise_required' || failureCode === 'plan_inactive') {
        return {
          status: 'error',
          message: mapPlanStateFailureMessage(error, 'This alert is not available on your current plan.', {
            plus_required: 'This alert requires Plus.',
            enterprise_required: 'This alert requires Enterprise.',
            plan_inactive: 'Your paid plan is inactive. Reactivate billing to use this alert.',
          }),
        }
      }
      throw error
    }

    if (response.success && response.alert) {
      upsertAlert(response.alert)
      return {
        status: response.status ?? 'created',
        alert: response.alert,
        watchlistItemId: payload.watchlistItemId,
      }
    }

    if (response.error === 'limit_reached') {
      return {
        status: 'alert_limit_reached',
        limit: response.limit ?? 0,
        message: response.message ?? 'Alert limit reached.',
        watchlistItemId: payload.watchlistItemId,
      }
    }

    if (response.error === 'forbidden') {
      return {
        status: 'error',
        message: response.message ?? 'This alert requires Plus.',
      }
    }

    throw new Error(response.message || response.error || 'Failed to create alert')
  }

  async function syncToBackend(operation: 'create' | 'update' | 'delete', alert: Alert | Partial<Alert>, id?: string): Promise<boolean> {
    if (!isLoggedIn.value) {
      return true
    }

    try {
      if (operation === 'create') {
        const fullAlert = alert as Alert
        await createAlertInBackend({
          watchlistItemId: fullAlert.watchlistItemId,
          rule: fullAlert.rule,
          frequency: fullAlert.frequency,
          enabled: fullAlert.enabled,
        })
        return true
      }
      else if (operation === 'update' && id) {
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
          upsertAlert(response.alert)
        }
        return true
      }
      else if (operation === 'delete' && id) {
        await request<AlertsApiResponse>(`/alerts/${id}`, {
          method: 'DELETE',
        })
        return true
      }

      return true
    }
    catch (error) {
      useLogger('alerts').error(`Error syncing ${operation} to backend`, error)
      return false
    }
  }

  onMounted(async () => {
    if (isLoggedIn.value) {
      resetLocalStorage()
      await fetchFromBackend()
    }
    else {
      hydrated.value = localStorageHydrated.value
    }
  })

  watch(isLoggedIn, async (loggedIn) => {
    if (loggedIn) {
      resetLocalStorage()
      await fetchFromBackend()
    }
    else {
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

    const next = {
      watchlistItemId,
      rule: nextRule,
      frequency: draft?.frequency ?? 'weekly',
      enabled: draft?.enabled ?? true,
    }

    if (isLoggedIn.value) {
      try {
        return await createAlertInBackend(next)
      }
      catch (error) {
        useLogger('alerts').error('Error creating alert on backend', error)
        toast.error('Failed to create alert. Please try again.')
        return {
          message: 'Unable to create alert right now.',
          status: 'error',
        }
      }
    }

    const localAlert: Alert = {
      id: createId('al'),
      watchlistItemId,
      rule: nextRule,
      frequency: next.frequency,
      enabled: next.enabled,
      createdAt: now,
      updatedAt: now,
    }

    alerts.value = [localAlert, ...alerts.value].sort(sortByUpdatedDesc)

    return { status: 'created', alert: localAlert, watchlistItemId }
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
    if (ensured.status === 'error') {
      return {
        status: 'error',
        message: ensured.message,
      }
    }

    let baseRule: AlertRule
    try {
      baseRule = defaultRuleForTarget(target)
    }
    catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'This target type does not support alerts.',
      }
    }

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

  async function remove(id: string): Promise<boolean> {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index === -1) return true

    const removedAlert = alerts.value[index]
    const removedHistory = historyByAlertId.value[id] ?? null

    alerts.value = alerts.value.filter(a => a.id !== id)
    const { [id]: _removed, ...rest } = historyByAlertId.value
    historyByAlertId.value = rest

    if (isLoggedIn.value) {
      const ok = await syncToBackend('delete', {} as Alert, id)
      if (!ok) {
        // Roll back local removal if backend deletion fails.
        alerts.value = [removedAlert, ...alerts.value].sort(sortByUpdatedDesc)
        if (removedHistory) {
          historyByAlertId.value = { ...historyByAlertId.value, [id]: removedHistory }
        }
        toast.error('Unable to delete alert right now. Please try again.')
        return false
      }
    }

    return true
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
