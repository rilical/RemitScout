import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const mockListActiveB2cProvidersByCountry = vi.fn()
const mockListByCorridor = vi.fn()
const mockListLatestByCorridorAllMethods = vi.fn()
const mockGetRateRecord = vi.fn()
const mockGetIndicesLatest = vi.fn()
const mockGetPriorityInfo = vi.fn()
const mockEnqueueRefreshRequest = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn(),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../shared/business-metrics', () => ({
  recordQuoteRequest: vi.fn(),
  recordSearch: vi.fn(),
}))

vi.mock('../plane-a/src/services/volatility-service', () => ({
  VolatilityService: vi.fn().mockImplementation(() => ({
    getCacheTtlForCorridor: vi.fn().mockResolvedValue({ ttlSeconds: 60 }),
  })),
}))

vi.mock('../plane-a/src/services/provider-metadata', () => ({
  getProviderMetadata: vi.fn((providerId: string) => ({
    slug: providerId,
    name: 'Wise',
    displayName: 'Wise',
    type: 'SPECIALIST',
    url: 'https://wise.com',
    affiliateUrl: null,
    isAffiliate: false,
    logo: { sm: '/logo.png', ico: '/logo.ico' },
    remitScore: 9.1,
    scoreBreakdown: {
      trustSafety: 0.9,
      frictionSpeed: 0.9,
      deliveredValue: 0.9,
      supportRefunds: 0.9,
    },
  })),
}))

vi.mock('../plane-a/src/repositories', () => ({
  FxRateRepository: vi.fn().mockImplementation(() => ({
    getRateRecord: mockGetRateRecord,
  })),
  LatestQuoteRepository: vi.fn().mockImplementation(() => ({
    listLatestByCorridorAllMethods: mockListLatestByCorridorAllMethods,
  })),
  RightsMatrixRepository: vi.fn().mockImplementation(() => ({
    listActiveB2cProvidersByCountry: mockListActiveB2cProvidersByCountry,
  })),
  CorridorPriorityRepository: vi.fn().mockImplementation(() => ({
    getPriorityInfo: mockGetPriorityInfo,
  })),
  CorridorCapabilityRepository: vi.fn().mockImplementation(() => ({
    listByCorridor: mockListByCorridor,
  })),
  GoldIndicesRepository: vi.fn().mockImplementation(() => ({
    getIndicesLatest: mockGetIndicesLatest,
  })),
}))

const buildQuote = (overrides: Partial<Record<string, any>> = {}) => ({
  provider_id: 'wise',
  corridor_id: 'US-PH-USD-PHP',
  amount_bucket: 500,
  payin: 'BANK',
  payout: 'BANK',
  payin_method: 'bank_transfer',
  payout_method: 'bank_deposit',
  delivery_time_min_minutes: 30,
  delivery_time_max_minutes: 90,
  collected_at: new Date().toISOString(),
  send_amount: 500,
  fee_amount: 5,
  total_debit_amount: 505,
  promotional_fee_amount: null,
  receive_amount: 27500,
  implied_fx_rate: 55,
  promotional_rate: null,
  base_rate: 55,
  promotional_cap_amount: null,
  quality_flags: null,
  updated_at: new Date().toISOString(),
  ...overrides,
})

const buildGoldIndicesRow = (overrides: Partial<Record<string, any>> = {}) => ({
  date: new Date(),
  corridor_id: 'US-PH-USD-PHP',
  amount_bucket: 500,
  method_profile: 'standard_bank',
  teer_rate: 1.2,
  rci_ratio: 0.02,
  rvi_bps: 12,
  provider_count_binned: 5,
  provider_count: 5,
  suppression_flag: false,
  suppression_reason: null,
  weighting_model: 'synthetic_volume_v1',
  methodology_version: 'indices_v2',
  mid_market_rate: 1.25,
  weight_confidence: 0.8,
  weight_window_days: 30,
  created_at: new Date(),
  ...overrides,
})

describe('providers indices gating', () => {
  let app: FastifyInstance
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockListActiveB2cProvidersByCountry.mockResolvedValue([{ provider_id: 'wise' }])
    mockListByCorridor.mockResolvedValue([])
    mockListLatestByCorridorAllMethods.mockResolvedValue([buildQuote()])
    mockGetRateRecord.mockResolvedValue({
      rate: 56,
      source: 'oanda',
      last_updated: new Date().toISOString(),
    })
    mockGetIndicesLatest.mockResolvedValue(buildGoldIndicesRow())
    mockGetPriorityInfo.mockResolvedValue({
      priorityTier: null,
      freshnessSloMinutes: null,
    })
    mockEnqueueRefreshRequest.mockResolvedValue(null)

    app = {
      get: vi.fn(),
      container: {
        pool: {},
        repositories: {
          fxRate: {
            getRateRecord: mockGetRateRecord,
          },
          latestQuote: {
            listLatestByCorridorAllMethods: mockListLatestByCorridorAllMethods,
          },
          quoteRefresh: {
            enqueueRequest: mockEnqueueRefreshRequest,
          },
          rightsMatrix: {
            listActiveB2cProvidersByCountry: mockListActiveB2cProvidersByCountry,
            listIndexPermissionsByProviders: vi.fn(async (providerIds: string[]) => (
              providerIds.map((providerId) => ({
                provider_id: providerId,
                allowed_collect: true,
                allowed_b2c: true,
                stoplist_status: 'active',
                allowed_in_teer: true,
                allowed_in_rci: true,
                allowed_in_rvi: true,
              }))
            )),
          },
          corridorPriority: {
            getPriorityInfo: mockGetPriorityInfo,
          },
          corridorCapability: {
            listByCorridor: mockListByCorridor,
          },
          goldIndices: {
            getIndicesLatest: mockGetIndicesLatest,
          },
        },
      },
    } as any

    mockReply = {
      code: vi.fn().mockReturnThis(),
    }

    const { providersRoutes } = await import('../plane-a/src/routes/providers')
    await providersRoutes(app as FastifyInstance)
  })

  it('prefers search-derived indices using the canonical $500 basis even when request bucket != 500', async () => {
    mockListLatestByCorridorAllMethods.mockResolvedValue([
      buildQuote({ amount_bucket: 100 }),
    ])

    const handler = (vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/providers')?.[2]
      ?? vi.mocked(app.get).mock.calls.find((call) => call[0] === '/providers')?.[1]) as any

    const mockRequest: Partial<FastifyRequest> = {
      query: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 100,
        method: 'bank',
        live: true,
      },
    }

    const result = await handler(mockRequest, mockReply)

    expect(result.indicesReason).toBe('computed_from_quotes')
    expect(result.indices?.source).toBe('search_estimate')
    expect(result.indices?.indicesBucket).toBe(500)
    expect(result.indices?.amount).toBe(500)
    expect(result.indices?.reason).toBe('computed_from_quotes')
    expect(mockGetIndicesLatest).not.toHaveBeenCalled()
  })

  it('falls back to search-derived indices when Gold indices are unavailable', async () => {
    mockGetIndicesLatest.mockResolvedValue(null)
    mockListLatestByCorridorAllMethods.mockResolvedValue([
      buildQuote({ amount_bucket: 100, send_amount: 100, fee_amount: 2, implied_fx_rate: 55 }),
    ])

    const handler = (vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/providers')?.[2]
      ?? vi.mocked(app.get).mock.calls.find((call) => call[0] === '/providers')?.[1]) as any

    const mockRequest: Partial<FastifyRequest> = {
      query: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 100,
        method: 'bank',
        live: true,
      },
    }

    const result = await handler(mockRequest, mockReply)

    expect(result.indicesReason).toBe('computed_from_quotes')
    expect(result.indices?.source).toBe('search_estimate')
    expect(result.indices?.indicesBucket).toBe(500)
    expect(result.indices?.amount).toBe(500)
    expect(result.indices?.teer).not.toBeNull()
    expect(result.indices?.rci).not.toBeNull()
    expect(result.indices?.reason).toBe('computed_from_quotes')
    expect(mockGetIndicesLatest).not.toHaveBeenCalled()
  })

  it('returns indicesReason unsupported_method for wallet payouts', async () => {
    mockListLatestByCorridorAllMethods.mockResolvedValue([
      buildQuote({
        payout: 'WALLET',
        payout_method: 'mobile_wallet',
      }),
    ])

    const handler = (vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/providers')?.[2]
      ?? vi.mocked(app.get).mock.calls.find((call) => call[0] === '/providers')?.[1]) as any

    const mockRequest: Partial<FastifyRequest> = {
      query: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 500,
        method: 'wallet',
        live: true,
      },
    }

    const result = await handler(mockRequest, mockReply)

    expect(result.indicesReason).toBe('unsupported_method')
    expect(result.indices).toBeUndefined()
  })

  it('prefers search-derived indices when Gold indices are suppressed for insufficient providers', async () => {
    mockGetIndicesLatest.mockResolvedValue(buildGoldIndicesRow({
      provider_count: 2,
      provider_count_binned: 2,
      suppression_flag: true,
      suppression_reason: 'insufficient_providers',
      teer_rate: null,
      rci_ratio: null,
      rvi_bps: null,
    }))
    mockListLatestByCorridorAllMethods.mockResolvedValue([
      buildQuote({ amount_bucket: 100, send_amount: 100, fee_amount: 2, implied_fx_rate: 55 }),
    ])

    const handler = (vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/providers')?.[2]
      ?? vi.mocked(app.get).mock.calls.find((call) => call[0] === '/providers')?.[1]) as any

    const mockRequest: Partial<FastifyRequest> = {
      query: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 100,
        method: 'bank',
        live: true,
      },
    }

    const result = await handler(mockRequest, mockReply)

    expect(result.indicesReason).toBe('computed_from_quotes')
    expect(result.indices?.source).toBe('search_estimate')
    expect(result.indices?.teer).not.toBeNull()
    expect(result.indices?.rci).not.toBeNull()
    expect(result.indices?.reason).toBe('computed_from_quotes')
  })

  it('prefers search-derived indices when current quotes are available even if Gold is suppressed for outliers', async () => {
    mockGetIndicesLatest.mockResolvedValue(buildGoldIndicesRow({
      provider_count: 4,
      provider_count_binned: 3,
      suppression_flag: true,
      suppression_reason: 'rate_inversion_or_outlier',
      teer_rate: 1.1,
      rci_ratio: 0.03,
      rvi_bps: 21,
    }))

    const handler = (vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/providers')?.[2]
      ?? vi.mocked(app.get).mock.calls.find((call) => call[0] === '/providers')?.[1]) as any

    const mockRequest: Partial<FastifyRequest> = {
      query: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 500,
        method: 'bank',
        live: true,
      },
    }

    const result = await handler(mockRequest, mockReply)

    expect(result.indicesReason).toBe('computed_from_quotes')
    expect(result.indices?.source).toBe('search_estimate')
    expect(result.indices?.suppressionFlag).toBeUndefined()
    expect(result.indices?.teer).not.toBeNull()
    expect(result.indices?.rci).not.toBeNull()
  })

  it('returns schema-complete quotes_unavailable payload when no quotes exist', async () => {
    mockListLatestByCorridorAllMethods.mockResolvedValue([])

    const handler = (vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/providers')?.[2]
      ?? vi.mocked(app.get).mock.calls.find((call) => call[0] === '/providers')?.[1]) as any

    const mockRequest: Partial<FastifyRequest> = {
      query: {
        corridor_id: 'US-PH-USD-PHP',
        amount_bucket: 500,
        method: 'bank',
        live: true,
      },
    }

    const result = await handler(mockRequest, mockReply)

    expect(result.error?.code).toBe('quotes_unavailable')
    expect(typeof result.comparisonId).toBe('string')
    expect(typeof result.start).toBe('string')
    expect(result.data).toEqual([])
    expect(result.cache).toEqual(
      expect.objectContaining({
        ttl_seconds: expect.any(Number),
        age_seconds: null,
        fresh: false,
      }),
    )
    expect(result.indicesReason).toBe('quotes_unavailable')
  })
})
