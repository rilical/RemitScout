import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())
const mockTrackPlusPurchase = vi.hoisted(() => vi.fn())
const routeState = vi.hoisted(() => ({
  path: '/plus/success',
  fullPath: '/plus/success',
  query: {} as Record<string, string>,
}))

vi.mock('~/composables/useSeo', () => ({
  setSeo: vi.fn(),
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: (...args: unknown[]) => mockRequest(...args),
  }),
}))

vi.mock('~/composables/useMarketingAnalytics', () => ({
  useMarketingAnalytics: () => ({
    trackPlusPurchase: (...args: unknown[]) => mockTrackPlusPurchase(...args),
  }),
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: () => routeState,
  }
})

const LinkStub = defineComponent({
  props: {
    to: {
      type: [String, Object],
      required: false,
    },
  },
  template: '<a><slot /></a>',
})

describe('plus success page', () => {
  const mountPage = async () => {
    const PlusSuccessPage = (await import('~/pages/plus/success.vue')).default
    const TestHost = defineComponent({
      components: { PlusSuccessPage },
      template: '<Suspense><PlusSuccessPage /></Suspense>',
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
    routeState.query = {}
    routeState.fullPath = '/plus/success'

    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/billing/pricing') {
        return {
          success: true,
          configured: true,
          plus: {
            month: { amount: 6, currency: 'USD', priceId: 'price_month' },
            year: { amount: 60, currency: 'USD', priceId: 'price_year' },
          },
        }
      }

      if (path === '/me') {
        return {
          success: true,
          billing: {
            next_billing_date: '2026-04-01T00:00:00.000Z',
            amount: 6,
            currency: 'USD',
            status: 'active',
          },
        }
      }

      return { success: true }
    })
    mockTrackPlusPurchase.mockResolvedValue(undefined)

    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://remit-scout.com',
      },
    }))
    vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
      data: ref(await handler()),
      pending: ref(false),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads billing details and tracks the Plus purchase on mount', async () => {
    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(mockRequest).toHaveBeenCalledWith('/billing/pricing', { retries: 0 })
    expect(mockRequest).toHaveBeenCalledWith('/me', { retries: 0 })
    expect(wrapper.text()).toContain('Welcome to Plus!')
    expect(wrapper.text()).toContain('Subscription Status')
    expect(wrapper.text()).toContain('active')
    expect(mockTrackPlusPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 6,
        currency: 'USD',
        plan: 'plus',
      }),
    )
  })

  it('attempts checkout session verification when a Stripe session id is present', async () => {
    routeState.query = { session_id: 'cs_test_123' }
    routeState.fullPath = '/plus/success?session_id=cs_test_123'
    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/billing/pricing') {
        return {
          success: true,
          configured: true,
          plus: {
            month: { amount: 6, currency: 'USD', priceId: 'price_month' },
            year: { amount: 60, currency: 'USD', priceId: 'price_year' },
          },
        }
      }

      if (path === '/billing/verify-session') {
        throw new Error('verification failed')
      }

      if (path === '/me') {
        return {
          success: true,
          billing: {
            next_billing_date: '2026-04-01T00:00:00.000Z',
            amount: 6,
            currency: 'USD',
            status: 'active',
          },
        }
      }

      return { success: true }
    })

    const wrapper = await mountPage()

    await flushPromises()
    await flushPromises()

    expect(mockRequest).toHaveBeenCalledWith('/billing/verify-session', {
      method: 'POST',
      body: { sessionId: 'cs_test_123' },
    })
    expect(wrapper.text()).toContain('Welcome to Plus!')
  })
})
