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
        gdpr: { status: expect.any(String) },
        ccpa: { status: expect.any(String) },
        soc2_type_ii: { status: expect.any(String) },
      },
      privacy_controls: {
        k_anonymity_min: expect.any(Number),
        corridor_min_datapoints_24h: expect.any(Number),
        provider_min_quotes_per_corridor: expect.any(Number),
        trend_min_lookback_days: expect.any(Number),
        geography_scope: 'country',
      },
    })
  })
})

