import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed as vueComputed, defineComponent, ref } from 'vue'

vi.mock('~/composables/useFeatureFlags', async () => {
  const { ref } = await import('vue')
  return {
    useFeatureFlags: () => ({
      enterpriseEnabled: ref(false),
      pulseEnabled: ref(true),
    }),
  }
})

describe('PlusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('computed', vueComputed)
    vi.stubGlobal('useAuth', () => ({
      isAuthenticated: ref(true),
    }))
    vi.stubGlobal('useEntitlements', () => ({
      isPlus: ref(false),
      storedPlanCode: ref('plus'),
      planLifecycleState: ref('past_due'),
      recoveryAvailable: ref(true),
      recoveryAction: ref('billing_portal'),
    }))
    vi.stubGlobal('useBilling', () => ({
      checkoutLoading: ref(false),
      portalLoading: ref(false),
      createCheckoutSession: vi.fn().mockResolvedValue({ ok: true, url: null }),
      openBillingPortal: vi.fn().mockResolvedValue({ ok: true }),
    }))
    vi.stubGlobal('useApi', () => ({
      request: vi.fn().mockResolvedValue({
        success: true,
        configured: true,
        plus: {
          month: { amount: 6, currency: 'USD', priceId: 'price_month' },
          year: { amount: 46, currency: 'USD', priceId: 'price_year' },
        },
      }),
    }))
    vi.stubGlobal('useAsyncData', async (_key: string, handler: () => Promise<unknown>) => ({
      data: ref(await handler()),
      pending: ref(false),
    }))
    vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
    vi.stubGlobal('navigateTo', vi.fn())
    vi.stubGlobal('useHead', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows billing recovery copy for inactive stored Plus plans', async () => {
    const PlusPage = (await import('~/domains/plus/ui/PlusPage.vue')).default
    const TestHost = defineComponent({
      components: { PlusPage },
      template: '<Suspense><PlusPage /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          NuxtImg: true,
          NuxtLink: defineComponent({
            props: { to: { type: [String, Object], required: false } },
            template: '<a><slot /></a>',
          }),
          TrustMetricsStrip: true,
          FaqAccordion: true,
          Icon: true,
        },
      },
    })

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('Plus inactive')
    expect(wrapper.text()).toContain('Reactivate billing')
    expect(wrapper.text()).not.toContain('Upgrade to Plus')
  })
})
