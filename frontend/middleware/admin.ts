export default defineNuxtRouteMiddleware(async () => {
  const { ensureHydrated, isAuthenticated } = useAuth()
  const { request } = useApi()

  await ensureHydrated()
  if (!isAuthenticated.value) {
    return navigateTo('/sign-in')
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
