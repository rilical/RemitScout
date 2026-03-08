import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const mockExportVisual = vi.hoisted(() => vi.fn())
const mockEnterpriseRequest = vi.hoisted(() => vi.fn())

vi.mock('~/ui', () => ({
  DataTable: {
    name: 'DataTable',
    props: ['rows'],
    template: '<div data-testid="data-table"><slot /></div>',
  },
  Icon: {
    name: 'Icon',
    template: '<span data-testid="icon" />',
  },
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    request: mockEnterpriseRequest,
  }),
}))

vi.mock('~/composables/useEntitlements', () => ({
  useEntitlements: () => ({
    apiAccess: computed(() => true),
    apiTier: computed(() => 2),
    apiRateLimitRpm: computed(() => 600),
    indicesEmbedsEnabled: computed(() => true),
    indicesExportsEnabled: computed(() => true),
    limits: computed(() => ({
      exportsMaxDays: 365,
    })),
  }),
}))

vi.mock('~/composables/useEnterpriseApiKeys', () => ({
  useEnterpriseApiKeys: () => ({
    apiKeys: ref([]),
    apiKeysLoading: ref(false),
    apiKeysError: ref(null),
    apiKeyName: ref(''),
    apiKeyScopes: ref<string[]>([]),
    apiKeyToken: ref(null),
    apiKeyTokenLabel: ref(null),
    apiKeyCopyStatus: ref(null),
    showApiReference: ref(false),
    maxApiKeys: computed(() => 3),
    availableScopes: computed(() => []),
    activeApiKeyCount: computed(() => 0),
    apiKeyFromRow: (row: any) => row,
    columns: [],
    rowKey: () => 'key',
    fetchApiKeys: vi.fn(),
    createKey: vi.fn(),
    rotateKey: vi.fn(),
    revokeKey: vi.fn(),
    copyToken: vi.fn(),
  }),
}))

vi.mock('~/composables/useEnterpriseEmbeds', () => ({
  useEnterpriseEmbeds: () => ({
    corridorId: ref('US-PH-USD-PHP'),
    amountBucket: ref(500),
    methodProfile: ref('standard_bank'),
    days: ref(30),
    theme: ref('dark'),
    copyStatus: ref(null),
    publishedId: ref('123e4567-e89b-12d3-a456-426614174001'),
    publishedAt: ref('2026-03-05T00:00:00.000Z'),
    publishedGenerating: ref(false),
    publishedError: ref(null),
    indices: [
      { key: 'teer', label: 'TEER' },
      { key: 'rci', label: 'RCI' },
      { key: 'rvi_bps', label: 'RVI (bps)' },
    ],
    embedUrls: computed(() => ({
      teer: 'https://remit-scout.test/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174001',
      rci: 'https://remit-scout.test/embed/indices/rci?published_id=123e4567-e89b-12d3-a456-426614174001',
      rvi_bps:
        'https://remit-scout.test/embed/indices/rvi_bps?published_id=123e4567-e89b-12d3-a456-426614174001',
    })),
    embedCodes: computed(() => ({
      teer: '<iframe src="https://remit-scout.test/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174001"></iframe>',
      rci: '<iframe src="https://remit-scout.test/embed/indices/rci?published_id=123e4567-e89b-12d3-a456-426614174001"></iframe>',
      rvi_bps:
        '<iframe src="https://remit-scout.test/embed/indices/rvi_bps?published_id=123e4567-e89b-12d3-a456-426614174001"></iframe>',
    })),
    publishEmbed: vi.fn(),
    copyEmbedCode: vi.fn(),
    copyPublishedValue: vi.fn(),
    publishedEmbeds: ref([
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        surfaceKind: 'indices',
        title: 'TEER / RCI / RVI · US-PH-USD-PHP',
        theme: 'dark',
        createdAt: '2026-03-05T00:00:00.000Z',
        publishedAt: '2026-03-05T00:00:00.000Z',
        revokedAt: null,
        publicUrl:
          'https://remit-scout.test/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174001',
        embedCode:
          '<iframe src="https://remit-scout.test/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174001"></iframe>',
        variants: [
          {
            key: 'teer',
            label: 'TEER',
            publicUrl:
              'https://remit-scout.test/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174001',
            embedCode:
              '<iframe src="https://remit-scout.test/embed/indices/teer?published_id=123e4567-e89b-12d3-a456-426614174001"></iframe>',
          },
        ],
      },
    ]),
    publishedEmbedsLoading: ref(false),
    publishedEmbedsError: ref(null),
    fetchPublishedEmbeds: vi.fn(),
    revokePublishedEmbed: vi.fn(),
  }),
}))

vi.mock('~/composables/useEnterpriseExports', () => ({
  useEnterpriseExports: () => ({
    jobs: ref([]),
    loading: ref(false),
    error: ref(null),
    loaded: ref(true),
    jobType: ref('history'),
    format: ref('csv'),
    dateFrom: ref(''),
    dateTo: ref(''),
    corridorIdsText: ref(''),
    parsedCorridorIds: computed(() => []),
    exportWindowLimitDays: computed(() => 365),
    creating: ref(false),
    columns: [],
    rowKey: () => 'job',
    fromRow: (row: any) => row,
    statusClasses: () => 'bg-success-100 text-success-700',
    fetchJobs: vi.fn(),
    createJob: vi.fn(),
    downloadJob: vi.fn(),
  }),
}))

vi.mock('~/composables/useChartImageExport', async () => {
  const actual = await vi.importActual<typeof import('~/composables/useChartImageExport')>(
    '~/composables/useChartImageExport',
  )
  return {
    ...actual,
    useChartImageExport: () => ({
      exportVisual: mockExportVisual,
      exportAsImage: mockExportVisual,
      exporting: ref(false),
    }),
  }
})

describe('EnterpriseTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnterpriseRequest.mockResolvedValue({
      totalCorridors: 2,
      corridors: [
        {
          corridorId: 'US-PH-USD-PHP',
          sourceCountry: 'US',
          destCountry: 'PH',
          sourceCurrency: 'USD',
          destCurrency: 'PHP',
          dataTier: 1,
          exportCadenceMinutes: 180,
          collectionCadenceMinutes: 10,
          collectionTier: 'tier_1',
          isUsdOrigin: true,
          dataPoints: 30,
          lastUpdated: '2026-03-05T00:00:00.000Z',
        },
        {
          corridorId: 'US-MX-USD-MXN',
          sourceCountry: 'US',
          destCountry: 'MX',
          sourceCurrency: 'USD',
          destCurrency: 'MXN',
          dataTier: 1,
          exportCadenceMinutes: 180,
          collectionCadenceMinutes: 10,
          collectionTier: 'tier_1',
          isUsdOrigin: true,
          dataPoints: 30,
          lastUpdated: '2026-03-05T00:00:00.000Z',
        },
      ],
    })
  })

  const mountEnterpriseTab = async () => {
    const EnterpriseTab = (await import('~/domains/dashboard/ui/EnterpriseTab.vue')).default
    const wrapper = mount(EnterpriseTab)
    await flushPromises()
    return wrapper
  }

  it('shows the redesigned enterprise dashboard with parquet and corridor catalog messaging', async () => {
    const wrapper = await mountEnterpriseTab()

    expect(wrapper.text()).toContain('Enterprise Data Console')
    expect(wrapper.text()).toContain('Parquet')
    expect(wrapper.text()).toContain('Corridor Catalog')
    expect(wrapper.text()).toContain('Published bundles')
    expect(wrapper.text()).toContain('Data Exports')
  })

  it('adds an indices export corridor from the country-pair catalog', async () => {
    const wrapper = await mountEnterpriseTab()

    const jobTypeSelect = wrapper
      .findAll('select')
      .find(select => select.text().includes('TEER / RCI / RVI'))

    expect(jobTypeSelect).toBeDefined()
    if (!jobTypeSelect) {
      throw new Error('Expected indices export selector to be present')
    }

    await jobTypeSelect.setValue('indices')
    await flushPromises()

    const inputs = wrapper
      .findAll('input[type="text"]')
      .filter(input =>
        input.attributes('placeholder')?.includes('Search by send country or destination country'),
      )
    const exportSearchInput = inputs.at(-1)

    expect(exportSearchInput).toBeDefined()

    await exportSearchInput!.setValue('philippines')
    await flushPromises()
    await exportSearchInput!.trigger('keydown.enter')
    await flushPromises()

    expect(wrapper.text()).toContain('United States -> Philippines')
    expect(wrapper.text()).not.toContain('Add manual corridor')
  })

  it('keeps the embed search input human-readable after selecting a corridor', async () => {
    const wrapper = await mountEnterpriseTab()

    const embedSearchInput = wrapper
      .findAll('input[type="text"]')
      .find(input =>
        input.attributes('placeholder')?.includes('Search by send country or destination country'),
      )

    expect(embedSearchInput).toBeDefined()
    expect((embedSearchInput!.element as HTMLInputElement).value).toBe('United States -> Philippines')

    await embedSearchInput!.setValue('mexico')
    await flushPromises()
    await embedSearchInput!.trigger('keydown.enter')
    await flushPromises()

    expect((embedSearchInput!.element as HTMLInputElement).value).toBe('United States -> Mexico')
  })

  it('exports the rendered iframe preview for TEER', async () => {
    const wrapper = await mountEnterpriseTab()

    const pngButton = wrapper.findAll('button').find(button => button.text() === 'PNG')
    expect(pngButton).toBeDefined()

    await pngButton!.trigger('click')

    expect(mockExportVisual).toHaveBeenCalledTimes(1)
    const [target, options] = mockExportVisual.mock.calls[0]
    expect(target).toBeInstanceOf(HTMLIFrameElement)
    expect(options).toEqual(
      expect.objectContaining({
        format: 'png',
        title: 'TEER Published Embed',
      }),
    )
  })
})
