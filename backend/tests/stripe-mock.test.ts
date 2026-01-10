import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loadModule = async (frontendBaseUrl = 'http://localhost:3000') => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      billing: {
        stripe: {
          frontendBaseUrl,
        },
      },
    },
  }))
  return await import('../plane-a/src/services/stripe-mock')
}

describe('stripe-mock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unmock('../shared/config')
  })

  it('creates checkout session with replaced success url', async () => {
    const { createMockStripeClient } = await loadModule('http://example.com')
    const client = createMockStripeClient()

    const session = await client.checkout.sessions.create({
      customer: 'cus_123',
      success_url: 'http://example.com/plus/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://example.com/plus/failed',
    })

    expect(session.id).toMatch(/^cs_/)
    expect(session.url).toContain(`session_id=${session.id}`)
    expect(session.success_url).toContain(session.id)

    const retrieved = await client.checkout.sessions.retrieve(session.id)
    expect(retrieved.id).toBe(session.id)
    expect(retrieved.status).toBe('complete')
  })

  it('builds billing portal url with return url', async () => {
    const { createMockStripeClient } = await loadModule('http://example.com')
    const client = createMockStripeClient()

    const portal = await client.billingPortal.sessions.create({
      return_url: 'http://example.com/dashboard',
    })

    expect(portal.url).toContain('mock-stripe/portal')
    expect(portal.url).toContain(encodeURIComponent('http://example.com/dashboard'))
  })

  it('returns subscription data for customer', async () => {
    const { createMockStripeClient } = await loadModule('http://example.com')
    const client = createMockStripeClient()

    const list = await client.subscriptions.list({ customer: 'cus_789' })
    expect(list.data).toHaveLength(1)

    const subscription = await client.subscriptions.retrieve(list.data[0].id)
    expect(subscription.status).toBe('active')
    expect(subscription.items.data[0].price.unit_amount).toBe(999)
  })

  it('parses webhook payloads or returns unknown', async () => {
    const { createMockStripeClient } = await loadModule()
    const client = createMockStripeClient()

    const parsed = client.webhooks.constructEvent(JSON.stringify({ type: 'checkout.session.completed' }))
    expect(parsed.type).toBe('checkout.session.completed')

    const unknown = client.webhooks.constructEvent('{not-json}')
    expect(unknown.type).toBe('unknown')
  })
})
