import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn().mockResolvedValue({ rows: [] }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

const makeApp = () => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'put' | 'post', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('notifications route', () => {
  it('validates push subscribe payload', async () => {
    const app = makeApp()
    const { notificationsRoutes } = await import('../plane-a/src/routes/notifications')
    await notificationsRoutes(app)

    const handler = getHandler(app, 'post', '/notifications/push/subscribe')
    await expect(handler({ user: { user_id: 'u-1' }, body: {} }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('requires token or endpoint on subscribe', async () => {
    const app = makeApp()
    const { notificationsRoutes } = await import('../plane-a/src/routes/notifications')
    await notificationsRoutes(app)

    const handler = getHandler(app, 'post', '/notifications/push/subscribe')
    await expect(
      handler({ user: { user_id: 'u-1' }, body: { platform: 'web' } }, {} as any),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('registers auth preHandlers', async () => {
    const app = makeApp()
    const { notificationsRoutes } = await import('../plane-a/src/routes/notifications')
    await notificationsRoutes(app)

    const prefsCall = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/notifications/preferences')
    const subscribeCall = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === '/notifications/push/subscribe')

    expect(prefsCall?.[1]).toMatchObject({ preHandler: expect.any(Function) })
    expect(subscribeCall?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })
})
