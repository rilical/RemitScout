import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { AppError, ValidationError } from '../shared/errors'

const mockIsStripeConfigured = vi.fn()
const mockGetStripeClient = vi.fn()
const mockGetUserPlan = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/services/stripe-client', () => ({
  isStripeConfigured: () => mockIsStripeConfigured(),
  getStripeClient: () => mockGetStripeClient(),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

const makeApp = () => ({ post: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('billing verify-session route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsStripeConfigured.mockReturnValue(true)
    mockGetStripeClient.mockReturnValue({
      checkout: { sessions: { retrieve: vi.fn().mockResolvedValue({ id: 'cs_1', customer: 'cus_1', status: 'complete', payment_status: 'paid' }) } },
    })
    mockGetUserPlan.mockResolvedValue({ stripe_customer_id: 'cus_1' })
  })

  it('validates sessionId', async () => {
    const app = makeApp()
    const { verifySessionRoutes } = await import('../plane-a/src/routes/billing/verify-session')
    await verifySessionRoutes(app)

    const handler = getHandler(app, '/billing/verify-session')
    await expect(handler({ user: { user_id: 'u-1' }, body: {} }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects session mismatch', async () => {
    mockGetUserPlan.mockResolvedValue({ stripe_customer_id: 'cus_other' })

    const app = makeApp()
    const { verifySessionRoutes } = await import('../plane-a/src/routes/billing/verify-session')
    await verifySessionRoutes(app)

    const handler = getHandler(app, '/billing/verify-session')
    await expect(
      handler({ user: { user_id: 'u-1' }, body: { sessionId: '00000000-0000-4000-8000-000000000001' } }, {} as any),
    ).rejects.toBeInstanceOf(AppError)
  })

  it('registers auth preHandler', async () => {
    const app = makeApp()
    const { verifySessionRoutes } = await import('../plane-a/src/routes/billing/verify-session')
    await verifySessionRoutes(app)

    const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === '/billing/verify-session')
    expect(call?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })
})
