import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

describe('super-admin middleware', () => {
  const ensureHydrated = vi.fn<() => Promise<void>>()
  const ensureAdminSession = vi.fn<() => Promise<boolean>>()
  const request = vi.fn<() => Promise<{ user?: { is_admin?: boolean, role?: string | null, app_role?: string | null } }>>()
  const navigateTo = vi.fn((target: string) => target)
  const isAuthenticated = ref(false)
  const adminAccessToken = ref<string | null>(null)

  const loadMiddleware = async () => {
    const mod = await import('~/middleware/super-admin')
    return mod.default
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    isAuthenticated.value = false
    adminAccessToken.value = null
    ensureHydrated.mockResolvedValue(undefined)
    ensureAdminSession.mockResolvedValue(false)
    request.mockResolvedValue({ user: { is_admin: true, app_role: 'super_admin' } })

    ;(globalThis as any).defineNuxtRouteMiddleware = (fn: unknown) => fn
    ;(globalThis as any).useAuth = () => ({
      ensureHydrated,
      isAuthenticated,
    })
    ;(globalThis as any).useAdminSession = () => ({
      ensureAdminSession,
      accessToken: adminAccessToken,
    })
    ;(globalThis as any).useApi = () => ({
      request,
    })
    ;(globalThis as any).navigateTo = navigateTo
  })

  afterEach(() => {
    delete (globalThis as any).defineNuxtRouteMiddleware
    delete (globalThis as any).useAuth
    delete (globalThis as any).useAdminSession
    delete (globalThis as any).useApi
    delete (globalThis as any).navigateTo
  })

  it('allows authenticated super-admin users through', async () => {
    isAuthenticated.value = true

    const middleware = await loadMiddleware()
    const result = await middleware({} as never, {} as never)

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('/me', { retries: 0 })
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('uses the Plane A admin token when the admin session is active without Supabase auth', async () => {
    ensureAdminSession.mockResolvedValue(true)
    adminAccessToken.value = 'plane-a-admin-token'

    const middleware = await loadMiddleware()
    const result = await middleware({} as never, {} as never)

    expect(request).toHaveBeenCalledWith('/me', {
      retries: 0,
      headers: {
        authorization: 'Bearer plane-a-admin-token',
      },
    })
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects non-super-admin admins away from the route', async () => {
    isAuthenticated.value = true
    request.mockResolvedValueOnce({ user: { is_admin: true, app_role: 'admin' } })

    const middleware = await loadMiddleware()
    const result = await middleware({} as never, {} as never)

    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(result).toBe('/')
  })

  it('redirects to sign-in when auth bootstrap fails entirely', async () => {
    const middleware = await loadMiddleware()
    const result = await middleware({} as never, {} as never)

    expect(request).not.toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith('/sign-in')
    expect(result).toBe('/sign-in')
  })
})
