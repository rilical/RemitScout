import { describe, expect, it, vi } from 'vitest'

const loadModule = async (mockEnabled: boolean) => {
  vi.resetModules()
  vi.doMock('../shared/config', () => ({
    config: {
      billing: {
        stripe: {
          mockEnabled,
          secretKey: 'sk_test',
        },
      },
    },
  }))
  return await import('../plane-a/src/services/stripe-client')
}

describe('stripe-client', () => {
  it('returns mock client when enabled', async () => {
    const mockCreate = vi.fn().mockReturnValue({ mock: true })
    vi.doMock('../plane-a/src/services/stripe-mock', () => ({
      createMockStripeClient: () => mockCreate(),
    }))

    const { getStripeClient } = await loadModule(true)
    const client = getStripeClient()

    expect(mockCreate).toHaveBeenCalled()
    expect(client).toEqual({ mock: true })
  })

  it('returns real Stripe client when mock disabled', async () => {
    const StripeMock = vi.fn().mockImplementation(() => ({ live: true }))
    vi.doMock('stripe', () => ({ default: StripeMock }))

    const { getStripeClient } = await loadModule(false)
    const client = getStripeClient()

    expect(StripeMock).toHaveBeenCalledWith('sk_test', { apiVersion: '2025-12-15.clover' })
    expect(client).toEqual({ live: true })
  })
})
