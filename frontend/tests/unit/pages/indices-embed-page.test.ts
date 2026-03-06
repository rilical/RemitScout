import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

const mockGetPublicIndicesPublishedEmbed = vi.hoisted(() => vi.fn())
const mockGetPublicIndicesEmbedSnapshot = vi.hoisted(() => vi.fn())
const mockAddVideoObjectSchema = vi.hoisted(() => vi.fn())
const routeState = vi.hoisted(() => ({
  params: { index: 'teer' },
  path: '/embed/indices/teer',
  query: {} as Record<string, string>,
}))

vi.mock('~/lib/indicesApi', async () => {
  const actual = await vi.importActual<typeof import('~/lib/indicesApi')>('~/lib/indicesApi')
  return {
    ...actual,
    getPublicIndicesPublishedEmbed: (...args: unknown[]) => mockGetPublicIndicesPublishedEmbed(...args),
    getPublicIndicesEmbedSnapshot: (...args: unknown[]) => mockGetPublicIndicesEmbedSnapshot(...args),
  }
})

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

describe('indices embed page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPublicIndicesPublishedEmbed.mockReset()
    mockGetPublicIndicesEmbedSnapshot.mockReset()
    mockAddVideoObjectSchema.mockReset()

    vi.stubGlobal('definePageMeta', vi.fn())
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
      mockGetPublicIndicesPublishedEmbed.mockImplementation(options.publishedImpl)
    }
    if (options?.snapshotImpl) {
      mockGetPublicIndicesEmbedSnapshot.mockImplementation(options.snapshotImpl)
    }

    routeState.params = { index: 'teer' }
    routeState.path = '/embed/indices/teer'
    routeState.query = query

    const IndicesEmbedPage = (await import('~/pages/embed/indices/[index].vue')).default
    const TestHost = defineComponent({
      components: { IndicesEmbedPage },
      template: '<Suspense><IndicesEmbedPage /></Suspense>',
    })

    const wrapper = mount(TestHost, {
      global: {
        stubs: {
          AsyncErrorBoundary: {
            template: '<div><slot /></div>',
          },
          PulseLineChart: true,
          SkeletonBlock: true,
          MethodologyVersionBadge: true,
          PublicationStatusBadge: true,
        },
      },
    })

    await flushPromises()
    await flushPromises()
    return wrapper
  }

  it('shows explicit copy when no published or legacy snapshot id is provided', async () => {
    const wrapper = await mountPage({})

    expect(wrapper.text()).toContain('A published_id or legacy snapshot_id is required.')
    expect(mockGetPublicIndicesPublishedEmbed).not.toHaveBeenCalled()
    expect(mockGetPublicIndicesEmbedSnapshot).not.toHaveBeenCalled()
  })

  it('prefers published embeds when published_id is present', async () => {
    const wrapper = await mountPage(
      { published_id: '123e4567-e89b-12d3-a456-426614174001', snapshot_id: 'legacy' },
      {
        publishedImpl: () => Promise.resolve({
          publishedId: '123e4567-e89b-12d3-a456-426614174001',
          corridorId: 'US-PH-USD-PHP',
          amountBucket: 500,
          methodProfile: 'standard_bank',
          weightingModel: 'synthetic_seed_v1',
          methodologyVersion: 'indices_v2',
          weightConfidence: 0.8,
          weightWindowDays: 30,
          lastUpdated: '2026-03-05T12:00:00.000Z',
          dataTier: 2,
          cadenceMinutes: 60,
          exportCadenceMinutes: 60,
          collectionCadenceMinutes: 60,
          collectionTier: 'tier_2',
          isUsdOrigin: true,
          theme: 'light',
          createdAt: '2026-03-05T12:00:00.000Z',
          publishedAt: '2026-03-05T12:00:00.000Z',
          series: [
            {
              date: '2026-03-05',
              teer: 1.23,
              rci: 0.02,
              rvi_bps: 10,
              providerCountBinned: 5,
              providerCount: 5,
              suppressionFlag: false,
              suppressionReason: null,
              suppressionReasonCode: null,
              suppressionReasonDescription: null,
              midMarketRate: 1.25,
              weightConfidence: 0.8,
              weightWindowDays: 30,
            },
          ],
          dataWindow: {
            requestedDays: 30,
            availableDays: 30,
            returnedDays: 1,
            availableStartDate: '2026-02-05',
            availableEndDate: '2026-03-05',
            startDate: '2026-02-05',
            endDate: '2026-03-05',
            capped: false,
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('Published')
    expect(mockGetPublicIndicesPublishedEmbed).toHaveBeenCalledTimes(1)
    expect(mockGetPublicIndicesEmbedSnapshot).not.toHaveBeenCalled()
  })

  it('shows revoked copy for removed published embeds', async () => {
    const wrapper = await mountPage(
      { published_id: '123e4567-e89b-12d3-a456-426614174001' },
      {
        publishedImpl: () => Promise.reject({
          data: {
            error: 'published_embed_revoked',
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('This published index embed was removed by the publisher.')
  })

  it('falls back to legacy snapshot copy for expired snapshots', async () => {
    const wrapper = await mountPage(
      { snapshot_id: '123e4567-e89b-12d3-a456-426614174001' },
      {
        snapshotImpl: () => Promise.reject({
          data: {
            error: 'not_found',
          },
        }),
      },
    )

    expect(wrapper.text()).toContain('This legacy index snapshot has expired or no longer exists.')
  })
})
