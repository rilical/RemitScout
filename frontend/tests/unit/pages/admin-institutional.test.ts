import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())
const mockLogError = vi.hoisted(() => vi.fn())

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('admin institutional page', () => {
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
    vi.stubGlobal('useAuth', () => ({
      isSuperAdmin: { value: false },
    }))
    vi.stubGlobal('useLogger', () => ({
      error: mockLogError,
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('surfaces revoked admin session errors in the page banner', async () => {
    const InstitutionalPage = (await import('~/pages/admin/institutional.vue')).default
    const wrapper = mount(InstitutionalPage, {
      global: {
        stubs: {
          AdminPageShell: true,
          AdminSurfaceOverview: true,
          DataTable: true,
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
