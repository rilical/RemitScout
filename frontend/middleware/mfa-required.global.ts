const MFA_EXEMPT_PATHS = [
  '/maintenance',
  '/sign-in',
  '/sign-up',
  '/reset-password',
  '/forgot-password',
  '/auth/confirm',
  '/auth/callback',
  '/account/security',
]

export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureHydrated, isAuthenticated, listMfaFactors } = useAuth()
  const { request } = useApi()

  if (import.meta.client) {
    await ensureHydrated()
    if (!isAuthenticated.value) return
  }
  if (MFA_EXEMPT_PATHS.some(p => to.path.startsWith(p))) return

  let me: {
    user?: { is_admin?: boolean; mfa_verified?: boolean }
    plan_effective?: { plan_code?: string; is_active?: boolean }
  } | null = null
  try {
    me = await request('/me', { retries: 0 })
  } catch {
    if (import.meta.client && !isAuthenticated.value) return
    return
  }

  if (!me?.user) return

  const isAdmin = Boolean(me.user.is_admin)
  const isEnterprise =
    me.plan_effective?.plan_code === 'enterprise'
    && (me.plan_effective?.is_active ?? true)

  const requiresMfa = isAdmin || isEnterprise
  if (!requiresMfa) return

  if (me.user.mfa_verified) return

  // Client fallback: if backend is stale, confirm current factor state directly.
  const factors = await listMfaFactors()
  const hasVerifiedTotp = factors.totp?.some(f => f.status === 'verified') ?? false
  if (hasVerifiedTotp) return

  return navigateTo({
    path: '/account/security',
    query: { mfa: 'required', redirect: to.fullPath },
  })
})
