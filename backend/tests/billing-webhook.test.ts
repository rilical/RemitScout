import { beforeEach, describe, expect, it, vi } from 'vitest'
import Stripe from 'stripe'

const mockDbQuery = vi.fn()
const mockInsertEvent = vi.fn()
const mockMarkAsProcessed = vi.fn()
const mockGetUserPlan = vi.fn()
const mockGetUserPlanByCustomerId = vi.fn()
const mockUpdatePlan = vi.fn()
const mockSendPlusConfirmationEmail = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({ query: (...args: any[]) => mockDbQuery(...args) }),
  query: (...args: any[]) => mockDbQuery(...args),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/services/billing-email', () => ({
  sendPlusConfirmationEmail: (...args: any[]) => mockSendPlusConfirmationEmail(...args),
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
  sendCancellationEmail: vi.fn().mockResolvedValue(undefined),
  sendCancellationScheduledEmail: vi.fn().mockResolvedValue(undefined),
  sendChargebackAdminEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../plane-a/src/repositories', async () => {
  const actual = await vi.importActual<typeof import('../plane-a/src/repositories')>(
    '../plane-a/src/repositories',
  )

  return {
    ...actual,
    BillingWebhookEventRepository: class {
      insertEvent = mockInsertEvent
      markAsProcessed = mockMarkAsProcessed
      getEvent = vi.fn().mockResolvedValue(null)
    },
    DailyUsageCounterRepository: class {
      incrementAndGet = vi.fn().mockResolvedValue(0)
      getCount = vi.fn().mockResolvedValue(0)
    },
    UserPlanRepository: class {
      getUserPlan = mockGetUserPlan
      getUserPlanByCustomerId = mockGetUserPlanByCustomerId
      updatePlan = mockUpdatePlan
    },
  }
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret'

describe('billing webhook idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockDbQuery.mockResolvedValue({ rows: [], rowCount: 0 })
    mockInsertEvent.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    mockMarkAsProcessed.mockResolvedValue(undefined)
    mockGetUserPlan.mockResolvedValue(null)
    mockGetUserPlanByCustomerId.mockResolvedValue(null)
    mockUpdatePlan.mockResolvedValue(undefined)
    mockSendPlusConfirmationEmail.mockResolvedValue(undefined)
  })

  it('does not double-process the same event', async () => {
    const { buildApp } = await import('../plane-a/src/app')
    const app = await buildApp()
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          metadata: { user_id: '00000000-0000-0000-0000-000000000001' },
        },
      },
    })

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    })

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload,
    })

    expect(first.statusCode).toBe(200)
    expect(first.json()).toEqual({ received: true })
    expect(mockInsertEvent).toHaveBeenCalledTimes(1)
    expect(mockUpdatePlan).toHaveBeenCalledTimes(1)
    expect(mockMarkAsProcessed).toHaveBeenCalledWith('evt_test_1')

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload,
    })

    expect(second.statusCode).toBe(200)
    expect(second.json()).toEqual({ received: true, duplicate: true })
    expect(mockInsertEvent).toHaveBeenCalledTimes(2)
    expect(mockUpdatePlan).toHaveBeenCalledTimes(1)
  })

  it('preserves the stored enterprise tier when a subscription is deleted', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    mockGetUserPlanByCustomerId.mockResolvedValueOnce({
      user_id: 'user-enterprise',
    })
    mockGetUserPlan.mockResolvedValueOnce({
      user_id: 'user-enterprise',
      plan_code: 'enterprise',
      status: 'active',
      stripe_customer_id: 'cus_enterprise',
      stripe_subscription_id: 'sub_enterprise',
      version: 2,
    })

    const result = await processStripeEvent({
      event: {
        id: 'evt_deleted_enterprise',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_enterprise',
            customer: 'cus_enterprise',
          },
        },
      } as any,
      stripe: {} as Stripe,
      planeAPool: {} as any,
      userPlanRepo: {
        getUserPlan: mockGetUserPlan,
        getUserPlanByCustomerId: mockGetUserPlanByCustomerId,
        updatePlan: mockUpdatePlan,
      } as any,
    })

    expect(result).toEqual({
      userId: 'user-enterprise',
      processingSucceeded: true,
    })
    expect(mockUpdatePlan).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-enterprise',
      plan_code: 'enterprise',
      status: 'canceled',
      stripe_subscription_id: null,
      current_period_end: null,
      expected_version: 2,
    }))
  })

  it('preserves the stored plus tier for inactive subscription updates', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    mockGetUserPlanByCustomerId.mockResolvedValueOnce({
      user_id: 'user-plus',
    })
    mockGetUserPlan.mockResolvedValueOnce({
      user_id: 'user-plus',
      plan_code: 'plus',
      status: 'active',
      stripe_customer_id: 'cus_plus',
      stripe_subscription_id: 'sub_plus',
      version: 4,
    })

    const result = await processStripeEvent({
      event: {
        id: 'evt_updated_plus_unpaid',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_plus',
            customer: 'cus_plus',
            status: 'unpaid',
            current_period_end: 1775001600,
          },
        },
      } as any,
      stripe: {} as Stripe,
      planeAPool: {} as any,
      userPlanRepo: {
        getUserPlan: mockGetUserPlan,
        getUserPlanByCustomerId: mockGetUserPlanByCustomerId,
        updatePlan: mockUpdatePlan,
      } as any,
    })

    expect(result).toEqual({
      userId: 'user-plus',
      processingSucceeded: true,
    })
    expect(mockUpdatePlan).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-plus',
      plan_code: 'plus',
      status: 'unpaid',
      stripe_subscription_id: 'sub_plus',
      current_period_end: '2026-04-01T00:00:00.000Z',
      expected_version: 4,
    }))
  })
})
