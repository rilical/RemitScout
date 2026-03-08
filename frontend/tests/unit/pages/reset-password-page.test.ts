import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref, watch } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockEnsureHydrated = vi.hoisted(() => vi.fn())
const mockExchangeCodeForSession = vi.hoisted(() => vi.fn())
const mockNavigateTo = vi.hoisted(() => vi.fn())
const mockUpdatePassword = vi.hoisted(() => vi.fn())
const mockVerifyOtp = vi.hoisted(() => vi.fn())

const routeState: { path: string, query: Record<string, string> } = {
  path: '/reset-password',
  query: {},
}

let isAuthenticatedRef: ReturnType<typeof ref<boolean>>
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

const PasswordStrengthStub = defineComponent({
  props: {
    modelValue: {
      type: String,
      required: false,
      default: '',
    },
  },
  emits: ['update:valid'],
  setup(props, { emit }) {
    watch(
      () => props.modelValue,
      (value) => {
        emit('update:valid', String(value || '').length >= 8)
      },
      { immediate: true },
    )

    return () => null
  },
})

describe('reset-password page', () => {
  const mountPage = async () => {
    const ResetPasswordPage = (await import('~/pages/reset-password.vue')).default
    return mount(ResetPasswordPage, {
      global: {
        stubs: {
          NuxtImg: true,
          NuxtLink: LinkStub,
          PasswordStrength: PasswordStrengthStub,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    routeState.query = {}
    isAuthenticatedRef = ref(true)
    isConfiguredRef = ref(true)

    mockEnsureHydrated.mockResolvedValue(undefined)
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    mockNavigateTo.mockResolvedValue(undefined)
    mockUpdatePassword.mockResolvedValue({ ok: true })
    mockVerifyOtp.mockResolvedValue({ error: null })

    vi.stubGlobal('useAuth', () => ({
      updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
      ensureHydrated: (...args: unknown[]) => mockEnsureHydrated(...args),
      isAuthenticated: isAuthenticatedRef,
      isConfigured: isConfiguredRef,
    }))
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('onMounted', (fn: () => unknown) => fn())
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
    vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows an invalid-link error when the reset token is missing', async () => {
    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('This reset link is invalid or expired.')
    expect(mockVerifyOtp).not.toHaveBeenCalled()
    expect(mockUpdatePassword).not.toHaveBeenCalled()
  })

  it('verifies the recovery token and updates the password when the form is valid', async () => {
    routeState.query = { token_hash: 'valid-token-hash' }

    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'valid-token-hash',
      type: 'recovery',
    })
    expect(mockEnsureHydrated).toHaveBeenCalledTimes(1)

    await wrapper.get('#password').setValue('StrongPassw0rd!')
    await wrapper.get('#confirm-password').setValue('StrongPassw0rd!')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockUpdatePassword).toHaveBeenCalledWith('StrongPassw0rd!')
    expect(wrapper.text()).toContain('Password updated')
    expect(wrapper.text()).toContain('Go to sign in')
  })
})
