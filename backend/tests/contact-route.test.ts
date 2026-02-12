import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { RateLimitError, ValidationError } from '../shared/errors'

const mockCheckRateLimit = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({
    query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
  }),
}))

vi.mock('../plane-a/src/utils/rate-limit', () => ({
  buildRateLimitKey: vi.fn().mockReturnValue('rate:key'),
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}))

const makeApp = () => ({ post: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('contact route', () => {
  it('validates contact payload', async () => {
    mockCheckRateLimit.mockResolvedValue(false)
    const app = makeApp()
    const { contactRoutes } = await import('../plane-a/src/routes/contact')
    await contactRoutes(app)

    const handler = getHandler(app, '/contact')
    await expect(handler({ body: { email: 'bad' }, ip: '127.0.0.1' }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('enforces contact rate limit', async () => {
    mockCheckRateLimit.mockResolvedValue(true)
    const app = makeApp()
    const { contactRoutes } = await import('../plane-a/src/routes/contact')
    await contactRoutes(app)

    const handler = getHandler(app, '/contact')
    await expect(
      handler(
        {
          ip: '127.0.0.1',
          body: {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Need help',
            message: 'This is a sufficiently long contact message.',
          },
        },
        {} as any,
      ),
    ).rejects.toBeInstanceOf(RateLimitError)
  })
})
