import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref, watch } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockSignUp = vi.hoisted(() => vi.fn())
const mockSignInWithOAuth = vi.hoisted(() => vi.fn())
const mockNavigateTo = vi.hoisted(() => vi.fn())

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

describe('sign-up page', () => {
  const isLoggedIn = ref(false)

  const mountPage = async () => {
    const SignUpPage = (await import('~/pages/sign-up.vue')).default
    return mount(SignUpPage, {
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
    isLoggedIn.value = false
    mockSignUp.mockResolvedValue({ ok: true })
    mockSignInWithOAuth.mockResolvedValue({ ok: true })
    mockNavigateTo.mockResolvedValue(undefined)

    vi.stubGlobal('useAuth', () => ({
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      isLoggedIn,
    }))
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('useRoute', () => ({ path: '/sign-up' }))
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://remit-scout.com',
      },
    }))
    vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requires accepting terms before creating an account', async () => {
    const wrapper = await mountPage()

    await wrapper.get('#name').setValue('User One')
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('StrongPassw0rd!')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockSignUp).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Please accept the Terms of Service and Privacy Policy.')
  })

  it('shows the email confirmation state when sign-up succeeds without an authenticated session', async () => {
    const wrapper = await mountPage()

    await wrapper.get('#name').setValue('User One')
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('StrongPassw0rd!')
    await wrapper.get('#terms').setValue(true)
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockSignUp).toHaveBeenCalledWith({
      name: 'User One',
      email: 'user@example.com',
      password: 'StrongPassw0rd!',
    })
    expect(wrapper.text()).toContain('Check your email')
    expect(wrapper.text()).toContain('user@example.com')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('redirects straight to the dashboard when sign-up returns an authenticated session', async () => {
    mockSignUp.mockImplementation(async () => {
      isLoggedIn.value = true
      return { ok: true }
    })

    const wrapper = await mountPage()

    await wrapper.get('#name').setValue('User One')
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('StrongPassw0rd!')
    await wrapper.get('#terms').setValue(true)
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })
})
