import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockRequestAccountDeletion = vi.fn()
const mockCancelAccountDeletion = vi.fn()
const mockCancelAccountDeletionByToken = vi.fn()
const mockGetRequestContext = vi.fn().mockReturnValue({ ip: '127.0.0.1' })

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/services/account-deletion-requests', () => ({
  requestAccountDeletion: (...args: any[]) => mockRequestAccountDeletion(...args),
  cancelAccountDeletion: (...args: any[]) => mockCancelAccountDeletion(...args),
  cancelAccountDeletionByToken: (...args: any[]) => mockCancelAccountDeletionByToken(...args),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: (...args: any[]) => mockGetRequestContext(...args),
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

const makeApp = () =>
  ({
    container: {
      repositories: {
        userAccount: {
          upsertUserAccount: vi.fn(),
          getPrivacySettings: vi.fn(),
          updatePrivacySettings: vi.fn(),
        },
      },
    },
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  }) as unknown as FastifyInstance

const getHandler = (
  app: FastifyInstance,
  method: 'get' | 'put' | 'delete' | 'post',
  url: string,
) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

const makeReply = () => ({
  code: vi.fn().mockReturnThis(),
  status: vi.fn().mockReturnThis(),
  type: vi.fn().mockReturnThis(),
  send: vi.fn().mockImplementation((payload) => payload),
})

describe('account routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequestAccountDeletion.mockResolvedValue({
      scheduledFor: '2026-03-08T12:00:00.000Z',
      tokenExpiresAt: '2026-03-09T12:00:00.000Z',
    })
    mockCancelAccountDeletion.mockResolvedValue(true)
    mockCancelAccountDeletionByToken.mockResolvedValue({ cancelled: true })
  })

  it('rejects account deletion requests without explicit confirmation', async () => {
    const app = makeApp()
    const { accountRoutes } = await import('../plane-a/src/routes/account')
    await accountRoutes(app)

    const handler = getHandler(app, 'delete', '/account')

    await expect(
      handler({ body: {}, user: { user_id: 'u-1', role: 'user', email: 'user@example.com' } }, makeReply()),
    ).rejects.toMatchObject({
      message: 'Account deletion requires confirmation.',
    })
  })

  it('returns a pending deletion envelope for confirmed account deletion requests', async () => {
    const app = makeApp()
    const { accountRoutes } = await import('../plane-a/src/routes/account')
    await accountRoutes(app)

    const handler = getHandler(app, 'delete', '/account')
    const reply = makeReply()
    const response = await handler(
      {
        body: { confirm: true },
        user: { user_id: 'u-1', role: 'user', email: 'user@example.com' },
      },
      reply,
    )

    expect(mockRequestAccountDeletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-1',
        requestedBy: 'u-1',
        metadata: expect.objectContaining({
          reason: 'User requested account deletion',
          actorRole: 'user',
        }),
      }),
    )
    expect(reply.code).toHaveBeenCalledWith(202)
    expect(response).toEqual({
      success: true,
      status: 'pending',
      scheduled_for: '2026-03-08T12:00:00.000Z',
      token_expires_at: '2026-03-09T12:00:00.000Z',
    })
  })

  it('returns success when an authenticated user cancels a pending deletion request', async () => {
    const app = makeApp()
    const { accountRoutes } = await import('../plane-a/src/routes/account')
    await accountRoutes(app)

    const handler = getHandler(app, 'post', '/account/deletion/cancel')
    const response = await handler(
      { user: { user_id: 'u-1', role: 'user', email: 'user@example.com' } },
      makeReply(),
    )

    expect(mockCancelAccountDeletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u-1',
      }),
    )
    expect(response).toEqual({
      success: true,
      cancelled: true,
    })
  })

  it('requires a cancel token for public deletion cancellation links', async () => {
    const app = makeApp()
    const { accountRoutes } = await import('../plane-a/src/routes/account')
    await accountRoutes(app)

    const handler = getHandler(app, 'get', '/account/deletion/cancel')

    await expect(
      handler({ query: {} }, makeReply()),
    ).rejects.toMatchObject({
      message: 'Missing cancel token.',
    })
  })
})
