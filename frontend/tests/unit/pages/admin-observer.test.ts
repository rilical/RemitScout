import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'

const mockGetModuleHealth = vi.hoisted(() => vi.fn())
const mockGetSelfHealingMetrics = vi.hoisted(() => vi.fn())
const mockGetAgentActions = vi.hoisted(() => vi.fn())
const mockGetCorridorStressOverview = vi.hoisted(() => vi.fn())
const mockGetServiceHealth = vi.hoisted(() => vi.fn())
const mockRequest = vi.hoisted(() => vi.fn())

vi.mock('~/lib/opsApi', () => ({
  getModuleHealth: (...args: unknown[]) => mockGetModuleHealth(...args),
  getSelfHealingMetrics: (...args: unknown[]) => mockGetSelfHealingMetrics(...args),
  getAgentActions: (...args: unknown[]) => mockGetAgentActions(...args),
  getCorridorStressOverview: (...args: unknown[]) => mockGetCorridorStressOverview(...args),
  getServiceHealth: (...args: unknown[]) => mockGetServiceHealth(...args),
}))

describe('admin observer page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest.mockImplementation(async (path: string) => {
      if (path === '/me') {
        return { user: { app_role: 'super_admin' } }
      }
      if (path === '/ops/indices/health') {
        return { status: 'ok', summary: {} }
      }
      if (path === '/ops/b2b-sweep-status') {
        return { schedule: [] }
      }
      if (path === '/ops/observer/summary') {
        throw {
          message: 'Unauthorized',
          data: {
            error: 'unauthorized',
            code: 'revoked_token',
          },
        }
      }
      if (path === '/ops/providers/health') {
        return { summary: { total_providers: 24, healthy_providers: 24 }, providers: [] }
      }
      throw new Error(`Unexpected request: ${path}`)
    })

    mockGetModuleHealth.mockResolvedValue({ modules: [] })
    mockGetSelfHealingMetrics.mockResolvedValue({ pending_bundles: 0 })
    mockGetAgentActions.mockResolvedValue({ actions: [] })
    mockGetCorridorStressOverview.mockResolvedValue({ corridors: [] })
    mockGetServiceHealth.mockResolvedValue({ services: [], updatedAt: null })

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('useAdminPage', vi.fn())
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('watch', watch)
    vi.stubGlobal('onMounted', onMounted)
    vi.stubGlobal('onUnmounted', onUnmounted)
    vi.stubGlobal('useApi', () => ({
      request: mockRequest,
    }))
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        remitScoutEnv: 'staging',
        awsRegion: 'us-east-1',
      },
    }))
    vi.stubGlobal('useAdminFormat', () => ({
      formatPercent: () => '0%',
      formatNumber: (value: number) => String(value),
      formatTimestamp: (value: string | null) => value || 'n/a',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('surfaces normalized admin auth failures when observer panels reject', async () => {
    const ObserverPage = (await import('~/pages/admin/observer.vue')).default
    const wrapper = mount(ObserverPage, {
      shallow: true,
      global: {
        stubs: {
          NuxtLink: true,
          ErrorState: {
            props: ['message'],
            template: '<div data-testid="error-state">{{ message }}</div>',
          },
          SelfHealingKpiTiles: true,
          AgentActionTimeline: true,
        },
      },
    })

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('Admin session has been revoked. Sign in again to continue.')
  })
})
