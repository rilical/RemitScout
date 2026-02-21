import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { NotFoundError, ValidationError } from '../shared/errors'

const mockRepo = {
  getUserSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllUserSessions: vi.fn(),
  createSession: vi.fn(),
}

const mockVerifySupabaseJwt = vi.hoisted(() => vi.fn())
const mockResolveAdminAccess = vi.hoisted(() => vi.fn())
const mockIssueAdminSession = vi.hoisted(() => vi.fn())
const mockRefreshAdminSession = vi.hoisted(() => vi.fn())
const mockRevokeCurrentAdminSession = vi.hoisted(() => vi.fn())
const mockGetCookieValue = vi.hoisted(() => vi.fn())
const mockGetRefreshCookieHeader = vi.hoisted(() => vi.fn(() => 'plane_a_admin_refresh=token; Path=/api/v1/sessions'))
const mockGetClearRefreshCookieHeader = vi.hoisted(() => vi.fn(() => 'plane_a_admin_refresh=; Max-Age=0'))
const mockGetRequestContext = vi.hoisted(() => vi.fn().mockReturnValue({}))
const mockLogAuditEvent = vi.hoisted(() => vi.fn())

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: (...args: unknown[]) => mockVerifySupabaseJwt(...args),
}))

vi.mock('../plane-a/src/services/admin-access', () => ({
  resolveAdminAccess: (...args: unknown[]) => mockResolveAdminAccess(...args),
}))

vi.mock('../plane-a/src/services/admin-sessions', () => {
  class AdminSessionError extends Error {
    code: string
    statusCode: number
    constructor(code: string, message: string, statusCode = 401) {
      super(message)
      this.code = code
      this.statusCode = statusCode
    }
  }

  return {
    AdminSessionError,
    getAdminRefreshCookieName: () => 'plane_a_admin_refresh',
    getCookieValue: (...args: unknown[]) => mockGetCookieValue(...args),
    getRefreshCookieHeader: (...args: unknown[]) => mockGetRefreshCookieHeader(...args),
    getClearRefreshCookieHeader: (...args: unknown[]) => mockGetClearRefreshCookieHeader(...args),
    issueAdminSession: (...args: unknown[]) => mockIssueAdminSession(...args),
    refreshAdminSession: (...args: unknown[]) => mockRefreshAdminSession(...args),
    revokeCurrentAdminSession: (...args: unknown[]) => mockRevokeCurrentAdminSession(...args),
  }
})

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: (...args: unknown[]) => mockGetRequestContext(...args),
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
    container: {
      pool: {},
      repositories: {
        session: mockRepo,
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'delete' | 'post', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('sessions route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRepo.getUserSessions.mockResolvedValue([])
    mockRepo.revokeSession.mockResolvedValue(undefined)
    mockRepo.revokeAllUserSessions.mockResolvedValue(0)
    mockRepo.createSession.mockResolvedValue(undefined)
    mockVerifySupabaseJwt.mockReset()
    mockResolveAdminAccess.mockReset()
    mockIssueAdminSession.mockReset()
    mockRefreshAdminSession.mockReset()
    mockRevokeCurrentAdminSession.mockReset()
    mockGetCookieValue.mockReset()
    mockGetRefreshCookieHeader.mockReset()
    mockGetRefreshCookieHeader.mockReturnValue('plane_a_admin_refresh=token; Path=/api/v1/sessions')
    mockGetClearRefreshCookieHeader.mockReset()
    mockGetClearRefreshCookieHeader.mockReturnValue('plane_a_admin_refresh=; Max-Age=0')
    mockGetRequestContext.mockReset()
    mockGetRequestContext.mockReturnValue({})
    mockLogAuditEvent.mockReset()
  })

  const makeReply = () => ({
    header: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis(),
  })

  it('validates missing session id on revoke', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    const handler = getHandler(app, 'delete', '/sessions/:id')
    await expect(handler({ user: { user_id: 'u-1' }, params: {} }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('returns not found when session does not exist', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    const handler = getHandler(app, 'delete', '/sessions/:id')
    await expect(
      handler({ user: { user_id: 'u-1' }, params: { id: 's-1' }, headers: {} }, {} as any),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('requires anon id for unauthenticated tracking', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    const handler = getHandler(app, 'post', '/sessions/track')
    await expect(
      handler({ body: { session_id: 'session-12345678' }, headers: {}, ip: '127.0.0.1' }, {} as any),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('stores anonymized identifiers when tracking session', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    const handler = getHandler(app, 'post', '/sessions/track')
    await handler(
      {
        body: { session_id: 'session-12345678', anon_id: 'anon-1' },
        headers: {
          'user-agent': 'Mozilla/5.0 AppleWebKit Chrome/122.0.0.0 Safari/537.36',
        },
        ip: '198.51.100.41',
      },
      {} as any,
    )

    expect(mockRepo.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.stringMatching(/^[a-f0-9]{64}$/),
        ipAddress: '198.51.100.0',
        ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        userAgent: 'chrome',
      }),
    )
  })

  it('exchanges supabase token for Plane A admin session and sets refresh cookie', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    mockVerifySupabaseJwt.mockResolvedValue({
      user_id: '00000000-0000-4000-8000-000000000111',
      email: 'ops@remit-scout.com',
      role: 'admin',
    })
    mockResolveAdminAccess.mockResolvedValue({ allowed: true, appRole: 'admin' })
    mockIssueAdminSession.mockResolvedValue({
      accessToken: 'plane_a_access',
      expiresIn: 14_400,
      tokenType: 'Bearer',
      refreshToken: 'refresh_token',
      refreshFamilyId: '00000000-0000-4000-8000-000000000222',
      jti: 'jti-1',
      expiresAt: new Date(Date.now() + 14_400_000).toISOString(),
    })

    const handler = getHandler(app, 'post', '/sessions/admin/exchange')
    const reply = makeReply()
    const response = await handler(
      {
        body: { supabase_token: 'supabase.jwt.token' },
        headers: {},
        ip: '127.0.0.1',
      },
      reply as any,
    )

    expect(response).toEqual({
      access_token: 'plane_a_access',
      expires_in: 14_400,
      token_type: 'Bearer',
    })
    expect(mockResolveAdminAccess).toHaveBeenCalled()
    expect(mockIssueAdminSession).toHaveBeenCalled()
    expect(reply.header).toHaveBeenCalledWith('set-cookie', 'plane_a_admin_refresh=token; Path=/api/v1/sessions')
  })

  it('refreshes admin session from refresh cookie when body token is absent', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    mockGetCookieValue.mockReturnValue('refresh_cookie_token')
    mockRefreshAdminSession.mockResolvedValue({
      accessToken: 'plane_a_access_2',
      expiresIn: 14_400,
      tokenType: 'Bearer',
      refreshToken: 'refresh_token_2',
      refreshFamilyId: '00000000-0000-4000-8000-000000000333',
      jti: 'jti-2',
      expiresAt: new Date(Date.now() + 14_400_000).toISOString(),
    })

    const handler = getHandler(app, 'post', '/sessions/admin/refresh')
    const reply = makeReply()
    const response = await handler(
      {
        body: {},
        headers: { cookie: 'plane_a_admin_refresh=refresh_cookie_token' },
        ip: '127.0.0.1',
      },
      reply as any,
    )

    expect(mockRefreshAdminSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'refresh_cookie_token',
      }),
    )
    expect(response).toEqual({
      access_token: 'plane_a_access_2',
      expires_in: 14_400,
      token_type: 'Bearer',
    })
    expect(reply.header).toHaveBeenCalledWith('set-cookie', 'plane_a_admin_refresh=token; Path=/api/v1/sessions')
  })

  it('returns unauthorized when refresh replay is detected', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)
    const { AdminSessionError } = await import('../plane-a/src/services/admin-sessions')

    mockGetCookieValue.mockReturnValue('refresh_cookie_token')
    mockRefreshAdminSession.mockRejectedValue(
      new AdminSessionError('refresh_replay_detected', 'Refresh token replay detected'),
    )

    const handler = getHandler(app, 'post', '/sessions/admin/refresh')
    const reply = makeReply()
    const response = await handler(
      {
        body: {},
        headers: { cookie: 'plane_a_admin_refresh=refresh_cookie_token' },
        ip: '127.0.0.1',
      },
      reply as any,
    )

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(response).toMatchObject({
      error: 'unauthorized',
      code: 'refresh_replay_detected',
    })
  })

  it('revokes current admin session and clears refresh cookie', async () => {
    const app = makeApp()
    const { sessionsRoutes } = await import('../plane-a/src/routes/sessions')
    await sessionsRoutes(app)

    mockGetCookieValue.mockReturnValue('refresh_cookie_token')
    mockRevokeCurrentAdminSession.mockResolvedValue({
      revokedJti: 'jti-logout',
      revokedRefreshRows: 1,
    })

    const handler = getHandler(app, 'delete', '/sessions/current')
    const reply = makeReply()
    const response = await handler(
      {
        user: {
          user_id: '00000000-0000-4000-8000-000000000111',
          role: 'admin',
          claims: { jti: 'jti-logout' },
        },
        headers: {
          cookie: 'plane_a_admin_refresh=refresh_cookie_token',
        },
      },
      reply as any,
    )

    expect(mockRevokeCurrentAdminSession).toHaveBeenCalled()
    expect(reply.header).toHaveBeenCalledWith('set-cookie', 'plane_a_admin_refresh=; Max-Age=0')
    expect(response).toEqual({ success: true })
  })
})
