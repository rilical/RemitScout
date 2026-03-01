export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated } = useAuth()
  const { request } = useApi()

  await ensureHydrated()
  if (!isAuthenticated.value) {
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
    return navigateTo('/')
  }
})
