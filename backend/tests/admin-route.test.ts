import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'
import { query } from '../shared/db'

const mockLogAuditEvent = vi.hoisted(() => vi.fn().mockResolvedValue('evt_admin'))
const mockGetRequestContext = vi.hoisted(() => vi.fn().mockReturnValue({ ipAddress: '203.0.113.10' }))
const mockSendAdminWebhook = vi.hoisted(() => vi.fn())
const mockClientQuery = vi.hoisted(() => vi.fn())
const mockClientRelease = vi.hoisted(() => vi.fn())
const mockPoolConnect = vi.hoisted(() => vi.fn())

vi.mock('../shared/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
  requireSuperAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
  getRequestContext: (...args: unknown[]) => mockGetRequestContext(...args),
}))

vi.mock('../plane-a/src/services/admin-webhooks', () => ({
  sendAdminWebhook: (...args: unknown[]) => mockSendAdminWebhook(...args),
}))

const mockUserAccountRepository = {
  listAdminUsers: vi.fn().mockResolvedValue([]),
}

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    container: {
      pool: {
        connect: mockPoolConnect,
      },
      repositories: {
        userAccount: mockUserAccountRepository,
      },
    },
  }) as unknown as FastifyInstance

type MockReply = {
  code: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
}

type AdminRouteHandler = (request: unknown, reply: MockReply) => Promise<unknown>

type MockQueryResult = {
  rows: Array<Record<string, unknown>>
}

const getHandler = (app: FastifyInstance, method: 'get' | 'post' | 'patch', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as AdminRouteHandler
}

describe('admin route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserAccountRepository.listAdminUsers.mockResolvedValue([])
    mockClientQuery.mockResolvedValue(undefined)
    mockClientRelease.mockReset()
    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    })
    vi.mocked(query).mockResolvedValue({ rows: [] } as MockQueryResult)
  })

  it('throws validation error for invalid users list query', async () => {
    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'get', '/admin/users')
    const reply: MockReply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
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
    const reply: MockReply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
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

  it('grants enterprise plan to an existing user looked up by email', async () => {
    vi.mocked(query)
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'user@example.com' }] } as MockQueryResult)
      .mockResolvedValueOnce({ rows: [] } as MockQueryResult)
      .mockResolvedValueOnce({
        rows: [{
          user_id: 'user-1',
          email: 'user@example.com',
          plan_code: 'enterprise',
          status: 'active',
        }],
      } as MockQueryResult)

    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'post', '/admin/plans/grant')
    const reply: MockReply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    const result = await handler({
      user: { user_id: 'admin-1', role: 'super_admin' },
      body: {
        email: 'user@example.com',
        plan_code: 'enterprise',
        notes: 'Test grant',
      },
    }, reply)

    expect(mockPoolConnect).toHaveBeenCalledTimes(1)
    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(mockClientQuery).toHaveBeenNthCalledWith(2, 'COMMIT')
    expect(vi.mocked(query)).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT user_id, email FROM silver.user_account'),
      ['user@example.com'],
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
    )
    expect(vi.mocked(query)).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO silver.user_plan'),
      ['user-1'],
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
    )
    expect(vi.mocked(query)).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE silver.user_plan p'),
      ['user-1', 'enterprise', true, 'admin-1', 'Test grant'],
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
    )
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
      expect.objectContaining({
        action: 'admin.plan.granted',
        actorId: 'admin-1',
        entityId: 'user-1',
        metadata: expect.objectContaining({
          plan_code: 'enterprise',
          email: 'user@example.com',
          notes: 'Test grant',
        }),
      }),
    )
    expect(result).toEqual({
      success: true,
      user: {
        user_id: 'user-1',
        email: 'user@example.com',
        plan_code: 'enterprise',
        status: 'active',
      },
    })
    expect(reply.code).not.toHaveBeenCalled()
  })

  it('rolls back enterprise grant when audit logging fails', async () => {
    vi.mocked(query)
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'user@example.com' }] } as MockQueryResult)
      .mockResolvedValueOnce({ rows: [] } as MockQueryResult)
      .mockResolvedValueOnce({
        rows: [{
          user_id: 'user-1',
          email: 'user@example.com',
          plan_code: 'enterprise',
          status: 'active',
        }],
      } as MockQueryResult)
    mockLogAuditEvent.mockRejectedValueOnce(new Error('audit unavailable'))

    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'post', '/admin/plans/grant')
    const reply: MockReply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    const result = await handler({
      user: { user_id: 'admin-1', role: 'super_admin' },
      body: {
        email: 'user@example.com',
        plan_code: 'enterprise',
      },
    }, reply)

    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(mockClientQuery).toHaveBeenNthCalledWith(2, 'ROLLBACK')
    expect(result).toEqual({ error: 'internal_error' })
    expect(reply.code).toHaveBeenCalledWith(500)
    expect(mockSendAdminWebhook).not.toHaveBeenCalled()
  })

  it('throws user_not_found when grant target email does not exist', async () => {
    vi.mocked(query).mockResolvedValue({ rows: [] } as MockQueryResult)

    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'post', '/admin/plans/grant')
    const reply: MockReply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    await expect(handler({
      user: { user_id: 'admin-1', role: 'super_admin' },
      body: {
        email: 'missing@example.com',
        plan_code: 'enterprise',
      },
    }, reply)).rejects.toMatchObject({
      statusCode: 404,
      code: 'not_found',
      details: {
        error: 'user_not_found',
      },
    })
  })

  it('throws user_not_found when revoke target email does not exist', async () => {
    vi.mocked(query).mockResolvedValue({ rows: [] } as MockQueryResult)

    const app = makeApp()
    const { adminRoutes } = await import('../plane-a/src/routes/admin')
    await adminRoutes(app)

    const handler = getHandler(app, 'post', '/admin/plans/revoke')
    const reply: MockReply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    await expect(handler({
      user: { user_id: 'admin-1', role: 'super_admin' },
      body: {
        email: 'missing@example.com',
      },
    }, reply)).rejects.toMatchObject({
      statusCode: 404,
      code: 'not_found',
      details: {
        error: 'user_not_found',
      },
    })
  })
})
