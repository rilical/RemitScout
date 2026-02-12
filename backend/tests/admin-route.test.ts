import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

vi.mock('../shared/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
}))

const mockUserAccountRepository = {
  listAdminUsers: vi.fn().mockResolvedValue([]),
}

const mockUserPlanRepository = {
  ensureUserPlan: vi.fn(),
  getUserPlan: vi.fn(),
}

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    container: {
      pool: {},
      repositories: {
        userAccount: mockUserAccountRepository,
        userPlan: mockUserPlanRepository,
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'post' | 'patch', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('admin route', () => {
  it('throws validation error for invalid users list query', async () => {
    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'get', '/admin/users')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    const invalidRequest = handler({ query: { limit: 1000 } }, reply)
    await expect(invalidRequest).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidRequest).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })

  it('throws validation error when grant payload is missing target user', async () => {
    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'post', '/admin/plans/grant')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    await expect(handler({ user: { user_id: 'u-1' }, body: { plan_code: 'enterprise' } }, reply)).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })

  it('registers admin auth preHandler', async () => {
    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/admin/users')
    expect(call?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })
})
