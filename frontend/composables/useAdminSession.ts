type AdminSessionState = {
  accessToken: string | null
  expiresAt: number | null
}

type AdminExchangeResponse = {
  access_token: string
  expires_in: number
  token_type: string
}

const ADMIN_SESSION_SKEW_SECONDS = 60

const decodeJwtExpiry = (token: string): number | null => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    const exp = Number(payload?.exp)
    return Number.isFinite(exp) ? exp : null
  }
  catch {
    return null
  }
}

const isTokenUsable = (state: AdminSessionState) => {
  if (!state.accessToken || !state.expiresAt) return false
  const now = Math.floor(Date.now() / 1000)
  return state.expiresAt > now + ADMIN_SESSION_SKEW_SECONDS
}

export const useAdminSession = () => {
  const { request } = useApi()
  const { signOut, session, ensureHydrated } = useAuth()
  const state = useState<AdminSessionState>('auth:admin-session', () => ({
    accessToken: null,
    expiresAt: null,
  }))

  const clearAdminSession = () => {
    state.value = {
      accessToken: null,
      expiresAt: null,
    }
  }

  const applyAdminToken = (payload: AdminExchangeResponse | null | undefined) => {
    if (!payload?.access_token) {
      clearAdminSession()
      return null
    }

    const expFromToken = decodeJwtExpiry(payload.access_token)
    const fallbackExp = Math.floor(Date.now() / 1000) + Math.max(60, Number(payload.expires_in) || 0)

    state.value = {
      accessToken: payload.access_token,
      expiresAt: expFromToken ?? fallbackExp,
    }

    return payload.access_token
  }

  const exchangeAdminSession = async () => {
    await ensureHydrated()

    const supabaseToken = session.value?.access_token
    if (!supabaseToken) return null

    const response = await request<AdminExchangeResponse>('/sessions/admin/exchange', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${supabaseToken}`,
      },
      retries: 0,
    })

    return applyAdminToken(response)
  }

  const refreshAdminSession = async () => {
    const response = await request<AdminExchangeResponse>('/sessions/admin/refresh', {
      method: 'POST',
      body: {},
      retries: 0,
    })
    return applyAdminToken(response)
  }

  const ensureAdminSession = async () => {
    await ensureHydrated()

    if (isTokenUsable(state.value)) {
      return true
    }

    try {
      const refreshed = await refreshAdminSession()
      if (refreshed) return true
    }
    catch {
      // fall through to exchange flow
    }

    try {
      const exchanged = await exchangeAdminSession()
      return Boolean(exchanged)
    }
    catch {
      clearAdminSession()
      return false
    }
  }

  const signOutAdmin = async () => {
    try {
      await request('/sessions/current', {
        method: 'DELETE',
        headers: state.value.accessToken
          ? { authorization: `Bearer ${state.value.accessToken}` }
          : undefined,
        retries: 0,
      })
    }
    catch {
      // continue local sign-out even when backend logout fails
    }

    clearAdminSession()
    await signOut()
  }

  const accessToken = computed(() => state.value.accessToken)
  const expiresAt = computed(() => state.value.expiresAt)
  const isActive = computed(() => isTokenUsable(state.value))

  return {
    accessToken,
    expiresAt,
    isActive,
    clearAdminSession,
    exchangeAdminSession,
    refreshAdminSession,
    ensureAdminSession,
    signOutAdmin,
  }
}
