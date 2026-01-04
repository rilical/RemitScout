export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureHydrated, isAuthenticated } = useAuth()

  await ensureHydrated()

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/sign-in',
      query: { redirect: to.fullPath },
    })
  }
})
