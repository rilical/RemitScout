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
          summary: { free: 0, plus: 0, enterprise: 0 },
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
    vi.stubGlobal('useRoute', () => ({
      query: {
        email: 'Support@Remit-Scout.com',
      },
    }))
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
          summary: { free: 0, plus: 0, enterprise: 0 },
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

    await wrapper.get('#enterprise-grant-email').setValue('missing@example.com')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('No user found with email: missing@example.com')
  })

  it('associates the grant form labels with their inputs', async () => {
    const EnterprisePage = (await import('~/pages/admin/enterprise.vue')).default
    const wrapper = mount(EnterprisePage, {
      global: {
        stubs: {
          AdminPageShell: true,
          DataTable: true,
        },
      },
    })

    await flushPromises()

    const emailLabel = wrapper.get('label[for="enterprise-grant-email"]')
    const emailInput = wrapper.get('#enterprise-grant-email')
    const notesLabel = wrapper.get('label[for="enterprise-grant-notes"]')
    const notesInput = wrapper.get('#enterprise-grant-notes')

    expect(emailLabel.text()).toBe('User Email')
    expect(emailInput.attributes('autocomplete')).toBe('email')
    expect((emailInput.element as HTMLInputElement).value).toBe('support@remit-scout.com')
    expect((emailInput.element as HTMLInputElement).labels?.[0]?.textContent).toContain('User Email')

    expect(notesLabel.text()).toBe('Notes (optional)')
    expect((notesInput.element as HTMLInputElement).labels?.[0]?.textContent).toContain('Notes (optional)')
  })
})
