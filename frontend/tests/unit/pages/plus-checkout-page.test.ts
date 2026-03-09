import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockCreateCheckoutSession = vi.hoisted(() => vi.fn())
const mockNavigateTo = vi.hoisted(() => vi.fn())
const mockTrackCheckoutStart = vi.hoisted(() => vi.fn())

let isAuthenticatedRef: ReturnType<typeof ref<boolean>>
let userRef: ReturnType<typeof ref<{ email?: string | null } | null>>

vi.mock('~/composables/useFeatureFlags', async () => {
  const { ref } = await import('vue')
  return {
    useFeatureFlags: () => ({
      pulseEnabled: ref(true),
    }),
  }
})

vi.mock('~/composables/useMarketingAnalytics', () => ({
  useMarketingAnalytics: () => ({
    trackCheckoutStart: (...args: unknown[]) => mockTrackCheckoutStart(...args),
  }),
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

describe('plus checkout page', () => {
  const mountPage = async () => {
    const PlusCheckoutPage = (await import('~/pages/plus/checkout.vue')).default
    const TestHost = defineComponent({
      components: { PlusCheckoutPage },
      template: '<Suspense><PlusCheckoutPage /></Suspense>',
    })

    return mount(TestHost, {
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
    isAuthenticatedRef = ref(false)
    userRef = ref(null)
    mockCreateCheckoutSession.mockResolvedValue({ ok: false, error: 'Checkout session unavailable' })
    mockNavigateTo.mockResolvedValue(undefined)
    mockTrackCheckoutStart.mockResolvedValue(undefined)

    vi.stubGlobal('useAuth', () => ({
      isAuthenticated: isAuthenticatedRef,
      user: userRef,
    }))
    vi.stubGlobal('useBilling', () => ({
      createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
    }))
    vi.stubGlobal('useApi', () => ({
      request: vi.fn().mockResolvedValue({
        success: true,
        configured: true,
        plus: {
          month: { amount: 6, currency: 'USD', priceId: 'price_month' },
          year: { amount: 60, currency: 'USD', priceId: 'price_year' },
        },
      }),
    }))
    vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
      data: ref(await handler()),
      pending: ref(false),
    }))
    vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
    vi.stubGlobal('useRoute', () => ({
      path: '/plus/checkout',
      fullPath: '/plus/checkout',
    }))
    vi.stubGlobal('useHead', vi.fn())
    vi.stubGlobal('navigateTo', (...args: unknown[]) => mockNavigateTo(...args))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps checkout public but routes signed-out users into auth with the return path preserved', async () => {
    const wrapper = await mountPage()

    await flushPromises()

    expect(wrapper.text()).toContain('Sign in required')
    expect(wrapper.text()).toContain('Create a free account first.')
    expect(wrapper.get('[data-testid="plus-checkout-submit"]').text()).toContain('Sign in to continue')

    await wrapper.get('[data-testid="plus-checkout-submit"]').trigger('click')
    await flushPromises()

    expect(mockNavigateTo).toHaveBeenCalledWith({
      path: '/sign-in',
      query: { redirect: '/plus/checkout' },
    })
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    expect(mockTrackCheckoutStart).not.toHaveBeenCalled()
  })

  it('starts the Plus checkout flow for authenticated users and tracks the attempt', async () => {
    isAuthenticatedRef.value = true
    userRef.value = { email: 'user@example.com' }

    const wrapper = await mountPage()

    await flushPromises()

    expect(wrapper.text()).toContain('Signed in as')
    expect(wrapper.text()).toContain('user@example.com')
    expect(wrapper.get('[data-testid="plus-checkout-submit"]').text()).toContain('Continue to Stripe Checkout')

    await wrapper.get('[data-testid="plus-checkout-submit"]').trigger('click')
    await flushPromises()

    expect(mockTrackCheckoutStart).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 6,
        currency: 'USD',
        plan: 'plus',
        pagePath: '/plus/checkout',
      }),
    )
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith('plus', 'month')
    expect(mockNavigateTo).toHaveBeenCalledWith('/plus/failed')
  })
})
