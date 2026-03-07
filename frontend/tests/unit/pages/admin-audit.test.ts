import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const mockGetLogs = vi.hoisted(() => vi.fn())
const mockExportLogs = vi.hoisted(() => vi.fn())
let auditLoading: { value: boolean } = { value: false }
let auditError: { value: string | null } = { value: null }

vi.mock('~/composables/useAudit', async () => {
  const { ref } = await import('vue')
  auditLoading = ref(false)
  auditError = ref<string | null>(null)

  return {
    useAudit: () => ({
      getLogs: mockGetLogs,
      exportLogs: mockExportLogs,
      loading: auditLoading,
      error: auditError,
    }),
  }
})

describe('admin audit page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auditLoading.value = false
    auditError.value = null
    mockGetLogs.mockResolvedValue({
      logs: [],
      pagination: { total: 0, limit: 100, offset: 0 },
    })
    mockExportLogs.mockResolvedValue('')

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('useAdminFormat', () => ({
      formatTimestamp: (value: string) => value,
    }))
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('reactive', reactive)
    vi.stubGlobal('onMounted', onMounted)
    vi.stubGlobal('onUnmounted', onUnmounted)
    vi.stubGlobal('useAudit', () => ({
      getLogs: mockGetLogs,
      exportLogs: mockExportLogs,
      loading: auditLoading,
      error: auditError,
    }))
    vi.stubGlobal('useRoute', () => ({
      query: {
        actor_id: 'user-123',
      },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hydrates actor filters from the route and requests logs with those filters', async () => {
    const AuditPage = (await import('~/pages/admin/audit.vue')).default
    mount(AuditPage, {
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

    expect(mockGetLogs).toHaveBeenCalledWith(expect.objectContaining({
      actor_id: 'user-123',
    }))
  })

  it('renders the current audit composable error state', async () => {
    auditError.value = 'Admin session has been revoked. Sign in again to continue.'

    const AuditPage = (await import('~/pages/admin/audit.vue')).default
    const wrapper = mount(AuditPage, {
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
