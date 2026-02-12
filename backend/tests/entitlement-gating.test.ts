import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn().mockResolvedValue({ user_id: 'u-test', claims: {} }),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn(),
  updatePlanFromStripe: vi.fn(),
}))

import { getUserPlan } from '../plane-a/src/services/user-plan'
import { buildApp } from '../plane-a/src/app'

describe('entitlement gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('denies free users', async () => {
    vi.mocked(getUserPlan).mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'free',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })

    const app = await buildApp()
    app.addHook('preHandler', (request, _reply, done) => {
      request.user = { user_id: 'u-test', claims: {} }
      done()
    })
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pulse/status',
      headers: { authorization: 'Bearer token' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('allows plus users', async () => {
    vi.mocked(getUserPlan).mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'plus',
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })

    const app = await buildApp()
    app.addHook('preHandler', (request, _reply, done) => {
      request.user = { user_id: 'u-test', claims: {} }
      done()
    })
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pulse/status',
      headers: { authorization: 'Bearer token' },
    })

    expect(response.statusCode).toBe(200)
  })
})
