import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

describe('auth middleware', () => {
  const ensureHydrated = vi.fn<() => Promise<void>>()
  const ensureAdminSession = vi.fn<() => Promise<boolean>>()
  const navigateTo = vi.fn((target: unknown) => target)
  const isAuthenticated = ref(false)

  const loadMiddleware = async () => {
    const mod = await import('~/middleware/auth')
    return mod.default
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    isAuthenticated.value = false
    ensureHydrated.mockResolvedValue(undefined)
    ensureAdminSession.mockResolvedValue(false)

    ;(globalThis as any).defineNuxtRouteMiddleware = (fn: unknown) => fn
    ;(globalThis as any).useAuth = () => ({
      ensureHydrated,
      isAuthenticated,
    })
    ;(globalThis as any).useAdminSession = () => ({
      ensureAdminSession,
    })
    ;(globalThis as any).navigateTo = navigateTo
  })

  afterEach(() => {
    delete (globalThis as any).defineNuxtRouteMiddleware
    delete (globalThis as any).useAuth
    delete (globalThis as any).useAdminSession
    delete (globalThis as any).navigateTo
  })

  it('redirects unauthenticated non-admin routes to sign-in with the original destination', async () => {
    const middleware = await loadMiddleware()
    const to = {
      path: '/watchlist',
      fullPath: '/watchlist?provider=wise',
    } as Parameters<typeof middleware>[0]
    const from = {} as Parameters<typeof middleware>[1]
    const result = await middleware(to, from)

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).not.toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith({
      path: '/sign-in',
      query: { redirect: '/watchlist?provider=wise' },
    })
    expect(result).toEqual({
      path: '/sign-in',
      query: { redirect: '/watchlist?provider=wise' },
    })
  })

  it('allows admin routes to continue when the admin session can be refreshed on reload', async () => {
    ensureAdminSession.mockResolvedValue(true)

    const middleware = await loadMiddleware()
    const to = {
      path: '/admin/enterprise',
      fullPath: '/admin/enterprise?email=support%40remit-scout.com',
    } as Parameters<typeof middleware>[0]
    const from = {} as Parameters<typeof middleware>[1]
    const result = await middleware(to, from)

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects admin routes to sign-in when the admin refresh path also fails', async () => {
    ensureAdminSession.mockRejectedValue(new Error('refresh failed'))

    const middleware = await loadMiddleware()
    const to = {
      path: '/admin/enterprise',
      fullPath: '/admin/enterprise?email=support%40remit-scout.com',
    } as Parameters<typeof middleware>[0]
    const from = {} as Parameters<typeof middleware>[1]
    const result = await middleware(to, from)

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
    expect(navigateTo).toHaveBeenCalledWith({
      path: '/sign-in',
      query: { redirect: '/admin/enterprise?email=support%40remit-scout.com' },
    })
    expect(result).toEqual({
      path: '/sign-in',
      query: { redirect: '/admin/enterprise?email=support%40remit-scout.com' },
    })
  })
})
