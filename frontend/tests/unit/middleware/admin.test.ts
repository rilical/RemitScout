import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

describe('admin middleware', () => {
  const ensureHydrated = vi.fn<() => Promise<void>>()
  const ensureAdminSession = vi.fn<() => Promise<boolean>>()
  const request = vi.fn<() => Promise<{ user?: { is_admin?: boolean } }>>()
  const navigateTo = vi.fn((target: string) => target)
  const isAuthenticated = ref(false)

  const loadMiddleware = async () => {
    const mod = await import('~/middleware/admin')
    return mod.default
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    isAuthenticated.value = false
    ensureHydrated.mockResolvedValue(undefined)
    ensureAdminSession.mockResolvedValue(false)
    request.mockResolvedValue({ user: { is_admin: true } })

    ;(globalThis as any).defineNuxtRouteMiddleware = (fn: unknown) => fn
    ;(globalThis as any).useAuth = () => ({
      ensureHydrated,
      isAuthenticated,
    })
    ;(globalThis as any).useAdminSession = () => ({
      ensureAdminSession,
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

  it('bootstraps the admin session before rejecting an unauthenticated admin reload', async () => {
    ensureAdminSession.mockResolvedValue(true)

    const middleware = await loadMiddleware()
    const result = await middleware()

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('/me', { retries: 0 })
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('redirects to sign-in when neither Supabase auth nor admin bootstrap is available', async () => {
    const middleware = await loadMiddleware()
    const result = await middleware()

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
    expect(request).not.toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith('/sign-in')
    expect(result).toBe('/sign-in')
  })

  it('keeps authenticated admins on the route even if admin bootstrap has not finished yet', async () => {
    isAuthenticated.value = true
    ensureAdminSession.mockResolvedValue(false)

    const middleware = await loadMiddleware()
    const result = await middleware()

    expect(ensureHydrated).toHaveBeenCalledTimes(1)
    expect(ensureAdminSession).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('/me', { retries: 0 })
    expect(navigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
