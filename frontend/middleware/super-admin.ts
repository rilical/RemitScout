export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated } = useAuth()
  const { ensureAdminSession, accessToken: adminAccessToken } = useAdminSession()
  const { request } = useApi()

  await ensureHydrated()

  let adminSessionReady = false
  try {
    adminSessionReady = await ensureAdminSession()
  }
  catch {
    adminSessionReady = false
  }

  if (!isAuthenticated.value && !adminSessionReady) {
    return navigateTo('/sign-in')
  }

  try {
    const me = await request<{
      user?: {
        is_admin?: boolean
        role?: string | null
        app_role?: string | null
      }
    }>('/me', {
      retries: 0,
      headers: adminAccessToken.value
        ? { authorization: `Bearer ${adminAccessToken.value}` }
        : undefined,
    })

    const role = me?.user?.role ?? null
    const appRole = me?.user?.app_role ?? null
    const isSuperAdmin = role === 'super_admin' || appRole === 'super_admin'

    if (!me?.user?.is_admin || !isSuperAdmin) {
      return navigateTo('/')
    }
  }
  catch {
    if (!isAuthenticated.value && !adminSessionReady) {
      return navigateTo('/sign-in')
    }
    return navigateTo('/')
  }
})
