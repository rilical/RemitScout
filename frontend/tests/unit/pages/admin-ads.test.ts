import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('admin ads page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest.mockImplementation((url: string) => {
      if (url === '/admin/ads') {
        return Promise.resolve({
          runtime: {
            runtime_enabled: false,
            source: 'env',
            mode: 'preview_only',
            reason: 'Ads runtime is disabled. Admin preview remains available for QA only.',
          },
          summary: {
            total: 0,
            active: 0,
            inactive: 0,
            impressions_30d: 0,
            clicks_30d: 0,
          },
          ads: [],
        })
      }

      if (url === '/admin/ads/preview') {
        return Promise.resolve({
          runtime: {
            runtime_enabled: false,
            source: 'env',
            mode: 'preview_only',
            reason: 'Ads runtime is disabled. Admin preview remains available for QA only.',
          },
          simulation: {
            placement: 'compare_inline',
            seed: 'admin-preview',
            simulate_plan: 'free',
            marketing_consent: true,
            ignore_runtime_disabled: true,
          },
          eligible_count: 0,
          reason: 'runtime_disabled',
          ad: null,
        })
      }

      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('useAuth', () => ({
      isSuperAdmin: { value: false },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows preview-only runtime state when ads are disabled', async () => {
    const AdsPage = (await import('~/pages/admin/ads.vue')).default
    const wrapper = mount(AdsPage, {
      global: {
        stubs: {
          AdminPageShell: true,
          AdminSurfaceOverview: true,
          ErrorState: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Ads are runtime-disabled in this environment.')
    expect(wrapper.text()).toContain('Preview only')
    expect(wrapper.text()).toContain('No ads configured yet.')
  })
})
