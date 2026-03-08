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

  it('uses country-pair search instead of raw corridor codes in the create form', async () => {
    vi.stubGlobal('useAuth', () => ({
      isSuperAdmin: { value: true },
    }))

    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/admin/institutional/clients') {
        return {
          clients: [],
          summary: {
            active: 0,
            suspended: 0,
            revoked: 0,
            trial: 0,
            standard: 0,
            premium: 0,
          },
          launch_gate: {
            ready: false,
            required_days: 30,
            available_days: 7,
            reason: 'warming',
            updated_at: '2026-03-05T00:00:00.000Z',
            blocked: true,
          },
          workflow: {
            live_activation_blocked: true,
            blocked_actions: ['rotate_api_key'],
            allowed_prelaunch_actions: ['create_client'],
            key_state: 'withheld',
          },
        }
      }

      if (path === '/indices/corridors') {
        return {
          corridors: [
            { corridorId: 'US-PH-USD-PHP' },
            { corridorId: 'US-MX-USD-MXN' },
          ],
        }
      }

      throw new Error(`Unexpected request: ${path}`)
    })

    const InstitutionalPage = (await import('~/pages/admin/institutional.vue')).default
    const wrapper = mount(InstitutionalPage, {
      global: {
        stubs: {
          AdminPageShell: true,
          AdminSurfaceOverview: true,
          DataTable: true,
          ErrorState: true,
        },
      },
    })

    await flushPromises()

    const showButton = wrapper.findAll('button').find(button => /show/i.test(button.text()))
    expect(showButton).toBeDefined()

    await showButton!.trigger('click')
    await flushPromises()

    const searchInput = wrapper
      .findAll('input[type="text"]')
      .find(input =>
        input.attributes('placeholder')?.includes('Search by send country or destination country'),
      )

    expect(searchInput).toBeDefined()

    await searchInput!.setValue('philippines')
    await flushPromises()
    await searchInput!.trigger('keydown.enter')
    await flushPromises()

    expect(wrapper.text()).toContain('Allowed country pairs')
    expect(wrapper.text()).toContain('United States -> Philippines')
    expect(wrapper.text()).not.toContain('US-PH-USD-PHP')
  })
})
