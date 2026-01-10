import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockList = vi.fn()
const mockCancel = vi.fn()
const mockDel = vi.fn()

vi.mock('../plane-a/src/services/stripe-client', () => ({
  getStripeClient: () => ({
    subscriptions: {
      list: (...args: any[]) => mockList(...args),
      cancel: (...args: any[]) => mockCancel(...args),
    },
    customers: {
      del: (...args: any[]) => mockDel(...args),
    },
  }),
}))

describe('stripe-admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cancels active subscriptions before deleting customer', async () => {
    mockList.mockResolvedValue({
      data: [
        { id: 'sub_active', status: 'active' },
        { id: 'sub_canceled', status: 'canceled' },
      ],
    })

    const { deleteStripeCustomer } = await import('../plane-a/src/services/stripe-admin')
    await deleteStripeCustomer('cus_123')

    expect(mockCancel).toHaveBeenCalledWith('sub_active')
    expect(mockCancel).not.toHaveBeenCalledWith('sub_canceled')
    expect(mockDel).toHaveBeenCalledWith('cus_123')
  })

  it('still deletes customer if subscription listing fails', async () => {
    mockList.mockRejectedValue(new Error('boom'))

    const { deleteStripeCustomer } = await import('../plane-a/src/services/stripe-admin')
    await deleteStripeCustomer('cus_456')

    expect(mockDel).toHaveBeenCalledWith('cus_456')
  })
})
