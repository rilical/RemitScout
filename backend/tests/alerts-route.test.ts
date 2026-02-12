import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    container: {
      pool: { query: vi.fn() },
      repositories: {
        rightsMatrix: {
          listActiveB2cProvidersByCountry: vi.fn().mockResolvedValue([]),
        },
      },
    },
  }) as unknown as FastifyInstance

describe('alerts route registration', () => {
  it('registers CRUD and eligibility endpoints', async () => {
    const app = makeApp()
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    await alertsRoutes(app)

    expect(vi.mocked(app.get).mock.calls.some((c) => c[0] === '/alerts')).toBe(true)
    expect(vi.mocked(app.get).mock.calls.some((c) => c[0] === '/alerts/corridor-eligibility')).toBe(true)
    expect(vi.mocked(app.post).mock.calls.some((c) => c[0] === '/alerts')).toBe(true)
    expect(vi.mocked(app.patch).mock.calls.some((c) => c[0] === '/alerts/:id')).toBe(true)
    expect(vi.mocked(app.delete).mock.calls.some((c) => c[0] === '/alerts/:id')).toBe(true)
  })

  it('throws validation error for malformed alert create payload', async () => {
    const app = makeApp()
    const { alertsRoutes } = await import('../plane-a/src/routes/alerts')
    await alertsRoutes(app)

    const createCall = vi.mocked(app.post).mock.calls.find((c) => c[0] === '/alerts')
    const handler = createCall?.[createCall.length - 1] as ((request: any, reply: any) => Promise<any>)

    const invalidRequest = handler(
      { user: { user_id: 'u-1' }, body: {} },
      { code: vi.fn().mockReturnThis(), send: vi.fn() },
    )

    await expect(invalidRequest).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidRequest).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })
})
