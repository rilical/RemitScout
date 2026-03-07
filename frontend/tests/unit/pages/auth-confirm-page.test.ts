import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockEnsureHydrated = vi.hoisted(() => vi.fn())
const mockExchangeCodeForSession = vi.hoisted(() => vi.fn())
const mockVerifyOtp = vi.hoisted(() => vi.fn())

const routeState: { path: string, query: Record<string, string> } = {
  path: '/auth/confirm',
  query: {},
}

let isConfiguredRef: ReturnType<typeof ref<boolean>>

vi.mock('~/composables/useSeo', () => ({
  setSeo: vi.fn(),
}))

const LinkStub = defineComponent({
  props: {
    to: {
      type: [String, Object],
      required: false,
    },
  },
  template: '<a><slot /></a>',
})

describe('auth confirm page', () => {
  const mountPage = async () => {
    const AuthConfirmPage = (await import('~/pages/auth/confirm.vue')).default
    return mount(AuthConfirmPage, {
      global: {
        stubs: {
          NuxtLink: LinkStub,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    routeState.query = {}
    isConfiguredRef = ref(true)

    mockEnsureHydrated.mockResolvedValue(undefined)
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })

    vi.stubGlobal('useAuth', () => ({
      ensureHydrated: (...args: unknown[]) => mockEnsureHydrated(...args),
      isConfigured: isConfiguredRef,
    }))
    vi.stubGlobal('onMounted', (fn: () => unknown) => fn())
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('useRoute', () => routeState)
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://remit-scout.com',
        supabaseSuppressConfigError: false,
      },
    }))
    vi.stubGlobal('useSupabaseClient', () => ({
      auth: {
        verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
        exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('verifies signup tokens and transitions to the success state', async () => {
    routeState.query = {
      token_hash: 'signup-token',
      type: 'signup',
    }

    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'signup-token',
      type: 'signup',
    })
    expect(mockEnsureHydrated).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Email confirmed')
    expect(wrapper.text()).toContain('Continue to sign in')
  })

  it('supports PKCE confirmation links', async () => {
    routeState.query = {
      code: 'pkce-code',
    }

    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
    expect(mockEnsureHydrated).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Email confirmed')
  })

  it('rejects unsupported OTP types without calling Supabase', async () => {
    routeState.query = {
      token_hash: 'signup-token',
      type: 'totp',
    }

    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(mockVerifyOtp).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Confirmation failed')
    expect(wrapper.text()).toContain('Invalid confirmation type.')
  })
})
