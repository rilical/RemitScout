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
  const { ensureHydrated, isAuthenticated, isAdmin, listMfaFactors } = useAuth()
  const { isEnterprise, hydrated: entHydrated } = useEntitlements()

  await ensureHydrated()

  if (!isAuthenticated.value) return
  if (MFA_EXEMPT_PATHS.some(p => to.path.startsWith(p))) return

  const requiresMfa = isAdmin.value || (entHydrated.value && isEnterprise.value)
  if (!requiresMfa) return

  const factors = await listMfaFactors()
  const hasVerifiedTotp = factors.totp?.some(f => f.status === 'verified') ?? false
  if (hasVerifiedTotp) return

  return navigateTo({
    path: '/account/security',
    query: { mfa: 'required', redirect: to.fullPath },
  })
})
