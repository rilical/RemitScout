import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

const mockGetPublicPulsePublishedEmbed = vi.hoisted(() => vi.fn())
const mockGetPublicPulseEmbedSnapshot = vi.hoisted(() => vi.fn())
const mockAddVideoObjectSchema = vi.hoisted(() => vi.fn())
const routeState = vi.hoisted(() => ({
  params: { chartId: 'all-in-cost' },
  path: '/embed/pulse/all-in-cost',
  query: {} as Record<string, string>,
}))

vi.mock('~/lib/pulseApi', async () => {
  const actual = await vi.importActual<typeof import('~/lib/pulseApi')>('~/lib/pulseApi')
  return {
    ...actual,
    getPublicPulsePublishedEmbed: (...args: unknown[]) => mockGetPublicPulsePublishedEmbed(...args),
    getPublicPulseEmbedSnapshot: (...args: unknown[]) => mockGetPublicPulseEmbedSnapshot(...args),
  }
})

vi.mock('~/composables/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    pulseEnabled: { value: true },
  }),
}))

vi.mock('~/composables/useSeo', () => ({
  setSeo: vi.fn(),
}))

vi.mock('~/composables/useStructuredData', () => ({
  useStructuredData: () => ({
    addVideoObjectSchema: mockAddVideoObjectSchema,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

describe('pulse embed page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPublicPulsePublishedEmbed.mockReset()
    mockAddVideoObjectSchema.mockReset()

    vi.stubGlobal('definePageMeta', vi.fn())
    vi.stubGlobal('navigateTo', vi.fn())
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        siteUrl: 'https://remit-scout.com',
      },
    }))
    vi.stubGlobal('useHead', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mountPage = async (
    query: Record<string, string>,
    options?: {
      publishedImpl?: () => unknown
      snapshotImpl?: () => unknown
    },
  ) => {
    if (options?.publishedImpl) {
      mockGetPublicPulsePublishedEmbed.mockImplementation(options.publishedImpl)
    }
    if (options?.snapshotImpl) {
      mockGetPublicPulseEmbedSnapshot.mockImplementation(options.snapshotImpl)
    }

    routeState.params = { chartId: 'all-in-cost' }
    routeState.path = '/embed/pulse/all-in-cost'
    routeState.query = query

    const PulseEmbedPage = (await import('~/pages/embed/pulse/[chartId].vue')).default
    const TestHost = defineComponent({
      components: { PulseEmbedPage },
      template: '<Suspense><PulseEmbedPage /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          AsyncErrorBoundary: {
            template: '<div><slot /></div>',
          },
          PulseLineChart: true,
          PulseBarChart: true,
          PulseStackedChart: true,
          PulseScatterChart: true,
          PulseMatrixTable: true,
          SkeletonBlock: true,
        },
      },
    })

    await flushPromises()
    await flushPromises()
    return wrapper
  }

  it('shows an explicit message when no published or legacy snapshot id is provided', async () => {
    const wrapper = await mountPage({})

    expect(wrapper.text()).toContain('This embed link is incomplete. A published_id or legacy snapshot_id is required to render a public Pulse embed.')
    expect(mockGetPublicPulseEmbedSnapshot).not.toHaveBeenCalled()
    expect(mockGetPublicPulsePublishedEmbed).not.toHaveBeenCalled()
  })

  it('prefers published embeds over legacy snapshots when published_id is present', async () => {
    const wrapper = await mountPage(
      { published_id: '123e4567-e89b-12d3-a456-426614174001', snapshot_id: 'legacy' },
      {
        publishedImpl: () => Promise.resolve({
          publishedId: '123e4567-e89b-12d3-a456-426614174001',
          chartId: 'all-in-cost',
          chart: {
            metadata: { unit: 'percent', unitLabel: '%', lastUpdated: '2026-03-05T12:00:00.000Z' },
            series: [],
            insight: 'Published insight',
            updatedAt: '2026-03-05T12:00:00.000Z',
          },
          filters: {
            corridor: 'usd-php',
            corridorId: 'US-PH-USD-PHP',
            amount: 500,
            fundingMethod: 'bank',
            payoutMethod: 'bank',
            range: '30d',
          },
          corridorLabel: 'USD → PHP',
          theme: 'light',
          createdAt: '2026-03-05T12:00:00.000Z',
          publishedAt: '2026-03-05T12:00:00.000Z',
        }),
        snapshotImpl: () => Promise.reject(new Error('snapshot route should not be called')),
      },
    )

    expect(wrapper.text()).toContain('Published insight')
    expect(mockGetPublicPulsePublishedEmbed).toHaveBeenCalledTimes(1)
    expect(mockGetPublicPulseEmbedSnapshot).not.toHaveBeenCalled()
  })

  it('shows invalid-link copy for invalid published ids', async () => {
    const wrapper = await mountPage(
      { published_id: 'bad-id' },
      {
        publishedImpl: () => Promise.reject({
          data: {
            error: 'invalid_published_id',
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('This published Pulse embed link is invalid. Ask the publisher for a fresh embed link.')
  })

  it('shows revoked copy for removed published embeds', async () => {
    const wrapper = await mountPage(
      { published_id: '123e4567-e89b-12d3-a456-426614174000' },
      {
        publishedImpl: () => Promise.reject({
          data: {
            error: 'published_embed_revoked',
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('This published Pulse embed was removed by the publisher.')
  })

  it('shows mismatch copy when the snapshot does not belong to the requested chart', async () => {
    const wrapper = await mountPage(
      { snapshot_id: '123e4567-e89b-12d3-a456-426614174000' },
      {
        snapshotImpl: () => Promise.resolve({
          chartId: 'volatility',
          chart: {
            metadata: { unit: 'percent', unitLabel: '%', lastUpdated: '2026-03-05T12:00:00.000Z' },
            series: [],
            insight: '',
            updatedAt: '2026-03-05T12:00:00.000Z',
          },
          filters: {
            corridor: 'usd-php',
            corridorId: 'US-PH-USD-PHP',
            amount: 500,
            fundingMethod: 'bank',
            payoutMethod: 'bank',
            range: '30d',
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('This public Pulse snapshot does not match the requested chart.')
  })

  it('shows expired copy for missing legacy public snapshots', async () => {
    const wrapper = await mountPage(
      { snapshot_id: '123e4567-e89b-12d3-a456-426614174000' },
      {
        snapshotImpl: () => Promise.reject({
          data: {
            error: 'not_found',
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('This public Pulse snapshot has expired or no longer exists. Ask the publisher to generate a new snapshot.')
  })
})
