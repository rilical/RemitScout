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

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn().mockResolvedValue({
    user_id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    claims: {},
  }),
}))

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

describe('API governance regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveEffectiveEntitlements.mockResolvedValue(activeEnterpriseEntitlements)
    mockValidateApiKeyToken.mockResolvedValue({ status: 'invalid' })
    mockValidateInstitutionalClientApiKey.mockResolvedValue(null)
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
  })

  it('filters corridor coverage to active allowed_b2b rights-matrix providers', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue(activeInstitutionalClient)
    mockQuery.mockImplementation(async (sql: string) => {
      const text = String(sql)
      const hasRightsFilters =
        text.includes('allowed_collect IS TRUE')
        && text.includes('allowed_b2b IS TRUE')
        && text.includes("LOWER(COALESCE(stoplist_status, '')) = 'active'")
        && text.includes("LOWER(COALESCE(status, '')) = 'production'")

      if (text.includes('MAX(o.observed_at)')) {
        const rows = hasRightsFilters
          ? [
              {
                provider_id: 'provider-allowed',
                provider_name: 'Allowed Provider',
                last_observed_at: new Date('2026-02-15T00:00:00.000Z'),
                age_minutes: 12,
              },
            ]
          : [
              {
                provider_id: 'provider-allowed',
                provider_name: 'Allowed Provider',
                last_observed_at: new Date('2026-02-15T00:00:00.000Z'),
                age_minutes: 12,
              },
              {
                provider_id: 'provider-stoplisted',
                provider_name: 'Stoplisted Provider',
                last_observed_at: new Date('2026-02-15T00:00:00.000Z'),
                age_minutes: 12,
              },
            ]

        return { rows, rowCount: rows.length }
      }

      if (text.includes('provider_counts AS')) {
        return {
          rows: [
            {
              top_share: 0.4,
              top_two_share: 0.7,
            },
          ],
          rowCount: 1,
        }
      }

      return { rows: [], rowCount: 0 }
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'institutional-token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({
        providerCount: 1,
        providers: [{ providerId: 'provider-allowed' }],
      })

      const executedSql = mockQuery.mock.calls.map(([sql]) => String(sql))
      expect(executedSql.some((sql) => sql.includes('allowed_b2b IS TRUE'))).toBe(true)
      expect(executedSql.some((sql) => sql.includes("LOWER(COALESCE(stoplist_status, '')) = 'active'"))).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('keeps Gold suppression fields on /history/corridor for retail API-key reads', async () => {
    mockValidateApiKeyToken.mockResolvedValue(activeRetailKey)
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
              provider_count_binned: 4,
              suppression_flag: true,
              suppression_reason: 'stale_data',
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

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/history/corridor?corridor_id=US-MX-USD-MXN',
        headers: { 'x-api-key': 'retail-token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({
        data: [
          {
            suppressionFlag: true,
            suppressionReason: 'stale_data',
          },
        ],
      })
    } finally {
      await app.close()
    }
  })

  it('keeps Gold suppression fields on /indices/latest for institutional reads', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue(activeInstitutionalClient)

    const app = await buildApp()
    app.container.repositories.goldIndices.getIndicesLatest = vi.fn().mockResolvedValue({
      date: new Date('2026-02-14T00:00:00.000Z'),
      corridor_id: 'US-MX-USD-MXN',
      amount_bucket: 500,
      method_profile: 'standard_bank',
      teer_rate: 1.15,
      rci_ratio: 0.02,
      rvi_bps: 8,
      provider_count_binned: 4,
      provider_count: 4,
      suppression_flag: true,
      suppression_reason: 'stale_data',
      weighting_model: 'synthetic_seed_v1',
      methodology_version: 'indices_v2',
      weight_confidence: 0.9,
      weight_window_days: 30,
      mid_market_rate: 1.2,
      created_at: new Date('2026-02-15T00:00:00.000Z'),
    })

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/latest?corridor_id=US-MX-USD-MXN&amount_bucket=500&method_profile=standard_bank',
        headers: { 'x-api-key': 'institutional-token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({
        point: {
          suppressionFlag: true,
          suppressionReason: 'stale_data',
          suppressionReasonCode: 'stale_data',
        },
      })
    } finally {
      await app.close()
    }
  })
})
