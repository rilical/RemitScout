import type { Session, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'

type OAuthProvider = 'google'
const AUTH_STORAGE_KEY = 'remit-scout-auth'
const AUTH_SESSION_HINT_KEY = 'rs:auth-session-seeded'
const INITIAL_SESSION_RETRY_DELAYS_MS = [50, 150, 300]
const AUTH_RECOVERY_GRACE_MS = 2500
const AUTH_RECOVERY_POLL_MS = 100
const AUTH_RECOVERY_PROBE_INTERVAL_MS = 500

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

type PersistedSessionTokens = Pick<Session, 'access_token' | 'refresh_token'>

const isBrowser = () => typeof window !== 'undefined'

const parsePersistedSessionTokens = (value: unknown): PersistedSessionTokens | null => {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Record<string, unknown>
  const accessToken
    = typeof candidate.access_token === 'string' ? candidate.access_token.trim() : ''
  const refreshToken
    = typeof candidate.refresh_token === 'string' ? candidate.refresh_token.trim() : ''

  if (accessToken && refreshToken) {
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    }
  }

  if (candidate.currentSession && typeof candidate.currentSession === 'object') {
    return parsePersistedSessionTokens(candidate.currentSession)
  }

  if (candidate.session && typeof candidate.session === 'object') {
    return parsePersistedSessionTokens(candidate.session)
  }

  return null
}

export const extractStoredSupabaseSession = (raw: string | null): PersistedSessionTokens | null => {
  if (!raw) return null
  try {
    return parsePersistedSessionTokens(JSON.parse(raw))
  }
 catch {
    return null
  }
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

const readAuthSessionHint = (): boolean => {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === '1'
  }
 catch {
    return false
  }
}

const writeAuthSessionHint = (enabled: boolean) => {
  if (!isBrowser()) return
  try {
    if (enabled) {
      window.localStorage.setItem(AUTH_SESSION_HINT_KEY, '1')
      return
    }
    window.localStorage.removeItem(AUTH_SESSION_HINT_KEY)
  }
 catch {
    // Best-effort only; auth bootstrap should not depend on localStorage access.
  }
}

const readStoredSupabaseSession = (): PersistedSessionTokens | null => {
  if (!isBrowser()) return null
  try {
    return extractStoredSupabaseSession(window.localStorage.getItem(AUTH_STORAGE_KEY))
  }
 catch {
    return null
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  const isAdmin = computed(() =>
    Boolean(
      user.value?.isAdmin
      || user.value?.role === 'admin'
      || user.value?.role === 'super_admin'
      || user.value?.appRole === 'admin'
      || user.value?.appRole === 'super_admin',
    ),
  )
  const isSuperAdmin = computed(() =>
    Boolean(
      user.value?.isSuperAdmin
      || user.value?.role === 'super_admin'
      || user.value?.appRole === 'super_admin',
    ),
  )
  const isConfigured = computed(() =>
    Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey),
  )
  const authClientMfaEnforced = computed(() => {
    const raw = (config.public.authClientMfaEnforced ?? '') as string | boolean
    if (typeof raw === 'boolean') return raw
    return raw === '1' || raw.toLowerCase() === 'true'
  })

  const setSession = (nextSession: Session | null) => {
    const effectiveSession
      = nextSession?.user && !isEmailConfirmed(nextSession.user) ? null : nextSession
    if (mfaPending.value && effectiveSession) {
      session.value = null
      user.value = null
      hydrated.value = true
      return
    }
    session.value = effectiveSession
    user.value = mapSupabaseUser(effectiveSession?.user ?? null)
    if (effectiveSession) {
      writeAuthSessionHint(true)
    }
    hydrated.value = true
  }

  const restoreSessionFromStorage = async (supabase: SupabaseClient): Promise<Session | null> => {
    const storedTokens = readStoredSupabaseSession()
    if (!storedTokens) return null

    try {
      const { data, error } = await supabase.auth.setSession(storedTokens)
      if (error) {
        lastError.value = error.message
      }
      return data.session ?? null
    }
 catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
      return null
    }
  }

  const refreshSessionFromHint = async (supabase: SupabaseClient): Promise<Session | null> => {
    if (!readAuthSessionHint()) return null

    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        lastError.value = error.message
      }
      return data.session ?? null
    }
 catch (error) {
      lastError.value = error instanceof Error ? error.message : String(error)
      return null
    }
  }

  const resolveInitialSession = async (supabase: SupabaseClient): Promise<Session | null> => {
    const initialSession = await new Promise<Session | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === 'INITIAL_SESSION') {
          clearTimeout(timeout)
          subscription.unsubscribe()
          resolve(nextSession)
        }
      })
    })

    if (initialSession) {
      return initialSession
    }

    const getCurrentSession = async (): Promise<Session | null> => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          lastError.value = error.message
        }
        return data.session ?? null
      }
 catch (error) {
        lastError.value = error instanceof Error ? error.message : String(error)
        return null
      }
    }

    let nextSession = await getCurrentSession()

    if (!nextSession && isBrowser()) {
      if (
        window.location.hash.includes('access_token=')
        && window.location.hash.includes('refresh_token=')
      ) {
        const sanitizedUrl = `${window.location.pathname}${window.location.search}`
        window.history.replaceState({}, document.title, sanitizedUrl)
      }

      if (!nextSession) {
        nextSession = await restoreSessionFromStorage(supabase)
      }

      for (const delayMs of INITIAL_SESSION_RETRY_DELAYS_MS) {
        if (nextSession) break
        await new Promise(resolve => setTimeout(resolve, delayMs))
        nextSession = await getCurrentSession()
      }

      if (!nextSession) {
        nextSession = await refreshSessionFromHint(supabase)
      }

      if (!nextSession) {
        nextSession = await getCurrentSession()
      }

      if (!nextSession && !readStoredSupabaseSession()) {
        writeAuthSessionHint(false)
      }
    }

    return nextSession
  }

  const hasSessionRecoveryEvidence = () =>
    Boolean(readAuthSessionHint() || readStoredSupabaseSession())

  const attachAuthListener = (supabase: SupabaseClient) => {
    if (listenerAttached.value) return

    listenerAttached.value = true
    supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        writeAuthSessionHint(false)
        setSession(null)
        return
      }

      if (event === 'INITIAL_SESSION' && !nextSession && readAuthSessionHint()) {
        return
      }

      setSession(nextSession)
    })
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
    const browserOrigin
      = import.meta.client && typeof window !== 'undefined' ? window.location.origin : ''

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
          attachAuthListener(supabase)
        })
    }

    await initPromise.value
  }

  const ensureAuthenticated = async (
    options: { recoveryTimeoutMs?: number } = {},
  ): Promise<boolean> => {
    await ensureHydrated()

    if (isAuthenticated.value) {
      return true
    }

    if (!import.meta.client || !isConfigured.value || !hasSessionRecoveryEvidence()) {
      return false
    }

    const supabase = getSupabase()
    if (!supabase) {
      return false
    }

    const timeoutMs = Math.max(0, options.recoveryTimeoutMs ?? AUTH_RECOVERY_GRACE_MS)
    const deadline = Date.now() + timeoutMs
    let nextProbeAt = Date.now()

    while (Date.now() < deadline) {
      if (isAuthenticated.value) {
        return true
      }

      if (Date.now() >= nextProbeAt) {
        const recoveredSession = await resolveInitialSession(supabase)
        if (recoveredSession) {
          setSession(recoveredSession)
          return true
        }

        nextProbeAt = Date.now() + AUTH_RECOVERY_PROBE_INTERVAL_MS
      }

      await sleep(AUTH_RECOVERY_POLL_MS)
    }

    return isAuthenticated.value
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
      = profile.email && profile.email.includes('@') ? profile.email.split('@')[0] : 'User'

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

  const verifyMfaChallenge = async (
    factorId: string,
    challengeId: string,
    code: string,
  ): Promise<AuthResult> => {
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
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Authenticator-${Date.now()}`,
    })
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
        lastError.value
          = apiError?.data?.message
            || apiError?.message
            || (apiError?.statusCode
            ? `Unable to update password (${apiError.statusCode}).`
            : 'Unable to update password.')
      }

      return { ok: false, error: lastError.value }
    }
  }

  const signOut = async (): Promise<AuthResult> => {
    lastError.value = null
    mfaPending.value = false

    if (!isConfigured.value) {
      writeAuthSessionHint(false)
      user.value = null
      session.value = null
      return { ok: true }
    }

    const supabase = getSupabase()
    if (!supabase) {
      writeAuthSessionHint(false)
      user.value = null
      session.value = null
      return { ok: true }
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      lastError.value = error.message
      return { ok: false, error: error.message }
    }

    writeAuthSessionHint(false)
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
    ensureAuthenticated,
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
