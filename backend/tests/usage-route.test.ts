import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()

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
  verifySupabaseJwt: vi.fn().mockResolvedValue({ user_id: 'u-enterprise', claims: {} }),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn(),
  updatePlanFromStripe: vi.fn(),
}))

vi.mock('../plane-a/src/services/institutional-clients', async () => {
  const actual = await vi.importActual<any>('../plane-a/src/services/institutional-clients')
  return {
    ...actual,
    validateInstitutionalClientApiKey: vi.fn(),
  }
})

import { buildApp } from '../plane-a/src/app'
import { getUserPlan } from '../plane-a/src/services/user-plan'
import { validateInstitutionalClientApiKey } from '../plane-a/src/services/institutional-clients'

describe('/usage route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
  })

  it('returns 403 institutional_only for non-institutional enterprise users', async () => {
    vi.mocked(getUserPlan).mockResolvedValue({
      user_id: 'u-enterprise',
      plan_code: 'enterprise',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })

    mockQuery.mockImplementation(async (sql: string) => {
      const text = String(sql)
      if (text.includes('silver.account_deletion_tombstone')) {
        return { rows: [], rowCount: 0 }
      }
      return { rows: [], rowCount: 0 }
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/usage',
        headers: { authorization: 'Bearer token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toEqual({ error: 'forbidden', code: 'institutional_only' })
    } finally {
      await app.close()
    }
  })

  it('returns usage stats for institutional clients', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'trial',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    mockQuery.mockImplementation(async (sql: string) => {
      const text = String(sql)

      if (text.includes('INSERT INTO public.api_usage_log')) {
        return { rows: [], rowCount: 1 }
      }

      if (text.includes('FROM public.api_usage_log') && text.includes('GROUP BY endpoint')) {
        return {
          rows: [
            { endpoint: '/api/v1/indices/latest', requests: 900, avg_response_time_ms: 180 },
          ],
          rowCount: 1,
        }
      }

      if (text.includes("DATE_TRUNC('day', timestamp)")) {
        return {
          rows: [
            {
              day: new Date('2026-02-15T00:00:00.000Z'),
              requests: 200,
              errors4xx: 2,
              errors5xx: 0,
            },
          ],
          rowCount: 1,
        }
      }

      if (text.includes('FROM public.api_usage_log')) {
        return {
          rows: [
            {
              requests: 1234,
              errors4xx: 12,
              errors5xx: 3,
              avg_response_time_ms: 210,
            },
          ],
          rowCount: 1,
        }
      }

      if (text.includes('silver.account_deletion_tombstone')) {
        return { rows: [], rowCount: 0 }
      }

      return { rows: [], rowCount: 0 }
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/usage?days=7',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json() as any
      expect(body).toMatchObject({
        clientId: 'c-1',
        windowDays: 7,
        totals: {
          requests: 1234,
          errors4xx: 12,
          errors5xx: 3,
          avgResponseTimeMs: 210,
        },
      })
      expect(body.byEndpoint).toEqual([
        { endpoint: '/api/v1/indices/latest', requests: 900, avgResponseTimeMs: 180 },
      ])
      expect(body.byDay).toEqual([{ day: '2026-02-15', requests: 200, errors4xx: 2, errors5xx: 0 }])
    } finally {
      await app.close()
    }
  })
})

