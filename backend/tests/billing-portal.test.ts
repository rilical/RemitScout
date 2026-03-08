import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockIsStripeConfigured = vi.fn()
const mockEnsureUserPlan = vi.fn()
const mockGetUserPlan = vi.fn()
const mockCreatePortalSession = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAuth: () => () => undefined,
}))

vi.mock('../plane-a/src/services/stripe-client', () => ({
  isStripeConfigured: () => mockIsStripeConfigured(),
  getStripeClient: () => ({
    billingPortal: {
      sessions: {
        create: (...args: any[]) => mockCreatePortalSession(...args),
      },
    },
  }),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: (...args: any[]) => mockEnsureUserPlan(...args),
  getUserPlan: (...args: any[]) => mockGetUserPlan(...args),
}))

const makeApp = () => ({ get: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[2] as ((request: any, reply: any) => Promise<any>)
}

describe('billing portal route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsStripeConfigured.mockReturnValue(true)
    mockEnsureUserPlan.mockResolvedValue(undefined)
    mockGetUserPlan.mockResolvedValue({
      user_id: 'u-1',
      stripe_customer_id: 'cus_1',
    })
    mockCreatePortalSession.mockResolvedValue({
      url: 'https://billing.example.test/session',
    })
  })

  it('returns customer_not_found as a validation error for recovery flows', async () => {
    mockGetUserPlan.mockResolvedValueOnce({
      user_id: 'u-1',
      stripe_customer_id: null,
    })

    const app = makeApp()
    const { billingPortalRoutes } = await import('../plane-a/src/routes/billing/portal')
    await billingPortalRoutes(app)

    const handler = getHandler(app, '/billing/portal')
    await expect(
      handler({ user: { user_id: 'u-1' } }, { code: vi.fn().mockReturnThis() } as any),
    ).rejects.toMatchObject<ValidationError>({
      details: {
        error: 'customer_not_found',
        message: 'No Stripe customer was found for this account.',
      },
    })
  })
})
