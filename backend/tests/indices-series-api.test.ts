import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockQuery = vi.fn()
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
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
  countActiveApiKeys: vi.fn(),
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

import { buildApp } from '../plane-a/src/app'
import { getExportTierInfo, TIER_1_CADENCE_SECONDS, TIER_2_CADENCE_SECONDS } from '../shared/corridor-tiers'

describe('GET /api/indices/series', () => {
  beforeEach(() => {
    mockQuery.mockReset()
    mockValidateApiKey.mockReset()
  })

  it('returns Gold indices for enterprise API keys', async () => {
    mockValidateApiKey.mockResolvedValue({
      key_id: 'key-1',
      user_id: 'user-123',
      key_prefix: 'abc12345',
      name: 'test-key',
      scopes: ['tier:2', 'indices:read'],
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
          weighting_model: 'synthetic_volume_v1',
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
      url: '/api/indices/series?corridor_id=US-PH-USD-PHP&amount_bucket=500&method_profile=standard_bank&days=30',
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
    const sql = mockQuery.mock.calls[0][0] as string
    expect(sql).toContain('FROM gold_export.cdp_daily')

    await app.close()
  })

  it('rejects unauthenticated requests', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/indices/series?corridor_id=US-PH-USD-PHP',
    })

    expect(response.statusCode).toBe(401)
    expect(mockQuery).not.toHaveBeenCalled()

    await app.close()
  })
})
