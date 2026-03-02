import { ref, onMounted, onUnmounted } from 'vue'

export const useSessionTimeout = () => {
  const { session } = useAuth()
  const showWarning = ref(false)

  const CHECK_INTERVAL = 60_000 // 60 seconds
  const WARNING_THRESHOLD = 50 * 60 // 50 minutes in seconds

  let intervalId: ReturnType<typeof setInterval> | null = null
  let lastActivity = Date.now()

  const onActivity = () => {
    lastActivity = Date.now()
  }

  const refreshSession = async () => {
    if (!import.meta.client) return
    const supabase = useSupabaseClient()
    if (!supabase) return
    try {
      await supabase.auth.refreshSession()
    }
 catch {
      // Refresh failed silently; session will expire naturally
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('mousemove', onActivity)
      window.addEventListener('keydown', onActivity)

      intervalId = setInterval(() => {
        if (!session.value?.access_token) return

        const parts = session.value.access_token.split('.')
        if (parts.length !== 3) return

        try {
          const payload = JSON.parse(atob(parts[1]))
          const age = Math.floor(Date.now() / 1000) - (payload.iat ?? 0)

          if (age >= WARNING_THRESHOLD) {
            // Auto-refresh if user was recently active (within last 5 minutes)
            if (Date.now() - lastActivity < 5 * 60_000) {
              void refreshSession()
              showWarning.value = false
            }
 else {
              showWarning.value = true
            }
          }
        }
 catch {
          // Malformed JWT payload; skip this check cycle
        }
      }, CHECK_INTERVAL)
    }
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
    if (import.meta.client) {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  })

  const refresh = async () => {
    await refreshSession()
    showWarning.value = false
  }

  return { showWarning, refresh }
}
