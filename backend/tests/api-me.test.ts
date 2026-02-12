import { describe, it, expect, vi } from 'vitest'

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn().mockResolvedValue({
    user_id: '00000000-0000-0000-0000-000000000001',
    email: 'u@test.com',
    claims: {},
  }),
}))

import { buildApp } from '../plane-a/src/app'

const shouldRun = Boolean(process.env.DATABASE_URL_PLANE_A)

describe('GET /api/me', () => {
  if (!shouldRun) {
    it.skip('DATABASE_URL_PLANE_A required', () => {})
    return
  }

  it('returns plan and entitlements for authenticated user', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: { authorization: 'Bearer token' },
    })

    expect(response.statusCode).toBe(200)
    const payload = response.json()
    expect(payload.success).toBe(true)
    expect(payload.user.user_id).toBe('00000000-0000-0000-0000-000000000001')
    expect(payload.plan.plan_code).toBeDefined()
    expect(payload.plan_effective).toBeDefined()
    expect(payload.plan_effective.plan_code).toBeDefined()
    expect(payload.entitlements).toBeDefined()
  })
})
