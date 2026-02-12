import { describe, it, expect } from 'vitest'
import Stripe from 'stripe'
import { buildApp } from '../plane-a/src/app'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret'

describe('billing webhook idempotency', () => {
  it('does not double-process the same event', async () => {
    const app = await buildApp()
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
      url: '/api/v1/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': signature,
      },
      payload,
    })

    expect(first.statusCode).toBe(200)

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
    const body = second.json()
    expect(body.duplicate).toBe(true)
  })
})
