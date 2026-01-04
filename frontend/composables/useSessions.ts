type SessionItem = {
  id: string
  session_id: string
  device_type: string | null
  location: string | null
  ip_address: string | null
  last_activity: string
  created_at: string
  is_current: boolean
}

type SessionsResponse = {
  sessions: SessionItem[]
}

export const useSessions = () => {
  const { request } = useApi()
  const sessions = ref<SessionItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSessions = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await request<SessionsResponse>('/sessions')
      sessions.value = Array.isArray(data.sessions) ? data.sessions : []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load sessions.'
    } finally {
      loading.value = false
    }
  }

  const revokeSession = async (sessionId: string) => {
    await request(`/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    })
    await fetchSessions()
  }

  const revokeAllSessions = async (exceptSessionId?: string) => {
    await request('/sessions/revoke-all', {
      method: 'POST',
      body: exceptSessionId ? { except_session_id: exceptSessionId } : {},
    })
    await fetchSessions()
  }

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    revokeSession,
    revokeAllSessions,
  }
}
