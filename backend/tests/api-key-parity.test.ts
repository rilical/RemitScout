import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()
const mockValidateApiKeyToken = vi.fn()
const mockValidateInstitutionalClientApiKey = vi.fn()
const mockResolveEffectiveEntitlements = vi.fn()

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../shared/db', async () => {
  const actual = await vi.importActual<any>('../shared/db')
  return {
    ...actual,
    query: (...args: any[]) => mockQuery(...args),
  }
})

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn().mockResolvedValue({
    user_id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    claims: {},
  }),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn().mockResolvedValue({
    user_id: 'user-1',
    plan_code: 'enterprise',
    status: 'active',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
  }),
}))

vi.mock('../plane-a/src/services/effective-entitlements', () => ({
  resolveEffectiveEntitlements: (...args: any[]) => mockResolveEffectiveEntitlements(...args),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  validateApiKey: vi.fn(),
  validateApiKeyToken: (...args: any[]) => mockValidateApiKeyToken(...args),
  hashApiKey: vi.fn((token: string) => token),
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
  countActiveApiKeys: vi.fn(),
}))

vi.mock('../plane-a/src/services/institutional-clients', async () => {
  const actual = await vi.importActual<any>('../plane-a/src/services/institutional-clients')
  return {
    ...actual,
    validateInstitutionalClientApiKey: (...args: any[]) => mockValidateInstitutionalClientApiKey(...args),
  }
})

import { buildApp } from '../plane-a/src/app'

const activeRetailKey = {
  status: 'active' as const,
  apiKey: {
    key_id: 'key-1',
    user_id: 'user-1',
    key_prefix: 'abc12345',
    name: 'Retail Key',
    scopes: ['indices:read', 'corridors:read', 'exports:read'],
  },
}

const activeInstitutionalClient = {
  id: 'client-1',
  name: 'Institutional Client',
  tier: 'premium' as const,
  corridors_allowed: null,
  rate_limit_rpm: 60,
  rate_limit_daily: 100000,
  status: 'active' as const,
  contract_start: null,
  contract_end: null,
}

const activeEnterpriseEntitlements = {
  effectivePlanCode: 'enterprise',
  entitlements: {
    pulse_access: 'full',
    pulse_embeds_enabled: true,
    indices_embeds_enabled: true,
    exports_enabled: true,
    history_max_days: 365,
    alerts_max: null,
    api_access: true,
    api_key_max: 5,
    api_rate_limit_rpm: 600,
    indices_exports_enabled: true,
  },
  isPlanActive: true,
  internalEnterpriseOverride: false,
  lifecycleState: 'active',
  recoveryAvailable: false,
  recoveryAction: 'none',
  source: 'stored_plan',
}

const makeIndicesRows = () => ([
  {
    date: new Date('2026-02-14T00:00:00.000Z'),
    corridor_id: 'US-MX-USD-MXN',
    amount_bucket: 500,
    method_profile: 'standard_bank',
    teer_rate: 1.15,
    rci_ratio: 0.02,
    rvi_bps: 8,
    provider_count_binned: 5,
    provider_count: 5,
    suppression_flag: false,
    suppression_reason: null,
    weighting_model: 'synthetic_seed_v1',
    methodology_version: 'indices_v2',
    weight_confidence: 0.9,
    weight_window_days: 30,
    mid_market_rate: 1.2,
    created_at: new Date('2026-02-15T00:00:00.000Z'),
  },
])

const makeExportJob = () => ({
  id: 'export-1',
  user_id: 'user-1',
  job_type: 'history',
  status: 'done',
  params: { corridorIds: ['US-MX-USD-MXN'] },
  s3_key: 'exports/export-1.csv',
  error: null,
  created_at: new Date('2026-02-15T00:00:00.000Z'),
  updated_at: new Date('2026-02-15T00:00:00.000Z'),
  completed_at: new Date('2026-02-15T00:05:00.000Z'),
  expires_at: new Date('2026-02-20T00:00:00.000Z'),
})

const stripDynamicHistoryRange = (body: Record<string, unknown>) => {
  const { fromDate: _fromDate, toDate: _toDate, ...rest } = body
  return rest
}

const bearerHeaders = { authorization: 'Bearer token' }

describe('API-key parity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateApiKeyToken.mockResolvedValue({ status: 'invalid' })
    mockValidateInstitutionalClientApiKey.mockResolvedValue(null)
    mockResolveEffectiveEntitlements.mockResolvedValue(activeEnterpriseEntitlements)
    mockQuery.mockImplementation(async (sql: string) => {
      const text = String(sql)

      if (text.includes('FROM gold_export.cdp_daily')) {
        return {
          rows: [
            {
              date: new Date('2026-02-14T00:00:00.000Z'),
              corridor_id: 'US-MX-USD-MXN',
              amount_bucket: 500,
              method_profile: 'standard_bank',
              rci_leader_bps: 10,
              rci_median_bps: 8,
              rci_p10_bps: 6,
              rci_p90_bps: 12,
              dispersion_bps: 2,
              leader_edge_bps: 3,
              volatility_7d: 1.5,
              provider_count_binned: 5,
              suppression_flag: false,
              suppression_reason: null,
              methodology_version: 'indices_v2',
              pipeline_version: 'gold_v1',
              created_at: new Date('2026-02-15T00:00:00.000Z'),
            },
          ],
          rowCount: 1,
        }
      }

      return { rows: [], rowCount: 0 }
    })
  })

  it('returns the same /indices/series body for bearer and retail API-key callers', async () => {
    const app = await buildApp()
    app.container.repositories.goldIndices.getAvailability = vi.fn().mockResolvedValue({
      min_date: '2026-02-14',
      max_date: '2026-02-14',
      total_count: 1,
    })
    app.container.repositories.goldIndices.getIndicesSeries = vi.fn().mockResolvedValue(makeIndicesRows())

    try {
      const bearerRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/series?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: bearerHeaders,
      })

      mockValidateApiKeyToken.mockResolvedValue(activeRetailKey)
      const apiKeyRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/series?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: { 'x-api-key': 'retail-token' },
      })

      expect(apiKeyRes.statusCode).toBe(200)
      expect(apiKeyRes.json()).toEqual(bearerRes.json())
    } finally {
      await app.close()
    }
  })

  it('returns the same /indices/latest body for bearer and retail API-key callers', async () => {
    const app = await buildApp()
    app.container.repositories.goldIndices.getIndicesLatest = vi.fn().mockResolvedValue(makeIndicesRows()[0])

    try {
      const bearerRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/latest?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: bearerHeaders,
      })

      mockValidateApiKeyToken.mockResolvedValue(activeRetailKey)
      const apiKeyRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/latest?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: { 'x-api-key': 'retail-token' },
      })

      expect(apiKeyRes.statusCode).toBe(200)
      expect(apiKeyRes.json()).toEqual(bearerRes.json())
    } finally {
      await app.close()
    }
  })

  it('returns the same /history/corridor body for bearer and retail API-key callers', async () => {
    const app = await buildApp()

    try {
      const bearerRes = await app.inject({
        method: 'GET',
        url: '/api/v1/history/corridor?corridor_id=US-MX-USD-MXN',
        headers: bearerHeaders,
      })

      mockValidateApiKeyToken.mockResolvedValue(activeRetailKey)
      const apiKeyRes = await app.inject({
        method: 'GET',
        url: '/api/v1/history/corridor?corridor_id=US-MX-USD-MXN',
        headers: { 'x-api-key': 'retail-token' },
      })

      expect(apiKeyRes.statusCode).toBe(200)
      const bearerBody = bearerRes.json<Record<string, unknown>>()
      const apiKeyBody = apiKeyRes.json<Record<string, unknown>>()

      expect(bearerBody).toMatchObject({
        fromDate: expect.any(String),
        toDate: expect.any(String),
      })
      expect(apiKeyBody).toMatchObject({
        fromDate: expect.any(String),
        toDate: expect.any(String),
      })
      expect(stripDynamicHistoryRange(apiKeyBody)).toEqual(stripDynamicHistoryRange(bearerBody))
    } finally {
      await app.close()
    }
  })

  it('returns the same /exports body for bearer and retail API-key callers', async () => {
    const app = await buildApp()
    app.container.repositories.exportJob.listByUserId = vi.fn().mockResolvedValue([makeExportJob()])

    try {
      const bearerRes = await app.inject({
        method: 'GET',
        url: '/api/v1/exports',
        headers: bearerHeaders,
      })

      mockValidateApiKeyToken.mockResolvedValue(activeRetailKey)
      const apiKeyRes = await app.inject({
        method: 'GET',
        url: '/api/v1/exports',
        headers: { 'x-api-key': 'retail-token' },
      })

      expect(apiKeyRes.statusCode).toBe(200)
      expect(apiKeyRes.json()).toEqual(bearerRes.json())
    } finally {
      await app.close()
    }
  })

  it('returns the same /indices/series body for bearer and institutional callers', async () => {
    const app = await buildApp()
    app.container.repositories.goldIndices.getAvailability = vi.fn().mockResolvedValue({
      min_date: '2026-02-14',
      max_date: '2026-02-14',
      total_count: 1,
    })
    app.container.repositories.goldIndices.getIndicesSeries = vi.fn().mockResolvedValue(makeIndicesRows())

    try {
      const bearerRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/series?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: bearerHeaders,
      })

      mockValidateInstitutionalClientApiKey.mockResolvedValue(activeInstitutionalClient)
      const institutionalRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/series?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: { 'x-api-key': 'institutional-token' },
      })

      expect(institutionalRes.statusCode).toBe(200)
      expect(institutionalRes.json()).toEqual(bearerRes.json())
    } finally {
      await app.close()
    }
  })

  it('returns the same /indices/latest body for bearer and institutional callers', async () => {
    const app = await buildApp()
    app.container.repositories.goldIndices.getIndicesLatest = vi.fn().mockResolvedValue(makeIndicesRows()[0])

    try {
      const bearerRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/latest?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: bearerHeaders,
      })

      mockValidateInstitutionalClientApiKey.mockResolvedValue(activeInstitutionalClient)
      const institutionalRes = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/latest?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: { 'x-api-key': 'institutional-token' },
      })

      expect(institutionalRes.statusCode).toBe(200)
      expect(institutionalRes.json()).toEqual(bearerRes.json())
    } finally {
      await app.close()
    }
  })
})
