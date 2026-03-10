import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()
const mockValidateInstitutionalClientApiKey = vi.fn()
const mockValidateApiKey = vi.fn()

vi.mock('../shared/db', () => ({
  createPool: vi.fn(() => ({})),
  getPool: vi.fn(() => ({})),
  query: (...args: any[]) => mockQuery(...args),
  pool: {},
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  validateApiKey: (...args: any[]) => mockValidateApiKey(...args),
  validateApiKeyToken: (...args: any[]) => mockValidateApiKey(...args),
  hashApiKey: vi.fn((token: string) => token),
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
  countActiveApiKeys: vi.fn(),
}))

vi.mock('../plane-a/src/services/institutional-clients', () => ({
  validateInstitutionalClientApiKey: (...args: any[]) => mockValidateInstitutionalClientApiKey(...args),
  getInstitutionalClientScopes: vi.fn(() => ['indices:read', 'corridors:read']),
  isInstitutionalClientActive: vi.fn(() => true),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn().mockResolvedValue({
    user_id: 'user-123',
    plan_code: 'enterprise',
    status: 'active',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
  }),
  updatePlanFromStripe: vi.fn(),
}))

import { getExportTierInfo, TIER_1_CADENCE_SECONDS, TIER_2_CADENCE_SECONDS } from '../shared/corridor-tiers'

const loadIndicesSeriesApp = async () => {
  vi.resetModules()
  const { buildApp } = await import('../plane-a/src/app')
  return buildApp
}

describe('GET /api/indices/series', () => {
  const originalCorsOrigins = process.env.PLANE_A_CORS_ORIGINS

  beforeEach(() => {
    mockQuery.mockReset()
    mockValidateApiKey.mockReset()
    mockValidateInstitutionalClientApiKey.mockReset()
    process.env.PLANE_A_CORS_ORIGINS = 'http://localhost:3000'
    mockValidateInstitutionalClientApiKey.mockResolvedValue(null)
  })

  afterAll(() => {
    if (originalCorsOrigins == null) {
      delete process.env.PLANE_A_CORS_ORIGINS
      return
    }
    process.env.PLANE_A_CORS_ORIGINS = originalCorsOrigins
  })

  it('returns Gold indices for enterprise API keys', async () => {
    const buildApp = await loadIndicesSeriesApp()
    mockValidateApiKey.mockResolvedValue({
      status: 'active',
      apiKey: {
        key_id: 'key-1',
        user_id: 'user-123',
        key_prefix: 'abc12345',
        name: 'test-key',
        scopes: ['tier:2', 'indices:read'],
      },
    })
    mockQuery.mockResolvedValue({
      rows: [
        {
          date: new Date('2024-01-01T00:00:00Z'),
          corridor_id: 'US-PH-USD-PHP',
          amount_bucket: 500,
          method_profile: 'standard_bank',
          teer_rate: 1.23,
          rci_ratio: 0.02,
          rvi_bps: 12.34,
          provider_count_binned: 5,
          suppression_flag: false,
          suppression_reason: null,
          weighting_model: 'synthetic_seed_v1',
          methodology_version: 'indices_v2',
          weight_confidence: 0.8,
          weight_window_days: 30,
          created_at: new Date('2024-01-01T06:00:00Z'),
        },
      ],
    })

    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/indices/series?corridor_id=US-PH-USD-PHP&amount_bucket=500&method_profile=standard_bank&days=30',
      headers: {
        'x-api-key': 'test-key',
      },
    })

    expect(response.statusCode).toBe(200)
    const tierInfo = getExportTierInfo('US-PH-USD-PHP', 2)
    const collectionCadenceMinutes = Math.round(
      (tierInfo.collectionTier === 'tier_1' ? TIER_1_CADENCE_SECONDS : TIER_2_CADENCE_SECONDS) / 60,
    )

    expect(response.headers['x-data-tier']).toBe(String(tierInfo.exportTier))
    expect(response.headers['x-data-cadence-minutes']).toBe(String(collectionCadenceMinutes))
    expect(response.headers['x-export-cadence-minutes']).toBe(String(tierInfo.cadenceMinutes))

    const payload = response.json()
    expect(payload.corridorId).toBe('US-PH-USD-PHP')
    expect(payload.series).toHaveLength(1)
    expect(payload.series[0].teer).toBe(1.23)
    expect(payload.series[0].rvi_bps).toBe(12.34)
    expect(mockQuery).toHaveBeenCalled()
    const executedSql = mockQuery.mock.calls.map(([sql]) => String(sql))
    expect(executedSql.some((sql) => sql.includes('FROM gold_export.cdp_daily'))).toBe(true)

    await app.close()
  })

  it('rejects unauthenticated requests', async () => {
    const buildApp = await loadIndicesSeriesApp()
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/indices/series?corridor_id=US-PH-USD-PHP',
    })

    expect(response.statusCode).toBe(401)
    expect(mockQuery).not.toHaveBeenCalled()

    await app.close()
  })

  it('accepts a corridor slug and resolves it server-side', async () => {
    const buildApp = await loadIndicesSeriesApp()
    mockValidateApiKey.mockResolvedValue({
      status: 'active',
      apiKey: {
        key_id: 'key-1',
        user_id: 'user-123',
        key_prefix: 'abc12345',
        name: 'test-key',
        scopes: ['tier:2', 'indices:read'],
      },
    })
    mockQuery.mockImplementation(async (sql: unknown) => {
      const text = String(sql)
      if (text.includes('FROM silver.corridor')) {
        return { rows: [{ corridor_id: 'US-PH-USD-PHP' }] }
      }
      if (text.includes('MIN(date) AS min_date')) {
        return {
          rows: [{ min_date: new Date('2024-01-01T00:00:00Z'), max_date: new Date('2024-01-08T00:00:00Z'), total_count: 8 }],
        }
      }
      if (text.includes('ORDER BY date ASC')) {
        return {
          rows: [
            {
              date: new Date('2024-01-08T00:00:00Z'),
              corridor_id: 'US-PH-USD-PHP',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              teer_rate: 1.21,
              rci_ratio: 0.03,
              rvi_bps: 11.2,
              provider_count_binned: 5,
              provider_count: 5,
              suppression_flag: false,
              suppression_reason: null,
              weighting_model: 'synthetic_seed_v1',
              methodology_version: 'indices_v2',
              weight_confidence: 0.82,
              weight_window_days: 30,
              created_at: new Date('2024-01-08T06:00:00Z'),
            },
          ],
        }
      }
      return { rows: [] }
    })

    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/indices/series?corridor=USD-PHP&amount_bucket=500&method_profile=standard_bank&days=30',
      headers: {
        'x-api-key': 'test-key',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().corridorId).toBe('US-PH-USD-PHP')

    const executedSql = mockQuery.mock.calls.map(([sql]) => String(sql))
    expect(executedSql.some((sql) => sql.includes('FROM silver.corridor'))).toBe(true)
    expect(executedSql.some((sql) => sql.includes('FROM gold_export.cdp_daily'))).toBe(true)

    await app.close()
  })
})

describe('indices headline and methodology routes', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    mockValidateApiKey.mockReset()
    mockValidateInstitutionalClientApiKey.mockReset()
    process.env.PLANE_A_CORS_ORIGINS = 'http://localhost:3000'
    mockValidateInstitutionalClientApiKey.mockResolvedValue(null)
    mockValidateApiKey.mockResolvedValue({
      status: 'active',
      apiKey: {
        key_id: 'key-1',
        user_id: 'user-123',
        key_prefix: 'abc12345',
        name: 'test-key',
        scopes: ['tier:2', 'indices:read'],
      },
    })
  })

  it('returns headline values with 7d and 30d deltas', async () => {
    const buildApp = await loadIndicesSeriesApp()
    mockQuery.mockImplementation(async (sql: unknown) => {
      const text = String(sql)
      if (text.includes('ORDER BY date DESC')) {
        return {
          rows: [
            {
              date: new Date('2024-01-31T00:00:00Z'),
              corridor_id: 'US-PH-USD-PHP',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              teer_rate: 1.34,
              rci_ratio: 0.09,
              rvi_bps: 15.4,
              provider_count_binned: 6,
              provider_count: 6,
              suppression_flag: false,
              suppression_reason: null,
              weighting_model: 'quality_weighted_v2',
              methodology_version: 'indices_v2',
              mid_market_rate: 56.2,
              weight_confidence: 0.88,
              weight_window_days: 30,
              created_at: new Date('2024-01-31T06:00:00Z'),
            },
          ],
        }
      }
      if (text.includes('ORDER BY date ASC')) {
        return {
          rows: [
            {
              date: new Date('2024-01-01T00:00:00Z'),
              corridor_id: 'US-PH-USD-PHP',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              teer_rate: 1.1,
              rci_ratio: 0.05,
              rvi_bps: 10.1,
              provider_count_binned: 5,
              provider_count: 5,
              suppression_flag: false,
              suppression_reason: null,
              weighting_model: 'quality_weighted_v2',
              methodology_version: 'indices_v2',
              mid_market_rate: 56,
              weight_confidence: 0.84,
              weight_window_days: 30,
              created_at: new Date('2024-01-01T06:00:00Z'),
            },
            {
              date: new Date('2024-01-24T00:00:00Z'),
              corridor_id: 'US-PH-USD-PHP',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              teer_rate: 1.25,
              rci_ratio: 0.07,
              rvi_bps: 12.6,
              provider_count_binned: 6,
              provider_count: 6,
              suppression_flag: false,
              suppression_reason: null,
              weighting_model: 'quality_weighted_v2',
              methodology_version: 'indices_v2',
              mid_market_rate: 56.1,
              weight_confidence: 0.86,
              weight_window_days: 30,
              created_at: new Date('2024-01-24T06:00:00Z'),
            },
            {
              date: new Date('2024-01-31T00:00:00Z'),
              corridor_id: 'US-PH-USD-PHP',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              teer_rate: 1.34,
              rci_ratio: 0.09,
              rvi_bps: 15.4,
              provider_count_binned: 6,
              provider_count: 6,
              suppression_flag: false,
              suppression_reason: null,
              weighting_model: 'quality_weighted_v2',
              methodology_version: 'indices_v2',
              mid_market_rate: 56.2,
              weight_confidence: 0.88,
              weight_window_days: 30,
              created_at: new Date('2024-01-31T06:00:00Z'),
            },
          ],
        }
      }
      return { rows: [] }
    })

    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/indices/headline?corridor_id=US-PH-USD-PHP&amount_bucket=500&method_profile=standard_bank',
      headers: {
        'x-api-key': 'test-key',
      },
    })

    expect(response.statusCode).toBe(200)
    const payload = response.json()
    expect(payload).toMatchObject({
      corridorId: 'US-PH-USD-PHP',
      teer: {
        value: 1.34,
        confidence: 'high',
      },
      rci: {
        value: 0.09,
      },
    })
    expect(payload.teer.delta7d).toBeCloseTo(0.09, 6)
    expect(payload.teer.delta30d).toBeCloseTo(0.24, 6)
    expect(payload.rci.delta7d).toBeCloseTo(0.02, 6)
    expect(payload.rci.delta30d).toBeCloseTo(0.04, 6)

    await app.close()
  })

  it('returns methodology rows and consistency metadata', async () => {
    const buildApp = await loadIndicesSeriesApp()
    mockQuery.mockImplementation(async (sql: unknown) => {
      const text = String(sql)
      if (text.includes('ORDER BY date DESC')) {
        return {
          rows: [
            {
              date: new Date('2024-01-31T00:00:00Z'),
              corridor_id: 'US-PH-USD-PHP',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              teer_rate: 1.34,
              rci_ratio: 0.09,
              rvi_bps: 15.4,
              provider_count_binned: 2,
              provider_count: 2,
              suppression_flag: false,
              suppression_reason: null,
              weighting_model: 'quality_weighted_v2',
              methodology_version: 'indices_v2',
              mid_market_rate: 56.2,
              weight_confidence: 0.88,
              weight_window_days: 30,
              created_at: new Date('2024-01-31T06:00:00Z'),
            },
          ],
        }
      }
      if (text.includes('FROM gold.provider_weight_snapshot')) {
        return {
          rows: [
            {
              provider_id: 'wise',
              provider_name: 'Wise',
              weight: 0.55,
              quote_count: 110,
              window_days: 30,
              weight_confidence: 0.88,
              last_collected_at: new Date(),
            },
            {
              provider_id: 'remitly',
              provider_name: 'Remitly',
              weight: 0.45,
              quote_count: 98,
              window_days: 30,
              weight_confidence: 0.88,
              last_collected_at: new Date(),
            },
          ],
        }
      }
      return { rows: [] }
    })

    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/indices/methodology?corridor_id=US-PH-USD-PHP&amount_bucket=500&method_profile=standard_bank',
      headers: {
        'x-api-key': 'test-key',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      corridorId: 'US-PH-USD-PHP',
      totalProviders: 2,
      contributingProviders: 2,
      suppressedProviders: 0,
      weightConfidence: 0.88,
      weightWindowDays: 30,
      methodologyVersion: 'indices_v2',
      consistency: {
        weightSumOk: true,
        contributingCountOk: true,
        suppressedCountOk: true,
      },
    })
    expect(response.json().providers[0]).toMatchObject({
      providerId: 'wise',
      name: 'Wise',
      weight: 0.55,
      quoteCount: 110,
      suppressed: false,
    })

    await app.close()
  })
})
