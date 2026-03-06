import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, reactive, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('admin feature flags page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest.mockRejectedValue({
      message: 'Unauthorized',
      data: {
        error: 'unauthorized',
        code: 'revoked_token',
      },
    })

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('reactive', reactive)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('onMounted', onMounted)
    vi.stubGlobal('useApi', () => ({
      request: mockRequest,
    }))
    vi.stubGlobal('useAdminFormat', () => ({
      formatTimestamp: (value: string | null) => value || 'n/a',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('surfaces revoked admin session errors in the flags table state', async () => {
    const FeatureFlagsPage = (await import('~/pages/admin/feature-flags.vue')).default
    const wrapper = mount(FeatureFlagsPage, {
      global: {
        stubs: {
          AdminPageShell: true,
          DataTable: {
            props: ['error'],
            template: '<div><div v-if="error">{{ error.message }}</div></div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Admin session has been revoked. Sign in again to continue.')
  })
})
