export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated, user, isAdmin } = useAuth()
  const { request } = useApi()

  await ensureHydrated()
  if (!isAuthenticated.value) {
    return navigateTo('/sign-in')
  }

  if (isAdmin.value || user.value?.isAdmin) {
    return
  }

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
