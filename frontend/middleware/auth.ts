export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { ensureHydrated, isAuthenticated } = useAuth()

  await ensureHydrated()

  if (isAuthenticated.value) {
    return
  }

  if (to.path.startsWith('/admin')) {
    const { ensureAdminSession } = useAdminSession()

    try {
      if (await ensureAdminSession()) {
        return
      }
    }
    catch {
      // Fall through to the regular sign-in redirect when admin bootstrap fails.
    }
  }

  return navigateTo({
    path: '/sign-in',
    query: { redirect: to.fullPath },
  })
})
