import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

vi.mock('../shared/db', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
  requireSuperAdmin: () => () => undefined,
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

const mockGetInstitutionalLaunchGate = vi.fn().mockResolvedValue({
  ready: true,
  requiredDays: 180,
  availableDays: 180,
  reason: 'ready',
  updatedAt: '2026-03-05T00:00:00.000Z',
  enforced: false,
  blocked: false,
  message: 'Institutional launch gate is open with 180 days of sellable Gold history.',
})

vi.mock('../plane-a/src/services/institutional-launch', () => ({
  getInstitutionalLaunchGate: (...args: any[]) => mockGetInstitutionalLaunchGate(...args),
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
    const { query } = await import('../shared/db')
    vi.mocked(query).mockResolvedValue({ rows: [] })

    const { generateApiKeyToken, hashApiKey } = await import('../plane-a/src/services/api-keys')
    vi.mocked(generateApiKeyToken).mockReturnValue('rsk_test_token_abc123')
    vi.mocked(hashApiKey).mockReturnValue('hashed_key_abc123')

    mockGetInstitutionalLaunchGate.mockResolvedValue({
      ready: true,
      requiredDays: 180,
      availableDays: 180,
      reason: 'ready',
      updatedAt: '2026-03-05T00:00:00.000Z',
      enforced: false,
      blocked: false,
      message: 'Institutional launch gate is open with 180 days of sellable Gold history.',
    })
  })

  it('list clients registers admin preHandler', async () => {
    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/admin/institutional/clients')
    expect(call?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })

  it('create client rejects invalid Zod body', async () => {
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

  it('create client returns live api key and workflow when gate is open', async () => {
    const { query } = await import('../shared/db')
    const mockedQuery = vi.mocked(query)

    mockedQuery.mockResolvedValue({
      rows: [{
        id: 'c-1',
        name: 'Acme',
        client_prefix: 'acme',
        tier: 'trial',
        status: 'active',
        internal_owner_email: 'owner@remit-scout.com',
        compliance_notes: 'ready for staging',
        onboarding_checklist: {},
        prelaunch_config: {},
      }],
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
          internal_owner_email: 'owner@remit-scout.com',
          compliance_notes: 'ready for staging',
          onboarding_checklist: {},
          prelaunch_config: {},
        },
      },
      reply,
    )

    expect(result).toMatchObject({
      success: true,
      api_key: 'rsk_test_token_abc123',
      launch_gate: expect.objectContaining({
        ready: true,
        blocked: false,
      }),
      workflow: expect.objectContaining({
        live_activation_blocked: false,
        blocked_actions: [],
        key_state: 'active',
      }),
    })
  })

  it('creates clients as suspended and withholds api key when launch gate is blocked', async () => {
    const { query } = await import('../shared/db')
    const mockedQuery = vi.mocked(query)

    mockGetInstitutionalLaunchGate.mockResolvedValue({
      ready: false,
      requiredDays: 180,
      availableDays: 45,
      reason: 'accumulating_history',
      updatedAt: '2026-03-05T00:00:00.000Z',
      enforced: true,
      blocked: true,
      message: 'Institutional launch is blocked until 180 days of sellable Gold history are available (45 currently available).',
    })
    mockedQuery.mockResolvedValue({
      rows: [{
        id: 'c-1',
        name: 'Acme',
        client_prefix: 'acme',
        tier: 'trial',
        status: 'suspended',
        internal_owner_email: null,
        compliance_notes: null,
        onboarding_checklist: {},
        prelaunch_config: {},
      }],
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
      client: expect.objectContaining({ status: 'suspended' }),
      api_key: null,
      launch_gate: expect.objectContaining({ blocked: true }),
      workflow: expect.objectContaining({
        live_activation_blocked: true,
        blocked_actions: expect.arrayContaining(['key_activation', 'webhook_delivery']),
        key_state: 'withheld_until_launch_gate_clears',
      }),
    })

    const insertCall = mockedQuery.mock.calls.find((call) =>
      typeof call[0] === 'string' && call[0].includes('INSERT INTO public.institutional_client'),
    )
    expect(insertCall?.[1]).toContain('suspended')
  })

  it('update client rejects empty body', async () => {
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

  it('detail endpoint returns usage, exports, launch gate, and workflow', async () => {
    const { query } = await import('../shared/db')
    const mockedQuery = vi.mocked(query)

    mockedQuery
      .mockResolvedValueOnce({
        rows: [{
          id: 'c-1',
          name: 'Acme',
          client_prefix: 'acme',
          tier: 'standard',
          status: 'active',
          internal_owner_email: 'owner@remit-scout.com',
          compliance_notes: 'notes',
          onboarding_checklist: {},
          prelaunch_config: {},
        }],
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
      launch_gate: expect.objectContaining({ ready: true }),
      workflow: expect.objectContaining({ live_activation_blocked: false }),
    })
  })

  it('blocks activation when the launch gate is closed', async () => {
    mockGetInstitutionalLaunchGate.mockResolvedValue({
      ready: false,
      requiredDays: 180,
      availableDays: 45,
      reason: 'accumulating_history',
      updatedAt: '2026-03-05T00:00:00.000Z',
      enforced: true,
      blocked: true,
      message: 'Institutional launch is blocked until 180 days of sellable Gold history are available (45 currently available).',
    })

    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'post', '/admin/institutional/clients/:id/status')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }

    const result = await handler(
      { params: { id: 'c-1' }, user: { user_id: 'u-1' }, body: { status: 'active' } },
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(409)
    expect(result).toMatchObject({
      error: 'institutional_launch_blocked',
      code: 'institutional_launch_blocked',
      launch_gate: expect.objectContaining({ blocked: true }),
      workflow: expect.objectContaining({ live_activation_blocked: true }),
    })
  })

  it('blocks key rotation while launch gate is closed', async () => {
    mockGetInstitutionalLaunchGate.mockResolvedValue({
      ready: false,
      requiredDays: 180,
      availableDays: 45,
      reason: 'accumulating_history',
      updatedAt: '2026-03-05T00:00:00.000Z',
      enforced: true,
      blocked: true,
      message: 'Institutional launch is blocked until 180 days of sellable Gold history are available (45 currently available).',
    })

    const app = makeApp()
    const { adminInstitutionalRoutes } = await import('../plane-a/src/routes/admin-institutional')
    await adminInstitutionalRoutes(app)

    const handler = getHandler(app, 'post', '/admin/institutional/clients/:id/rotate-key')
    const reply = { code: vi.fn().mockReturnThis(), send: vi.fn() }

    const result = await handler(
      { params: { id: 'c-1' }, user: { user_id: 'u-1', role: 'admin' } },
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(409)
    expect(result).toMatchObject({
      error: 'institutional_launch_blocked',
      workflow: expect.objectContaining({
        live_activation_blocked: true,
        key_state: 'withheld_until_launch_gate_clears',
      }),
    })
  })
})
