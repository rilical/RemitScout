import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { NotFoundError, ValidationError } from '../shared/errors'

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => {
    const handler = () => undefined
    ;(handler as { __guardTag?: string }).__guardTag = 'requireAdmin'
    return handler
  },
  requireAuth: () => {
    const handler = () => undefined
    ;(handler as { __guardTag?: string }).__guardTag = 'requireAuth'
    return handler
  },
}))

const makeApp = (overrides?: {
  getLogs?: ReturnType<typeof vi.fn>
  exportLogs?: ReturnType<typeof vi.fn>
  getLog?: ReturnType<typeof vi.fn>
  getActivityByUser?: ReturnType<typeof vi.fn>
}) =>
  ({
    get: vi.fn(),
    container: {
      repositories: {
        auditLog: {
          getLogs: overrides?.getLogs ?? vi.fn(),
          exportLogs: overrides?.exportLogs ?? vi.fn(),
          getLog: overrides?.getLog ?? vi.fn(),
          getActivityByUser: overrides?.getActivityByUser ?? vi.fn(),
        },
      },
    },
  }) as unknown as FastifyInstance

type RouteRequest = {
  query?: Record<string, unknown>
  params?: Record<string, string>
}

type RouteHandler = (request: RouteRequest, reply?: Record<string, unknown>) => Promise<unknown>

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as RouteHandler
}

describe('audit routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves not_found when audit event does not exist', async () => {
    const app = makeApp({ getLog: vi.fn().mockResolvedValue(null) })
    const { auditRoutes } = await import('../plane-a/src/routes/audit')
    await auditRoutes(app)

    const handler = getHandler(app, '/audit/logs/:eventId')
    await expect(handler({ params: { eventId: 'evt_missing' } }, {})).rejects.toBeInstanceOf(NotFoundError)
  })

  it('preserves validation errors thrown inside list handler try block', async () => {
    const app = makeApp({
      getLogs: vi.fn().mockRejectedValue(
        new ValidationError('Invalid request', { details: { error: 'bad_request' } }),
      ),
    })
    const { auditRoutes } = await import('../plane-a/src/routes/audit')
    await auditRoutes(app)

    const handler = getHandler(app, '/audit/logs')
    await expect(handler({ query: {} }, {})).rejects.toBeInstanceOf(ValidationError)
  })
})
