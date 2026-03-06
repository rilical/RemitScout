import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const revokedAdminError = {
  message: 'Unauthorized',
  data: {
    error: 'unauthorized',
    code: 'revoked_token',
  },
}

describe('admin analytics page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('onMounted', onMounted)
    vi.stubGlobal('useAnalytics', () => ({
      getPopularCorridors: vi.fn().mockRejectedValue(revokedAdminError),
      getFavoriteProviders: vi.fn().mockRejectedValue(revokedAdminError),
      getSessionMetrics: vi.fn().mockRejectedValue(revokedAdminError),
      getHeatmapData: vi.fn().mockRejectedValue(revokedAdminError),
      getSavingsMetrics: vi.fn().mockRejectedValue(revokedAdminError),
      getUserBehaviorPatterns: vi.fn().mockRejectedValue(revokedAdminError),
      getProviderImpact: vi.fn().mockRejectedValue(revokedAdminError),
      getCorridorTrends: vi.fn().mockRejectedValue(revokedAdminError),
      getProviderCTR: vi.fn().mockRejectedValue(revokedAdminError),
      getEngagementMetrics: vi.fn().mockRejectedValue(revokedAdminError),
    }))
    vi.stubGlobal('useRemittanceApi', () => ({
      formatMoney: () => '$0',
    }))
    vi.stubGlobal('useAdminFormat', () => ({
      formatNumber: (value: number) => String(value),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('surfaces normalized revoked-session copy when analytics requests all fail', async () => {
    const AnalyticsPage = (await import('~/pages/admin/analytics.vue')).default
    const wrapper = mount(AnalyticsPage, {
      shallow: true,
      global: {
        stubs: {
          AdminPageShell: true,
          ErrorState: {
            props: ['message'],
            template: '<div data-testid="error-state">{{ message }}</div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Admin session has been revoked. Sign in again to continue.')
  })
})
