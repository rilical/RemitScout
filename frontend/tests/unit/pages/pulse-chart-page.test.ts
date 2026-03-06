import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

const pulseEnabledState = vi.hoisted(() => ({ value: true }))
const pulseLevelState = vi.hoisted(() => ({ value: 'none' as 'none' | 'lite' | 'full' }))
const pulseEmbedsEnabledState = vi.hoisted(() => ({ value: false }))
const indicesExportsEnabledState = vi.hoisted(() => ({ value: false }))
const mockGetPulseOverview = vi.hoisted(() => vi.fn())
const mockCreateExport = vi.hoisted(() => vi.fn())
const mockGetExportStatus = vi.hoisted(() => vi.fn())
const mockGetExportDownloadUrl = vi.hoisted(() => vi.fn())
const mockAddBreadcrumbSchema = vi.hoisted(() => vi.fn())
const routeState = vi.hoisted(() => ({
  params: { chartId: 'all-in-cost' },
  query: {
    corridor: 'usd-php',
    corridor_id: 'US-PH-USD-PHP',
    amount: '500',
  },
}))

const store = vi.hoisted(() => ({
  viewMode: 'analyst' as 'sender' | 'analyst',
  timeframe: '30D',
  corridor: { corridorId: 'US-PH-USD-PHP' },
  setViewMode: vi.fn(),
  initFromRoute: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/composables/useFeatureFlags', async () => {
  const { computed } = await import('vue')
  return {
    useFeatureFlags: () => ({
      pulseEnabled: computed(() => pulseEnabledState.value),
    }),
  }
})

vi.mock('~/composables/useEntitlements', async () => {
  const { computed } = await import('vue')
  return {
    useEntitlements: () => ({
      pulseLevel: computed(() => pulseLevelState.value),
      pulseEmbedsEnabled: computed(() => pulseEmbedsEnabledState.value),
      indicesExportsEnabled: computed(() => indicesExportsEnabledState.value),
    }),
  }
})

vi.mock('~/composables/useExports', () => ({
  useExports: () => ({
    createExport: mockCreateExport,
    getExportStatus: mockGetExportStatus,
    getExportDownloadUrl: mockGetExportDownloadUrl,
  }),
}))

vi.mock('~/lib/pulseApi', async () => {
  const actual = await vi.importActual<typeof import('~/lib/pulseApi')>('~/lib/pulseApi')
  return {
    ...actual,
    getPulseOverview: (...args: unknown[]) => mockGetPulseOverview(...args),
  }
})

vi.mock('~/stores/pulse', () => ({
  usePulseStore: () => store,
}))

vi.mock('~/composables/useStructuredData', () => ({
  useStructuredData: () => ({
    addBreadcrumbSchema: mockAddBreadcrumbSchema,
  }),
}))

vi.mock('~/composables/useSeo', () => ({
  setSeo: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

describe('pulse chart page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pulseEnabledState.value = true
    pulseLevelState.value = 'none'
    pulseEmbedsEnabledState.value = false
    indicesExportsEnabledState.value = false
    store.viewMode = 'analyst'
    store.timeframe = '30D'
    store.corridor = { corridorId: 'US-PH-USD-PHP' }
    mockGetPulseOverview.mockResolvedValue({ lastUpdated: '2026-03-05T12:00:00.000Z' })
    mockCreateExport.mockResolvedValue({ job: { id: 'job_1' } })
    mockGetExportStatus.mockResolvedValue({ job: { status: 'done' } })
    mockGetExportDownloadUrl.mockResolvedValue({ url: '/download' })
    mockAddBreadcrumbSchema.mockReset()
    routeState.params = { chartId: 'all-in-cost' }
    routeState.query = {
      corridor: 'usd-php',
      corridor_id: 'US-PH-USD-PHP',
      amount: '500',
    }
    vi.stubGlobal('useAuth', () => ({
      isAuthenticated: ref(false),
    }))
    vi.stubGlobal('useSaveAlertModal', () => ({
      open: vi.fn(),
    }))
    vi.stubGlobal('navigateTo', vi.fn())
    vi.stubGlobal('useServerSeoMeta', vi.fn())
    vi.stubGlobal('defineOgImage', vi.fn())
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://remit-scout.com',
      },
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountPage = async () => {
    const PulseChartPage = (await import('~/pages/pulse/charts/[chartId].vue')).default
    const TestHost = defineComponent({
      components: { PulseChartPage },
      template: '<Suspense><PulseChartPage /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          PulseFilterHeader: true,
          PulseChartFull: {
            props: ['chartId', 'filters', 'pulseLevel', 'canEmbed', 'initialRange'],
            emits: ['range-change'],
            template: `
              <div data-testid="pulse-chart-full">
                <button data-testid="emit-range-365d" @click="$emit('range-change', '365d')">
                  Emit 1Y range
                </button>
              </div>
            `,
          },
          PulseShareModal: {
            props: ['range'],
            template: '<div data-testid="pulse-share-modal">{{ range }}</div>',
          },
          AuthPromptModal: true,
        },
        mocks: {
          $route: {
            params: { chartId: 'all-in-cost' },
            query: {},
          },
        },
      },
    })

    await flushPromises()
    await flushPromises()
    return wrapper
  }

  it('replaces export and embed controls with enterprise lock copy when capabilities are absent', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Pulse chart exports are available on Enterprise only.')
    expect(wrapper.text()).toContain('Pulse chart access and static public embeds are available on Enterprise.')
    expect(wrapper.html()).toContain('/send-money/united-states-to-philippines')
    expect(wrapper.html()).not.toContain('/send-money/usd-to-undefined')
    expect(wrapper.text()).not.toContain('Export CSV')
    expect(wrapper.text()).not.toContain('Compliance PDF')
    expect(wrapper.text()).not.toContain('Embed Snapshot')
  })

  it('shows export and embed controls when enterprise capabilities are enabled', async () => {
    pulseLevelState.value = 'full'
    pulseEmbedsEnabledState.value = true
    indicesExportsEnabledState.value = true

    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Export CSV')
    expect(wrapper.text()).toContain('Compliance PDF')
    expect(wrapper.text()).toContain('Embed Snapshot')
  })

  it('shows live provenance metadata instead of fabricated compliance placeholders', async () => {
    pulseLevelState.value = 'full'
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Gold export updated')
    expect(wrapper.text()).toContain('US-PH-USD-PHP')
    expect(wrapper.text()).toContain('30D window')
    expect(wrapper.text()).toContain('Methodology')
    expect(wrapper.text()).not.toContain('Hash:')
    expect(wrapper.text()).not.toContain('Audit Log')
  })

  it('keeps the active chart range in the page state and embed modal', async () => {
    pulseLevelState.value = 'full'
    pulseEmbedsEnabledState.value = true
    indicesExportsEnabledState.value = true

    const wrapper = await mountPage()

    await wrapper.get('[data-testid="emit-range-365d"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('1Y window')

    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Embed Snapshot')
      ?.trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="pulse-share-modal"]').text()).toContain('365d')
  })
})
