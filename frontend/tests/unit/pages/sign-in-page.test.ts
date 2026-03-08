import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref, watch } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockRequestPasswordReset = vi.hoisted(() => vi.fn())
const mockResolvePrimaryMfaFactor = vi.hoisted(() => vi.fn())
const mockSignIn = vi.hoisted(() => vi.fn())
const mockSignInWithOAuth = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())
const mockStartMfaChallenge = vi.hoisted(() => vi.fn())
const mockVerifyMfaChallenge = vi.hoisted(() => vi.fn())
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

describe('sign-in page', () => {
  const isLoggedIn = ref(false)
  const user = ref<{ email: string } | null>(null)
  let redirect = '/dashboard'

  const mountPage = async () => {
    const SignInPage = (await import('~/pages/sign-in.vue')).default
    return mount(SignInPage, {
      global: {
        stubs: {
          NuxtImg: true,
          NuxtLink: LinkStub,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    redirect = '/dashboard'
    isLoggedIn.value = false
    user.value = null

    mockSignIn.mockResolvedValue({ ok: true })
    mockSignOut.mockResolvedValue({ ok: true })
    mockSignInWithOAuth.mockResolvedValue({ ok: true })
    mockRequestPasswordReset.mockResolvedValue({ ok: true })
    mockResolvePrimaryMfaFactor.mockResolvedValue({ id: 'factor-1' })
    mockStartMfaChallenge.mockResolvedValue({ ok: true, challengeId: 'challenge-1' })
    mockVerifyMfaChallenge.mockResolvedValue({ ok: true })
    mockNavigateTo.mockResolvedValue(undefined)

    vi.stubGlobal('useAuth', () => ({
      user,
      isLoggedIn,
      signOut: (...args: unknown[]) => mockSignOut(...args),
      signIn: (...args: unknown[]) => mockSignIn(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
      resolvePrimaryMfaFactor: (...args: unknown[]) => mockResolvePrimaryMfaFactor(...args),
      startMfaChallenge: (...args: unknown[]) => mockStartMfaChallenge(...args),
      verifyMfaChallenge: (...args: unknown[]) => mockVerifyMfaChallenge(...args),
    }))
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('watch', watch)
    vi.stubGlobal('useRoute', () => ({
      path: '/sign-in',
      query: redirect ? { redirect } : {},
    }))
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

  it('falls back to /dashboard when the redirect query is not same-origin safe', async () => {
    redirect = 'https://evil.example/steal-session'

    const wrapper = await mountPage()

    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('StrongPassw0rd!')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'StrongPassw0rd!')
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard')
  })

  it('starts MFA recovery from the sign-in page and sends a password reset email', async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      mfaRequired: true,
      factorId: 'factor-1',
    })

    const wrapper = await mountPage()

    await wrapper.get('#email').setValue('USER@example.com')
    await wrapper.get('#password').setValue('StrongPassw0rd!')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockStartMfaChallenge).toHaveBeenCalledWith('factor-1')
    expect(wrapper.text()).toContain('Multi-factor authentication required')

    const recoveryButton = wrapper
      .findAll('button')
      .find((candidate) => candidate.text().includes('Send recovery email'))
    expect(recoveryButton).toBeTruthy()
    await recoveryButton!.trigger('click')
    await flushPromises()

    expect(mockRequestPasswordReset).toHaveBeenCalledWith('user@example.com')
    expect(wrapper.text()).toContain('Recovery email sent.')
  })
})
