import { describe, expect, it, vi } from 'vitest'

const loadModule = async (secretKey?: string) => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      billing: {
        stripe: {
          secretKey: secretKey ?? '',
        },
      },
    },
  }))
  return await import('../plane-a/src/services/stripe-client')
}

describe('stripe-client', () => {
  it('returns Stripe client when configured', async () => {
    const StripeMock = vi.fn().mockImplementation(() => ({ live: true }))
    vi.doMock('stripe', () => ({ default: StripeMock }))

    const { getStripeClient } = await loadModule('sk_test')
    const client = getStripeClient()

    expect(StripeMock).toHaveBeenCalledWith('sk_test', { apiVersion: '2025-12-15.clover' })
    expect(client).toEqual({ live: true })
  })

  it('throws when secret key missing', async () => {
    const { getStripeClient } = await loadModule('')
    expect(() => getStripeClient()).toThrow('Stripe secret key missing')
  })
})
