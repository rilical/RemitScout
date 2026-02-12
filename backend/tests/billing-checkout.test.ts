import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { AppError, ValidationError } from '../shared/errors'

const mockIsStripeConfigured = vi.fn()
const mockGetStripeClient = vi.fn()
const mockEnsureUserPlan = vi.fn()
const mockGetUserPlan = vi.fn()
const mockUpdatePlanFromStripe = vi.fn()

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
  ensureUserPlan: (...args: any[]) => mockEnsureUserPlan(...args),
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
  updatePlanFromStripe: (...args: any[]) => mockUpdatePlanFromStripe(...args),
}))

const makeApp = () => ({ post: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('billing checkout route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsStripeConfigured.mockReturnValue(true)
    mockGetStripeClient.mockReturnValue({
      customers: { create: vi.fn().mockResolvedValue({ id: 'cus_1' }) },
      checkout: { sessions: { create: vi.fn().mockResolvedValue({ id: 'cs_1', url: 'https://example.test' }) } },
    })
    mockEnsureUserPlan.mockResolvedValue(undefined)
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u-1',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: null,
      plan_code: 'free',
      status: 'active',
    })
    mockUpdatePlanFromStripe.mockResolvedValue(undefined)
  })

  it('validates request body', async () => {
    const app = makeApp()
    const { checkoutSessionRoutes } = await import('../plane-a/src/routes/billing/checkout-session')
    await checkoutSessionRoutes(app)

    const handler = getHandler(app, '/billing/checkout-session')
    await expect(handler({ user: { user_id: 'u-1' }, body: { plan_code: 'bad' } }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('fails when billing is not configured', async () => {
    mockIsStripeConfigured.mockReturnValue(false)

    const app = makeApp()
    const { checkoutSessionRoutes } = await import('../plane-a/src/routes/billing/checkout-session')
    await checkoutSessionRoutes(app)

    const handler = getHandler(app, '/billing/checkout-session')
    await expect(
      handler({ user: { user_id: 'u-1' }, body: { plan_code: 'plus', billing_interval: 'month' } }, {} as any),
    ).rejects.toBeInstanceOf(AppError)
  })

  it('registers auth preHandler', async () => {
    const app = makeApp()
    const { checkoutSessionRoutes } = await import('../plane-a/src/routes/billing/checkout-session')
    await checkoutSessionRoutes(app)

    const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === '/billing/checkout-session')
    expect(call?.[1]).toMatchObject({ preHandler: expect.any(Function) })
  })
})
