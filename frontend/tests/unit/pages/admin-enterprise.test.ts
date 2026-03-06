import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockRequest = vi.hoisted(() => vi.fn())
const mockLogError = vi.hoisted(() => vi.fn())

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}))

describe('admin enterprise page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/admin/plans') {
        return {
          users: [],
          summary: { free: 1, plus: 0, enterprise: 0 },
        }
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('useLogger', () => ({
      error: mockLogError,
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    }))
    vi.stubGlobal('useRoute', () => ({ query: {} }))
    vi.stubGlobal('useAdminFormat', () => ({
      formatTimestamp: (value: string | null) => value || 'n/a',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a specific user_not_found message when enterprise grant fails', async () => {
    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/admin/plans') {
        return {
          users: [],
          summary: { free: 1, plus: 0, enterprise: 0 },
        }
      }
      if (path === '/admin/plans/grant') {
        throw {
          message: 'Not found',
          data: {
            error: 'not_found',
            details: {
              error: 'user_not_found',
              message: 'No user found with email: missing@example.com',
            },
          },
        }
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    const EnterprisePage = (await import('~/pages/admin/enterprise.vue')).default
    const wrapper = mount(EnterprisePage, {
      global: {
        stubs: {
          AdminPageShell: true,
          DataTable: {
            props: ['error'],
            template: '<div><slot /><div v-if="error">{{ error.message }}</div></div>',
          },
        },
      },
    })

    await flushPromises()

    await wrapper.get('input[type="email"]').setValue('missing@example.com')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('No user found with email: missing@example.com')
  })
})
