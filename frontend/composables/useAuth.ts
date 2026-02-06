import type { Session, User as SupabaseUser } from '@supabase/supabase-js'

type OAuthProvider = 'google'

export interface User {
  id: string
  email: string
  name: string
}

type BackendProfile = {
  user_id: string
  email: string
  name?: string | null
}

type AuthResult = {
  ok: boolean
  error?: string
}

type SignUpInput = {
  name: string
  email: string
  password: string
}

const isEmailConfirmed = (supabaseUser: SupabaseUser | null): boolean => {
  if (!supabaseUser) return false
  const confirmedAt
    = supabaseUser.email_confirmed_at
      || (supabaseUser as { confirmed_at?: string | null }).confirmed_at
      || null
  return Boolean(confirmedAt)
}

const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null
  const metadata = supabaseUser.user_metadata || {}
  const email = supabaseUser.email || ''
  const name
    = metadata.full_name
      || metadata.name
      || metadata.display_name
      || (email ? email.split('@')[0] : 'User')

  return {
    id: supabaseUser.id,
    email,
    name,
  }
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || '/api'

  const user = useState<User | null>('auth:user', () => null)
  const session = useState<Session | null>('auth:session', () => null)
  const hydrated = useState<boolean>('auth:hydrated', () => false)
  const initPromise = useState<Promise<void> | null>('auth:init', () => null)
  const listenerAttached = useState<boolean>('auth:listener', () => false)
  const lastError = useState<string | null>('auth:error', () => null)

  const isLoggedIn = computed(() => user.value !== null)
  const isAuthenticated = isLoggedIn
  const accessToken = computed(() => session.value?.access_token ?? null)
  const isConfigured = computed(() => Boolean(
    config.public.supabaseUrl && config.public.supabaseAnonKey,
  ))

  const setSession = (nextSession: Session | null) => {
    const effectiveSession = nextSession?.user && !isEmailConfirmed(nextSession.user)
      ? null
      : nextSession
    session.value = effectiveSession
    user.value = mapSupabaseUser(effectiveSession?.user ?? null)
    hydrated.value = true
  }

  const getSupabase = () => {
    if (!import.meta.client) return null
    return useSupabaseClient()
  }

  const getRedirectBase = () => {
    if (config.public.siteUrl) return config.public.siteUrl
    if (import.meta.client && typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }

  const buildApiUrl = (path: string) => {
    if (/^https?:\/\//.test(path)) return path
    const cleanedBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase
    const cleanedPath = path.startsWith('/') ? path : `/${path}`
    if (cleanedPath === cleanedBase || cleanedPath.startsWith(`${cleanedBase}/`)) {
      return cleanedPath
    }
    return `${cleanedBase}${cleanedPath}`
  }

  const ensureHydrated = async () => {
    if (hydrated.value) return
    if (!import.meta.client) {
      hydrated.value = true
      return
    }
    if (!isConfigured.value) {
      hydrated.value = true
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      hydrated.value = true
      return
    }

    if (!initPromise.value) {
      initPromise.value = supabase.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) {
            lastError.value = error.message
          }
          setSession(data.session ?? null)
        })
        .catch((error) => {
          lastError.value = error instanceof Error ? error.message : String(error)
          hydrated.value = true
        })
        .finally(() => {
          if (!listenerAttached.value) {
            listenerAttached.value = true
            supabase.auth.onAuthStateChange((_event, nextSession) => {
              setSession(nextSession)
            })
          }
        })
    }

    await initPromise.value
  }

  if (import.meta.client && !hydrated.value) {
    void ensureHydrated()
  }

  const signIn = async (email: string, password?: string): Promise<AuthResult> => {
    lastError.value = null

    if (!password) {
      lastError.value = 'Password is required.'
      return { ok: false, error: lastError.value }
    }

    if (!isConfigured.value) {
      lastError.value = 'Supabase is not configured.'
      return { ok: false, error: lastError.value }
    }

    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    const authUser = data.user ?? data.session?.user ?? null
    if (authUser && !isEmailConfirmed(authUser)) {
      await supabase.auth.signOut()
      lastError.value = 'Please verify your email before signing in.'
      return { ok: false, error: lastError.value }
    }

    setSession(data.session ?? null)
    return { ok: true }
  }

  const signUp = async (input: SignUpInput): Promise<AuthResult> => {
    lastError.value = null

    if (!isConfigured.value) {
      lastError.value = 'Supabase is not configured.'
      return { ok: false, error: lastError.value }
    }

    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    const redirectBase = getRedirectBase()
    const emailRedirectTo = redirectBase
      ? `${redirectBase.replace(/\/$/, '')}/auth/confirm`
      : undefined

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: input.name,
        },
      },
    })

    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    const authUser = data.user ?? data.session?.user ?? null
    if (authUser && !isEmailConfirmed(authUser)) {
      if (data.session) {
        await supabase.auth.signOut()
      }
      hydrated.value = true
      return { ok: true }
    }

    if (data.session) {
      setSession(data.session)
    }
    else {
      hydrated.value = true
    }

    return { ok: true }
  }

  const signInWithOAuth = async (
    provider: OAuthProvider,
    redirectPath: string = '/dashboard',
  ): Promise<AuthResult> => {
    lastError.value = null

    if (!isConfigured.value) {
      lastError.value = 'Supabase is not configured.'
      return { ok: false, error: lastError.value }
    }

    if (provider !== 'google') {
      lastError.value = 'Only Google sign-in is supported.'
      return { ok: false, error: lastError.value }
    }

    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    if (import.meta.client) {
      sessionStorage.setItem('auth:redirect', redirectPath)
    }

    const redirectBase = getRedirectBase()
    const redirectTo = redirectBase
      ? `${redirectBase.replace(/\/$/, '')}/auth/callback`
      : undefined

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    lastError.value = null

    if (!isConfigured.value) {
      lastError.value = 'Supabase is not configured.'
      return { ok: false, error: lastError.value }
    }

    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    const redirectBase = getRedirectBase()
    const redirectTo = redirectBase
      ? `${redirectBase.replace(/\/$/, '')}/reset-password`
      : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  const updatePassword = async (password: string): Promise<AuthResult> => {
    lastError.value = null

    if (!isConfigured.value) {
      lastError.value = 'Supabase is not configured.'
      return { ok: false, error: lastError.value }
    }

    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  const updatePasswordWithCurrent = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> => {
    lastError.value = null

    if (!accessToken.value) {
      lastError.value = 'You must be signed in to update your password.'
      return { ok: false, error: lastError.value }
    }

    try {
      await $fetch(buildApiUrl('/me/password'), {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
        headers: {
          authorization: `Bearer ${accessToken.value}`,
        },
      })
      return { ok: true }
    }
    catch (error: unknown) {
      const apiError = error as {
        data?: { error?: string, message?: string }
        message?: string
      }
      const code = apiError?.data?.error
      if (code === 'invalid_credentials') {
        lastError.value = 'Current password is incorrect.'
      }
      else if (code === 'supabase_not_configured') {
        lastError.value = 'Password updates are unavailable right now.'
      }
      else {
        lastError.value = apiError?.data?.message || apiError?.message || 'Unable to update password.'
      }
      return { ok: false, error: lastError.value }
    }
  }

  const signOut = async (): Promise<AuthResult> => {
    lastError.value = null

    if (!isConfigured.value) {
      user.value = null
      session.value = null
      return { ok: true }
    }

    const supabase = getSupabase()
    if (!supabase) {
      user.value = null
      session.value = null
      return { ok: true }
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    setSession(null)
    return { ok: true }
  }

  const updateProfile = async (updates: Partial<Pick<User, 'name'>>): Promise<AuthResult> => {
    lastError.value = null

    if (!isConfigured.value) {
      lastError.value = 'Supabase is not configured.'
      return { ok: false, error: lastError.value }
    }

    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: updates.name,
      },
    })

    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    if (data.user) {
      user.value = mapSupabaseUser(data.user)
    }

    return { ok: true }
  }

  const applyBackendProfile = (profile: BackendProfile) => {
    if (!profile) return
    const fallbackName
      = profile.email && profile.email.includes('@')
        ? profile.email.split('@')[0]
        : 'User'

    user.value = {
      id: profile.user_id,
      email: profile.email,
      name: profile.name ?? user.value?.name ?? fallbackName,
    }
  }

  return {
    user,
    session,
    hydrated,
    isLoggedIn,
    isAuthenticated,
    accessToken,
    lastError,
    isConfigured,
    ensureHydrated,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    requestPasswordReset,
    updatePassword,
    updatePasswordWithCurrent,
    updateProfile,
    applyBackendProfile,
  }
}
