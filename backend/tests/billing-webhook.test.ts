import { describe, it, expect } from 'vitest'
import Stripe from 'stripe'
import { buildApp } from '../plane-a/src/app'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const shouldRun = Boolean(webhookSecret && process.env.DATABASE_URL_PLANE_A)

describe('billing webhook idempotency', () => {
  if (!shouldRun || !webhookSecret) {
    it.skip('STRIPE_WEBHOOK_SECRET and DATABASE_URL_PLANE_A required', () => {})
    return
  }

  it('does not double-process the same event', async () => {
    const app = buildApp()
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1', metadata: { user_id: '00000000-0000-0000-0000-000000000001' } } },
    })

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    })

    const first = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload,
    })

    expect(first.statusCode).toBe(200)

    const second = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload,
    })

    expect(second.statusCode).toBe(200)
    const body = second.json()
    expect(body.duplicate).toBe(true)
  })
})
