import { ref, onMounted, onUnmounted, watch } from 'vue'

const CHECK_INTERVAL_MS = 60_000
const WARNING_THRESHOLD_SECONDS = 10 * 60
const RECENT_ACTIVITY_WINDOW_MS = 20 * 60_000
const REFRESH_THROTTLE_MS = 60_000

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(normalized)) as Record<string, unknown>
  }
 catch {
    return null
  }
}

export const useSessionTimeout = () => {
  const { session } = useAuth()
  const showWarning = ref(false)

  let intervalId: ReturnType<typeof setInterval> | null = null
  let lastActivity = Date.now()
  let lastRefreshAttempt = 0

  const markActivity = () => {
    lastActivity = Date.now()
  }

  const getSecondsUntilExpiry = () => {
    const token = session.value?.access_token
    if (!token) return null

    const payload = decodeJwtPayload(token)
    const expiresAt = typeof payload?.exp === 'number' ? payload.exp : null
    if (!expiresAt) return null

    return expiresAt - Math.floor(Date.now() / 1000)
  }

  const refreshSession = async () => {
    if (!import.meta.client) return false
    const supabase = useSupabaseClient()
    if (!supabase) return false

    try {
      const { data } = await supabase.auth.refreshSession()
      return Boolean(data.session?.access_token)
    }
 catch {
      return false
    }
  }

  const maybeRefreshSession = async (options: { force?: boolean } = {}) => {
    if (!import.meta.client || !session.value?.access_token) {
      showWarning.value = false
      return
    }

    const secondsUntilExpiry = getSecondsUntilExpiry()
    if (secondsUntilExpiry === null) return

    if (secondsUntilExpiry > WARNING_THRESHOLD_SECONDS) {
      showWarning.value = false
      return
    }

    const isRecentlyActive = Date.now() - lastActivity < RECENT_ACTIVITY_WINDOW_MS
    const canAttemptRefresh
      = options.force || isRecentlyActive || document.visibilityState === 'visible'

    if (!canAttemptRefresh) {
      showWarning.value = true
      return
    }

    if (Date.now() - lastRefreshAttempt < REFRESH_THROTTLE_MS) {
      showWarning.value = true
      return
    }

    lastRefreshAttempt = Date.now()
    const refreshed = await refreshSession()
    const remaining = getSecondsUntilExpiry()
    showWarning.value = refreshed
      ? Boolean(remaining !== null && remaining <= WARNING_THRESHOLD_SECONDS)
      : true
  }

  const handleVisibilityChange = () => {
    if (!import.meta.client || document.visibilityState !== 'visible') return
    markActivity()
    void maybeRefreshSession({ force: true })
  }

  const handleFocus = () => {
    markActivity()
    void maybeRefreshSession({ force: true })
  }

  onMounted(() => {
    if (!import.meta.client) return

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'mousedown',
      'scroll',
      'touchstart',
    ]

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true })
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    intervalId = setInterval(() => {
      void maybeRefreshSession()
    }, CHECK_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
    if (!import.meta.client) return

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'mousedown',
      'scroll',
      'touchstart',
    ]

    for (const eventName of activityEvents) {
      window.removeEventListener(eventName, markActivity)
    }

    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('online', handleFocus)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  watch(
    () => session.value?.access_token ?? null,
    (token) => {
      if (!token) {
        showWarning.value = false
        return
      }
      markActivity()
      void maybeRefreshSession()
    },
    { immediate: true },
  )

  const refresh = async () => {
    const refreshed = await refreshSession()
    showWarning.value = !refreshed
  }

  return { showWarning, refresh }
}
