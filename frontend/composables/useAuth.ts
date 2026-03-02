import type { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'

type OAuthProvider = 'google'

export interface User {
  id: string
  email: string
  name: string
  role?: string | null
  appRole?: string | null
  isAdmin?: boolean
  isSuperAdmin?: boolean
}

type BackendProfile = {
  user_id: string
  email: string
  name?: string | null
  role?: string | null
  app_role?: string | null
  is_admin?: boolean
}

type AuthResult = {
  ok: boolean
  error?: string
  mfaRequired?: boolean
  factorId?: string | null
}

type SignUpInput = {
  name: string
  email: string
  password: string
}

export const isEmailConfirmed = (supabaseUser: SupabaseUser | null): boolean => {
  if (!supabaseUser) return false
  const confirmedAt
    = supabaseUser.email_confirmed_at
      || (supabaseUser as { confirmed_at?: string | null }).confirmed_at
      || null
  return Boolean(confirmedAt)
}

export const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
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
  const { request } = useApi()

  const user = useState<User | null>('auth:user', () => null)
  const session = useState<Session | null>('auth:session', () => null)
  const mfaPending = useState<boolean>('auth:mfa-pending', () => false)
  const hydrated = useState<boolean>('auth:hydrated', () => false)
  const initPromise = useState<Promise<void> | null>('auth:init', () => null)
  const listenerAttached = useState<boolean>('auth:listener', () => false)
  const lastError = useState<string | null>('auth:error', () => null)

  const isLoggedIn = computed(() => user.value !== null)
  const isAuthenticated = isLoggedIn
  const accessToken = computed(() => session.value?.access_token ?? null)
  const isAdmin = computed(() => Boolean(
    user.value?.isAdmin
    || user.value?.role === 'admin'
    || user.value?.role === 'super_admin'
    || user.value?.appRole === 'admin'
    || user.value?.appRole === 'super_admin',
  ))
  const isSuperAdmin = computed(() => Boolean(
    user.value?.isSuperAdmin
    || user.value?.role === 'super_admin'
    || user.value?.appRole === 'super_admin',
  ))
  const isConfigured = computed(() => Boolean(
    config.public.supabaseUrl && config.public.supabaseAnonKey,
  ))
  const authClientMfaEnforced = computed(() => {
    const raw = (config.public.authClientMfaEnforced ?? '') as string | boolean
    if (typeof raw === 'boolean') return raw
    return raw === '1' || raw.toLowerCase() === 'true'
  })

  const setSession = (nextSession: Session | null) => {
    const effectiveSession = nextSession?.user && !isEmailConfirmed(nextSession.user)
      ? null
      : nextSession
    if (mfaPending.value && effectiveSession) {
      session.value = null
      user.value = null
      hydrated.value = true
      return
    }
    session.value = effectiveSession
    user.value = mapSupabaseUser(effectiveSession?.user ?? null)
    hydrated.value = true
  }

  const resolveInitialSession = async (supabase: SupabaseClient): Promise<Session | null> => {
    let nextSession: Session | null = null

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        lastError.value = error.message
      }
      nextSession = data.session ?? null
    }
    catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
    }

    if (!nextSession) {
      // Some clients can return null before auth storage finishes initialization.
      await new Promise(resolve => setTimeout(resolve, 0))
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          lastError.value = error.message
        }
        nextSession = data.session ?? null
      }
      catch (error) {
        lastError.value = error instanceof Error ? error.message : String(error)
      }
    }

    return nextSession
  }

  const getSupabase = () => {
    if (!import.meta.client) return null
    return useSupabaseClient()
  }

  const isLocalhostUrl = (value: string) => {
    if (!value) return false
    try {
      const hostname = new URL(value).hostname.toLowerCase()
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    }
    catch {
      return false
    }
  }

  const getRedirectBase = () => {
    const configured = String(config.public.siteUrl || '').trim()
    const browserOrigin = import.meta.client && typeof window !== 'undefined'
      ? window.location.origin
      : ''

    // In browser flows, prefer the active origin so auth emails/callbacks always
    // target the host the user is currently using (staging/prod/custom domain).
    if (browserOrigin) {
      if (import.meta.dev && isLocalhostUrl(browserOrigin)) {
        return configured || browserOrigin
      }
      return browserOrigin
    }

    return configured
  }

  const normalizeAuthRedirect = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed) return '/dashboard'
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
    if (import.meta.client && typeof window !== 'undefined') {
      try {
        const parsed = new URL(trimmed, window.location.origin)
        if (parsed.origin === window.location.origin) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`
        }
      }
      catch {
        return '/dashboard'
      }
    }
    return '/dashboard'
  }

  const ensureHydrated = async () => {
    if (hydrated.value) return
    if (!import.meta.client) {
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
      initPromise.value = resolveInitialSession(supabase)
        .then(nextSession => setSession(nextSession))
        .catch((error) => {
          lastError.value = error instanceof Error ? error.message : String(error)
          setSession(null)
        })
        .finally(() => {
          if (!listenerAttached.value) {
            listenerAttached.value = true
            supabase.auth.onAuthStateChange((event, nextSession) => {
              if (event === 'INITIAL_SESSION' && !nextSession) {
                setSession(null)
                return
              }
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

  const applyBackendProfileState = (profile: BackendProfile) => {
    if (!profile) return

    const profileRole = profile.role ?? null
    const profileAppRole = profile.app_role ?? null
    const resolvedIsAdmin = Boolean(profile.is_admin)
    const resolvedIsSuperAdmin = profileRole === 'super_admin' || profileAppRole === 'super_admin'

    const fallbackName
      = profile.email && profile.email.includes('@')
        ? profile.email.split('@')[0]
        : 'User'

    user.value = {
      id: profile.user_id,
      email: profile.email,
      name: profile.name ?? user.value?.name ?? fallbackName,
      role: profileRole,
      appRole: profileAppRole,
      isAdmin: resolvedIsAdmin,
      isSuperAdmin: resolvedIsSuperAdmin,
    }
  }

  const listMfaFactors = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      return { totp: [], all: [] as Array<{ id: string, status?: string }> }
    }
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      lastError.value = error.message
      return { totp: [], all: [] as Array<{ id: string, status?: string }> }
    }
    return data
  }

  const resolvePrimaryMfaFactor = async () => {
    const factors = await listMfaFactors()
    const verified = factors.totp?.find(factor => factor.status === 'verified')
    return verified ?? factors.totp?.[0] ?? null
  }

  const startMfaChallenge = async (factorId: string) => {
    const supabase = getSupabase()
    if (!supabase) {
      return { ok: false, error: 'Supabase client is not available.' }
    }
    const { data, error } = await supabase.auth.mfa.challenge({ factorId })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }
    return { ok: true, challengeId: data.id }
  }

  const verifyMfaChallenge = async (factorId: string, challengeId: string, code: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }
    const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    // Supabase MFA verify does not guarantee a typed `session` payload across SDK versions.
    // Read the current auth session explicitly after successful verification.
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) {
      mfaPending.value = false
      setSession(sessionData.session)
    }
 else {
      mfaPending.value = false
    }

    return { ok: true }
  }

  const enrollMfaFactor = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      return { ok: false, error: 'Supabase client is not available.' }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }
    return { ok: true, factor: data }
  }

  const verifyMfaEnrollment = async (factorId: string, code: string) => {
    const challenge = await startMfaChallenge(factorId)
    if (!challenge.ok || !challenge.challengeId) {
      return { ok: false, error: challenge.error }
    }
    return verifyMfaChallenge(factorId, challenge.challengeId, code)
  }

  const unenrollMfaFactor = async (factorId: string): Promise<AuthResult> => {
    const supabase = getSupabase()
    if (!supabase) {
      lastError.value = 'Supabase client is not available.'
      return { ok: false, error: lastError.value }
    }

    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    return { ok: true }
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

    if (authClientMfaEnforced.value) {
      mfaPending.value = true
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      mfaPending.value = false
      const message = error.message || ''
      if (message.toLowerCase().includes('mfa')) {
        const factor = await resolvePrimaryMfaFactor()
        return { ok: false, mfaRequired: true, factorId: factor?.id ?? null, error: message }
      }
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    const authUser = data.user ?? data.session?.user ?? null
    if (authUser && !isEmailConfirmed(authUser)) {
      await supabase.auth.signOut()
      lastError.value = 'Please verify your email before signing in.'
      return { ok: false, error: lastError.value }
    }

    if (authClientMfaEnforced.value) {
      const factor = await resolvePrimaryMfaFactor()
      if (factor && factor.status === 'verified') {
        // Optional app-layer MFA enforcement for non-admin user login.
        // Keep Supabase session available for challenge/verify, but block app auth state
        // until verifyMfaChallenge promotes the session.
        session.value = null
        user.value = null
        hydrated.value = true
        return { ok: false, mfaRequired: true, factorId: factor.id }
      }
    }

    mfaPending.value = false
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
      sessionStorage.setItem('auth:redirect', normalizeAuthRedirect(redirectPath))
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
      await request('/me/password', {
        method: 'POST',
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
        retries: 0,
      })
      return { ok: true }
    }
    catch (error: unknown) {
      const apiError = error as {
        statusCode?: number
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
        lastError.value = apiError?.data?.message
          || apiError?.message
          || (apiError?.statusCode ? `Unable to update password (${apiError.statusCode}).` : 'Unable to update password.')
      }

      return { ok: false, error: lastError.value }
    }
  }

  const signOut = async (): Promise<AuthResult> => {
    lastError.value = null
    mfaPending.value = false

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
      const mapped = mapSupabaseUser(data.user)
      if (mapped) {
        user.value = {
          ...user.value,
          ...mapped,
        }
      }
    }

    return { ok: true }
  }

  const applyBackendProfile = (profile: BackendProfile) => {
    applyBackendProfileState(profile)
  }

  return {
    user,
    session,
    hydrated,
    isLoggedIn,
    isAuthenticated,
    accessToken,
    isAdmin,
    isSuperAdmin,
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
    listMfaFactors,
    resolvePrimaryMfaFactor,
    startMfaChallenge,
    verifyMfaChallenge,
    enrollMfaFactor,
    verifyMfaEnrollment,
    unenrollMfaFactor,
    applyBackendProfile,
  }
}
