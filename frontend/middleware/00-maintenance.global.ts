const MAINTENANCE_ROUTE = '/maintenance'

export default defineNuxtRouteMiddleware((to) => {
  const runtimeConfig = useRuntimeConfig()
  if (runtimeConfig.public.siteMaintenanceMode !== true) return

  if (to.path === MAINTENANCE_ROUTE || to.path.startsWith(`${MAINTENANCE_ROUTE}/`)) return

  return navigateTo(MAINTENANCE_ROUTE, { redirectCode: 302 })
})
