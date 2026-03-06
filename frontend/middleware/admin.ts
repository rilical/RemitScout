export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated } = useAuth()
  const { ensureAdminSession } = useAdminSession()
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

  // Always verify admin status server-side; never trust client-state alone.
  try {
    const me = await request<{ user?: { is_admin?: boolean } }>('/me', { retries: 0 })
    if (!me?.user?.is_admin) {
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
