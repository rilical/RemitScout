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
const ADMIN_SESSION_HINT_KEY = 'rs:admin-session-seeded'

const isBrowser = () => typeof window !== 'undefined'

const readAdminSessionHint = (): boolean => {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(ADMIN_SESSION_HINT_KEY) === '1'
  }
  catch {
    return false
  }
}

const writeAdminSessionHint = (enabled: boolean) => {
  if (!isBrowser()) return
  try {
    if (enabled) {
      window.localStorage.setItem(ADMIN_SESSION_HINT_KEY, '1')
      return
    }
    window.localStorage.removeItem(ADMIN_SESSION_HINT_KEY)
  }
  catch {
    // Best-effort only; admin session bootstrap must not depend on localStorage access.
  }
}

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
  const bootstrap = useState<Promise<boolean> | null>('auth:admin-session-bootstrap', () => null)

  const clearAdminSession = (options: { clearHint?: boolean } = {}) => {
    state.value = {
      accessToken: null,
      expiresAt: null,
    }
    if (options.clearHint) {
      writeAdminSessionHint(false)
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
    writeAdminSessionHint(true)

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

  const recoverSupabaseSession = async () => {
    if (!isBrowser()) return null

    try {
      const supabase = useSupabaseClient()
      if (!supabase) return null

      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session?.access_token) {
        return null
      }

      session.value = data.session
      return data.session.access_token
    }
    catch {
      return null
    }
  }

  const ensureAdminSession = async () => {
    if (isTokenUsable(state.value)) {
      return true
    }

    if (bootstrap.value) {
      return await bootstrap.value
    }

    const tryRefresh = async () => {
      try {
        const refreshed = await refreshAdminSession()
        return Boolean(refreshed)
      }
      catch {
        return false
      }
    }

    const tryExchange = async () => {
      try {
        const exchanged = await exchangeAdminSession()
        return Boolean(exchanged)
      }
      catch {
        return false
      }
    }

    bootstrap.value = (async () => {
      await ensureHydrated()

      if (isTokenUsable(state.value)) {
        return true
      }

      const hasAdminHint = readAdminSessionHint()
      let hasSupabaseToken = Boolean(session.value?.access_token)

      if (!hasSupabaseToken && hasAdminHint) {
        hasSupabaseToken = Boolean(await recoverSupabaseSession())
      }

      // On the first admin page after a fresh sign-in there is no refresh cookie yet,
      // so start with exchange when we already have a Supabase session.
      if (hasSupabaseToken && await tryExchange()) {
        return true
      }
      if (await tryRefresh()) {
        return true
      }

      clearAdminSession()
      return false
    })().finally(() => {
      bootstrap.value = null
    })

    return await bootstrap.value
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

    clearAdminSession({ clearHint: true })
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
