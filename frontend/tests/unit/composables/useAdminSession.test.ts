// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())
const mockEnsureHydrated = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())
const mockSupabaseRefreshSession = vi.hoisted(() => vi.fn())
const authSession = vi.hoisted(() => ({ value: null as { access_token?: string } | null }))

const stateStore = new Map<string, ReturnType<typeof ref>>()
const localStorageState = new Map<string, string>()

const makeAdminToken = (expOffsetSeconds = 3600) => {
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
  })).toString('base64url')
  return `header.${payload}.signature`
}

const mountComposable = async () => {
  const { useAdminSession } = await import('~/composables/useAdminSession')

  const Host = defineComponent({
    setup() {
      return useAdminSession()
    },
    template: '<div />',
  })

  return mount(Host)
}

describe('useAdminSession', () => {
  beforeEach(() => {
    vi.resetModules()
    mockRequest.mockReset()
    mockEnsureHydrated.mockReset().mockResolvedValue(undefined)
    mockSignOut.mockReset().mockResolvedValue({ ok: true })
    authSession.value = { access_token: 'supabase.jwt.token' }
    stateStore.clear()
    localStorageState.clear()

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => localStorageState.get(key) ?? null,
        setItem: (key: string, value: string) => {
          localStorageState.set(key, value)
        },
        removeItem: (key: string) => {
          localStorageState.delete(key)
        },
        clear: () => {
          localStorageState.clear()
        },
      },
    })

    vi.stubGlobal('useApi', () => ({
      request: mockRequest,
    }))
    vi.stubGlobal('useAuth', () => ({
      signOut: mockSignOut,
      session: authSession,
      ensureHydrated: mockEnsureHydrated,
    }))
    vi.stubGlobal('useState', (key: string, init: (() => unknown) | unknown) => {
      if (!stateStore.has(key)) {
        const value = typeof init === 'function'
          ? (init as () => unknown)()
          : init
        stateStore.set(key, ref(value))
      }
      return stateStore.get(key)
    })
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        refreshSession: mockSupabaseRefreshSession,
      },
    }))
    vi.stubGlobal('computed', computed)
    mockSupabaseRefreshSession.mockReset().mockResolvedValue({
      data: { session: null },
      error: new Error('no_supabase_session'),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorageState.clear()
  })

  it('exchanges first on the first admin bootstrap when a Supabase session already exists', async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/sessions/admin/exchange') {
        return {
          access_token: makeAdminToken(),
          expires_in: 3600,
          token_type: 'Bearer',
        }
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    const wrapper = await mountComposable()

    await expect((wrapper.vm as any).ensureAdminSession()).resolves.toBe(true)

    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockRequest.mock.calls[0]?.[0]).toBe('/sessions/admin/exchange')
    expect(window.localStorage.getItem('rs:admin-session-seeded')).toBe('1')
  })

  it('prefers refresh when a previous admin session hint exists and the Supabase session is unavailable', async () => {
    authSession.value = null
    window.localStorage.setItem('rs:admin-session-seeded', '1')

    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/sessions/admin/refresh') {
        return {
          access_token: makeAdminToken(),
          expires_in: 3600,
          token_type: 'Bearer',
        }
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    const wrapper = await mountComposable()

    await expect((wrapper.vm as any).ensureAdminSession()).resolves.toBe(true)

    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockRequest.mock.calls[0]?.[0]).toBe('/sessions/admin/refresh')
  })

  it('recovers the Supabase session before retrying admin bootstrap on a hinted reload', async () => {
    authSession.value = null
    window.localStorage.setItem('rs:admin-session-seeded', '1')
    mockSupabaseRefreshSession.mockResolvedValue({
      data: {
        session: { access_token: 'supabase.refreshed.token' },
      },
      error: null,
    })

    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/sessions/admin/exchange') {
        return {
          access_token: makeAdminToken(),
          expires_in: 3600,
          token_type: 'Bearer',
        }
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    const wrapper = await mountComposable()

    await expect((wrapper.vm as any).ensureAdminSession()).resolves.toBe(true)

    expect(mockSupabaseRefreshSession).toHaveBeenCalledTimes(1)
    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockRequest.mock.calls[0]?.[0]).toBe('/sessions/admin/exchange')
    expect((authSession.value as { access_token?: string } | null)?.access_token).toBe('supabase.refreshed.token')
  })

  it('deduplicates concurrent admin bootstrap attempts into a single request', async () => {
    let resolveExchange: ((value: {
      access_token: string
      expires_in: number
      token_type: string
    }) => void) | null = null

    mockRequest.mockImplementation((path: string) => {
      if (path !== '/sessions/admin/exchange') {
        throw new Error(`Unexpected request: ${path}`)
      }
      return new Promise((resolve) => {
        resolveExchange = resolve
      })
    })

    const wrapper = await mountComposable()
    const api = wrapper.vm as any

    const first = api.ensureAdminSession()
    const second = api.ensureAdminSession()

    await Promise.resolve()
    await Promise.resolve()

    expect(mockRequest).toHaveBeenCalledTimes(1)

    expect(resolveExchange).toBeTypeOf('function')
    resolveExchange!({
      access_token: makeAdminToken(),
      expires_in: 3600,
      token_type: 'Bearer',
    })

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
  })
})
