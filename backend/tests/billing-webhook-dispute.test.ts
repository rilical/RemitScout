import { beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

const mockSendChargebackAdminEmail = vi.fn().mockResolvedValue(true)
const mockSendPlusConfirmationEmail = vi.fn().mockResolvedValue(true)
const mockSendPaymentFailedEmail = vi.fn().mockResolvedValue(true)
const mockSendCancellationEmail = vi.fn().mockResolvedValue(true)
const mockSendCancellationScheduledEmail = vi.fn().mockResolvedValue(true)
const mockCaptureExceptionWithContext = vi.fn().mockResolvedValue(undefined)
const mockRecordBusinessMetric = vi.fn()

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/business-metrics', () => ({
  recordBusinessMetric: (...args: any[]) => mockRecordBusinessMetric(...args),
}))

vi.mock('../shared/error-tracker', () => ({
  captureExceptionWithContext: (...args: any[]) => mockCaptureExceptionWithContext(...args),
}))

vi.mock('../plane-a/src/services/billing-email', () => ({
  sendPlusConfirmationEmail: (...args: any[]) => mockSendPlusConfirmationEmail(...args),
  sendPaymentFailedEmail: (...args: any[]) => mockSendPaymentFailedEmail(...args),
  sendCancellationEmail: (...args: any[]) => mockSendCancellationEmail(...args),
  sendCancellationScheduledEmail: (...args: any[]) => mockSendCancellationScheduledEmail(...args),
  sendChargebackAdminEmail: (...args: any[]) => mockSendChargebackAdminEmail(...args),
}))

describe('processStripeEvent (charge.dispute.created)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps user_id from charge metadata and alerts admins', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    const stripe = {
      charges: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'ch_123',
          customer: 'cus_123',
          metadata: { user_id: 'user_123' },
        }),
      },
    } as unknown as Stripe

    const userPlanRepo = {
      getUserPlanByCustomerId: vi.fn().mockResolvedValue(null),
    } as any

    const event = {
      id: 'evt_1',
      type: 'charge.dispute.created',
      data: {
        object: {
          id: 'dp_1',
          charge: 'ch_123',
          reason: 'fraudulent',
          status: 'needs_response',
          amount: 1000,
          currency: 'usd',
        },
      },
    } as unknown as Stripe.Event

    const result = await processStripeEvent({
      event,
      stripe,
      planeAPool: {},
      userPlanRepo,
    })

    expect(result).toEqual({ userId: 'user_123', processingSucceeded: true })

    expect(mockRecordBusinessMetric).toHaveBeenCalledWith(
      'billing_disputes_total',
      1,
      { status: 'needs_response', reason: 'fraudulent' },
    )

    expect(mockSendChargebackAdminEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_123',
        disputeId: 'dp_1',
        chargeId: 'ch_123',
        customerId: 'cus_123',
        reason: 'fraudulent',
        status: 'needs_response',
        amount: 1000,
        currency: 'USD',
      }),
    )

    expect(mockCaptureExceptionWithContext).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        stripe_event_id: 'evt_1',
        stripe_event_type: 'charge.dispute.created',
        user_id: 'user_123',
      }),
      expect.objectContaining({ stripe_event_type: 'charge.dispute.created' }),
    )
  })

  it('alerts admins even when user_id cannot be resolved', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    const stripe = {
      charges: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'ch_999',
          customer: 'cus_999',
          metadata: {},
        }),
      },
    } as unknown as Stripe

    const userPlanRepo = {
      getUserPlanByCustomerId: vi.fn().mockResolvedValue(null),
    } as any

    const event = {
      id: 'evt_2',
      type: 'charge.dispute.created',
      data: {
        object: {
          id: 'dp_2',
          charge: 'ch_999',
          reason: 'general',
          status: 'warning_closed',
          amount: 2000,
          currency: 'eur',
        },
      },
    } as unknown as Stripe.Event

    const result = await processStripeEvent({
      event,
      stripe,
      planeAPool: {},
      userPlanRepo,
    })

    expect(result).toEqual({ userId: null, processingSucceeded: true })

    expect(mockSendChargebackAdminEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        disputeId: 'dp_2',
        chargeId: 'ch_999',
        customerId: 'cus_999',
        reason: 'general',
        status: 'warning_closed',
        amount: 2000,
        currency: 'EUR',
      }),
    )
  })
})

describe('processStripeEvent (invoice.payment_failed / subscription cancellation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends payment failed email on invoice.payment_failed', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    const stripe = {} as unknown as Stripe
    const userPlanRepo = {
      getUserPlan: vi.fn().mockResolvedValue({ plan_code: 'plus', status: 'active' }),
      updatePlan: vi.fn().mockResolvedValue(undefined),
      getUserPlanByCustomerId: vi.fn().mockResolvedValue(null),
    } as any

    const event = {
      id: 'evt_payfail',
      type: 'invoice.payment_failed',
      data: {
        object: {
          metadata: { user_id: 'user_1' },
          customer: 'cus_1',
        },
      },
    } as unknown as Stripe.Event

    const result = await processStripeEvent({
      event,
      stripe,
      planeAPool: {},
      userPlanRepo,
    })

    expect(result).toEqual({ userId: 'user_1', processingSucceeded: true })
    expect(mockSendPaymentFailedEmail).toHaveBeenCalledWith(expect.anything(), 'user_1', { planName: 'Remit-Scout Plus' })
  })

  it('sends cancellation email on customer.subscription.deleted', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    const stripe = {} as unknown as Stripe
    const userPlanRepo = {
      getUserPlan: vi.fn().mockResolvedValue({ plan_code: 'plus', status: 'active' }),
      updatePlan: vi.fn().mockResolvedValue(undefined),
      getUserPlanByCustomerId: vi.fn().mockResolvedValue(null),
    } as any

    const event = {
      id: 'evt_subdel',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          metadata: { user_id: 'user_2' },
          customer: 'cus_2',
        },
      },
    } as unknown as Stripe.Event

    const result = await processStripeEvent({
      event,
      stripe,
      planeAPool: {},
      userPlanRepo,
    })

    expect(result).toEqual({ userId: 'user_2', processingSucceeded: true })
    expect(mockSendCancellationEmail).toHaveBeenCalledWith(expect.anything(), 'user_2', { planName: 'Remit-Scout Plus' })
  })

  it('sends cancellation scheduled email on customer.subscription.updated cancel_at_period_end', async () => {
    const { processStripeEvent } = await import('../plane-a/src/routes/billing/webhook')

    const stripe = {} as unknown as Stripe
    const userPlanRepo = {
      getUserPlan: vi.fn().mockResolvedValue({ plan_code: 'plus', status: 'active' }),
      updatePlan: vi.fn().mockResolvedValue(undefined),
      getUserPlanByCustomerId: vi.fn().mockResolvedValue(null),
    } as any

    const event = {
      id: 'evt_subupd',
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: { user_id: 'user_3' },
          customer: 'cus_3',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
          cancel_at_period_end: true,
        },
      },
    } as unknown as Stripe.Event

    const result = await processStripeEvent({
      event,
      stripe,
      planeAPool: {},
      userPlanRepo,
    })

    expect(result).toEqual({ userId: 'user_3', processingSucceeded: true })
    expect(mockSendCancellationScheduledEmail).toHaveBeenCalledWith(
      expect.anything(),
      'user_3',
      expect.objectContaining({ planName: 'Remit-Scout Plus' }),
    )
  })
})
