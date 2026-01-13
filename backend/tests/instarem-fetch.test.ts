import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchInstaremQuote } from '../plane-b/src/providers/instarem/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchInstaremQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds Instarem payment method and quote requests', async () => {
    const request: CollectorRequest = {
      provider_id: 'instarem',
      corridor_id: 'SG-IN-SGD-INR',
      amount_bucket: 1000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 1000,
      locale: 'en-US',
    }

    const methodsPayload = {
      success: true,
      data: [
        { key: 85, text: 'Bank Transfer', code: 'DBS_INWARD_SGD_SG' },
        { key: 157, text: 'Debit Card', code: 'STRIPE_SG_DEBIT' },
      ],
    }
    const quotePayload = {
      success: true,
      data: {
        destination_amount: 70002,
        instarem_fx_rate: 70.002,
      },
    }

    vi.mocked(httpRequest)
      .mockResolvedValueOnce({
        status: 200,
        bodyText: JSON.stringify(methodsPayload),
        json: methodsPayload,
      })
      .mockResolvedValueOnce({
        status: 200,
        bodyText: JSON.stringify(quotePayload),
        json: quotePayload,
      })

    const result = await fetchInstaremQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toMatchObject({
      payment_methods: methodsPayload.data,
      selected_payment_method: methodsPayload.data[0],
      quote: quotePayload.data,
    })

    expect(httpRequest).toHaveBeenCalledTimes(2)
    const [paymentOptions] = vi.mocked(httpRequest).mock.calls[0] ?? []
    const [quoteOptions] = vi.mocked(httpRequest).mock.calls[1] ?? []

    expect(paymentOptions?.url).toBe(
      'https://www.instarem.com/api/v1/public/payment-method/fee?source_currency=SGD&source_amount=1000&destination_currency=INR&country_code=SG',
    )
    expect(paymentOptions?.headers).toMatchObject({
      accept: 'application/json, text/plain, */*',
      origin: 'https://www.instarem.com',
      referer: 'https://www.instarem.com/',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    })

    expect(quoteOptions?.url).toBe(
      'https://www.instarem.com/api/v1/public/transaction/computed-value?source_currency=SGD&destination_currency=INR&instarem_bank_account_id=85&country_code=SG&source_amount=1000',
    )
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'instarem',
      corridor_id: 'SG-IN-SGD',
      amount_bucket: 1000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 1000,
      locale: 'en-US',
    }

    await expect(fetchInstaremQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
