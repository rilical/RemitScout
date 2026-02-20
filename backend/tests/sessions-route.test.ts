import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { NotFoundError, ValidationError } from '../shared/errors'

const mockRepo = {
  getUserSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllUserSessions: vi.fn(),
  createSession: vi.fn(),
}

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
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
})
