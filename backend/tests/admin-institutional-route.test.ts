import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

vi.mock('../shared/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  getRequestContext: vi.fn().mockReturnValue({}),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  generateApiKeyToken: vi.fn().mockReturnValue('rsk_test_token_abc123'),
  hashApiKey: vi.fn().mockReturnValue('hashed_key_abc123'),
}))

vi.mock('../plane-a/src/services/institutional-clients', () => ({
  getInstitutionalClientScopes: vi.fn().mockReturnValue(['quotes:read', 'indices:read']),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    container: {
      pool: {},
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'post' | 'patch', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('admin-institutional route', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-apply default mock return for query
    const { query } = await import('../shared/db')
    vi.mocked(query).mockResolvedValue({ rows: [] })

    const { generateApiKeyToken, hashApiKey } = await import('../plane-a/src/services/api-keys')
    vi.mocked(generateApiKeyToken).mockReturnValue('rsk_test_token_abc123')
    vi.mocked(hashApiKey).mockReturnValue('hashed_key_abc123')
  })

  it('list clients registers admin preHandler', async () => {
    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/admin/institutional/clients')
    expect(call?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })

  it('create client rejects invalid Zod body (missing name)', async () => {
    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'post', '/admin/institutional/clients')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    await expect(
      handler(
        { user: { user_id: 'u-1' }, body: { client_prefix: 'acme', tier: 'trial' } },
        reply,
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('create client calls query with INSERT and returns api_key token', async () => {
    const { query } = await import('../shared/db')
    const mockedQuery = vi.mocked(query)

    // INSERT returns a client row
    mockedQuery.mockResolvedValue({
      rows: [{ id: 'c-1', name: 'Acme', client_prefix: 'acme', tier: 'trial', status: 'active' }],
    } as any)

    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'post', '/admin/institutional/clients')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }

    const result = await handler(
      {
        user: { user_id: 'u-1', role: 'admin' },
        body: {
          name: 'Acme',
          client_prefix: 'acme',
          tier: 'trial',
          rate_limit_rpm: 60,
          rate_limit_daily: 10000,
          report_schedule: 'none',
        },
      },
      reply,
    )

    expect(result).toMatchObject({
      success: true,
      api_key: 'rsk_test_token_abc123',
    })

    const insertCall = mockedQuery.mock.calls.find((c) => typeof c[0] === 'string' && c[0].includes('INSERT'))
    expect(insertCall).toBeTruthy()
  })

  it('update client rejects empty body (no fields to update)', async () => {
    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'patch', '/admin/institutional/clients/:id')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    await expect(
      handler(
        { params: { id: 'c-1' }, user: { user_id: 'u-1' }, body: {} },
        reply,
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('status change rejects invalid status value', async () => {
    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'post', '/admin/institutional/clients/:id/status')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }
    await expect(
      handler(
        { params: { id: 'c-1' }, user: { user_id: 'u-1' }, body: { status: 'invalid_status' } },
        reply,
      ),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rotate key calls generateApiKeyToken + hashApiKey and returns token', async () => {
    const { query } = await import('../shared/db')
    const { generateApiKeyToken, hashApiKey } = await import('../plane-a/src/services/api-keys')
    const mockedQuery = vi.mocked(query)

    mockedQuery.mockResolvedValue({
      rows: [{ id: 'c-1', name: 'Acme', client_prefix: 'acme' }],
    } as any)

    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'post', '/admin/institutional/clients/:id/rotate-key')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }

    const result = await handler(
      { params: { id: 'c-1' }, user: { user_id: 'u-1', role: 'admin' } },
      reply,
    )

    expect(generateApiKeyToken).toHaveBeenCalledWith(32)
    expect(hashApiKey).toHaveBeenCalled()
    expect(result).toMatchObject({
      success: true,
      api_key: 'rsk_test_token_abc123',
    })
  })

  it('detail endpoint calls usage + export queries', async () => {
    const { query } = await import('../shared/db')
    const mockedQuery = vi.mocked(query)

    // Set up sequential mock returns: client lookup, usage query, export query
    mockedQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'c-1', name: 'Acme', client_prefix: 'acme', tier: 'standard', status: 'active' }],
      } as any)
      .mockResolvedValueOnce({
        rows: [{ endpoint: '/quotes', count: 42 }],
      } as any)
      .mockResolvedValueOnce({
        rows: [{ id: 'e-1', export_date: '2025-05-01', export_kind: 'teer', row_count: 100, created_at: '2025-05-01' }],
      } as any)

    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'get', '/admin/institutional/clients/:id')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }

    const result = await handler(
      { params: { id: 'c-1' }, user: { user_id: 'u-1' } },
      reply,
    )

    expect(result).toMatchObject({
      client: expect.objectContaining({ id: 'c-1' }),
      usage: expect.objectContaining({ total_requests_30d: 42 }),
      exports: expect.arrayContaining([expect.objectContaining({ id: 'e-1' })]),
      scopes: expect.any(Array),
    })

    // Verify usage + export queries were called
    const usageCall = mockedQuery.mock.calls.find((c) => typeof c[0] === 'string' && c[0].includes('api_usage_log'))
    const exportCall = mockedQuery.mock.calls.find((c) => typeof c[0] === 'string' && c[0].includes('institutional_export_log'))
    expect(usageCall).toBeTruthy()
    expect(exportCall).toBeTruthy()
  })
})
