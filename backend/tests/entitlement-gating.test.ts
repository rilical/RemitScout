import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../shared/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/config')>()
  return {
    ...actual,
    config: {
      ...actual.config,
      planeA: {
        ...actual.config.planeA,
        cors: {
          ...actual.config.planeA.cors,
          origins: ['http://localhost:3000'],
        },
      },
    },
  }
})

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn().mockResolvedValue({ user_id: 'u-test', claims: {} }),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn().mockResolvedValue(undefined),
  getUserPlan: vi.fn(),
  updatePlanFromStripe: vi.fn(),
}))

import { getUserPlan } from '../plane-a/src/services/user-plan'
import { getEntitlementsForPlan } from '../plane-a/src/services/entitlements'
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

  it('allows enterprise users', async () => {
    vi.mocked(getUserPlan).mockResolvedValue({
      user_id: 'u-test',
      plan_code: 'enterprise',
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

  it('denies plus users on Pulse Pro endpoints', async () => {
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
      url: '/api/v1/pulse/market-depth',
      headers: { authorization: 'Bearer token' },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({
      error: 'forbidden',
      message: 'Full Pulse access requires an Enterprise plan.',
      details: {
        entitlement: 'pulse_full',
        capability: 'pulse_access',
        required_plan: 'enterprise',
        plan_failure: 'enterprise_required',
        purchased_plan: 'plus',
        effective_plan: 'plus',
        lifecycle_state: 'active',
        recovery_action: 'none',
      },
    })
  })

  it('maps entitlements by plan tier', () => {
    const free = getEntitlementsForPlan('free')
    const plus = getEntitlementsForPlan('plus')
    const enterprise = getEntitlementsForPlan('enterprise')
    const unknown = getEntitlementsForPlan('starter')

    expect(free.pulse_access).toBe('none')
    expect(free.exports_enabled).toBe(false)
    expect(free.api_access).toBe(false)

    expect(plus.pulse_access).toBe('lite')
    expect(plus.exports_enabled).toBe(true)
    expect(plus.api_access).toBe(false)

    expect(enterprise.pulse_access).toBe('full')
    expect(enterprise.exports_enabled).toBe(true)
    expect(enterprise.api_access).toBe(true)
    expect(enterprise.api_tier).toBe(2)
    expect(enterprise.indices_api).toBe(true)

    expect(unknown).toEqual(free)
  })
})
