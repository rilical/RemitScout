import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const makeApp = () => ({
  get: vi.fn(),
}) as unknown as FastifyInstance

describe('compliance route', () => {
  it('returns compliance certification and privacy control metadata', async () => {
    const app = makeApp()
    const { complianceRoutes } = await import('../plane-a/src/routes/compliance')
    await complianceRoutes(app)

    const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/compliance/status')
    const handler = call?.[call.length - 1] as (() => Promise<any>)

    const response = await handler()

    expect(response).toMatchObject({
      certifications: {
        gdpr: expect.any(String),
        ccpa: expect.any(String),
        soc2_type_ii: {
          status: expect.any(String),
          report_state: expect.any(String),
          report_date: expect.any(String),
          report_url: expect.any(String),
          expires_on: expect.any(String),
        },
      },
      privacy_controls: {
        data_minimization: 'enforced',
        ip_handling: 'truncate_then_hash',
        session_identity: 'rotating_non_persistent',
      },
    })
  })
})
