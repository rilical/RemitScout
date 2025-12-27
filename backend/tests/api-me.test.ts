import { describe, it, expect, vi } from 'vitest'

import { buildApp } from '../plane-a/src/app'

const shouldRun = Boolean(process.env.DATABASE_URL_PLANE_A)

describe('GET /api/me', () => {
  if (!shouldRun) {
    it.skip('DATABASE_URL_PLANE_A required', () => {})
    return
  }

  it('returns plan and entitlements for authenticated user', async () => {
    const app = buildApp()
    app.addHook('preHandler', (request, _reply, done) => {
      request.user = {
        user_id: '00000000-0000-0000-0000-000000000001',
        email: 'u@test.com',
        claims: {},
      }
      done()
    })
    const response = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { authorization: 'Bearer token' },
    })

    expect(response.statusCode).toBe(200)
    const payload = response.json()
    expect(payload.success).toBe(true)
    expect(payload.user.user_id).toBe('00000000-0000-0000-0000-000000000001')
    expect(payload.plan.plan_code).toBeDefined()
    expect(payload.entitlements).toBeDefined()
  })
})
