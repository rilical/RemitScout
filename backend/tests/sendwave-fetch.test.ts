import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchSendwaveQuote } from '../plane-b/src/providers/sendwave/fetch'

describe('fetchSendwaveQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds Sendwave pricing requests for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'sendwave',
      corridor_id: 'FR-PH-EUR-PHP',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'mobile_wallet',
      send_amount: 100,
      locale: 'en-US',
    }

    vi.mocked(httpRequest)
      .mockResolvedValueOnce({
        status: 200,
        bodyText: '{"ok":true}',
        json: {
          payoutMethodsAndPrices: [
            {
              payoutMethod: 'bank',
              bestPricedSegmentName: 'ph_bank',
              segments: [{ segmentName: 'ph_bank' }],
            },
            {
              payoutMethod: 'mobile',
              bestPricedSegmentName: 'ph_gcash',
              segments: [{ segmentName: 'ph_gcash' }],
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        bodyText: '{"ok":true}',
        json: {
          effectiveExchangeRate: '68.62',
          baseExchangeRate: '67.69',
          effectiveFeeAmount: '0.00',
          payAmount: '100.00',
          effectiveSendAmount: '100.00',
          receiveAmount: '6862',
        },
      })

    const result = await fetchSendwaveQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual(
      expect.objectContaining({
        segmentName: 'ph_gcash',
        payoutMethod: 'mobile_wallet',
      }),
    )

    expect(httpRequest).toHaveBeenCalledTimes(2)

    const [segmentRequest] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(segmentRequest).toBeDefined()
    if (segmentRequest) {
      const params = new URLSearchParams({
        sendCountryIso2: 'fr',
        sendCurrency: 'EUR',
        receiveCountryIso2: 'ph',
        receiveCurrency: 'PHP',
      })

      expect(segmentRequest.url).toBe(
        `https://app.sendwave.com/v2/pricing-segments?${params.toString()}`,
      )
      expect(segmentRequest.method).toBe('GET')
      expect(segmentRequest.headers).toMatchObject({
        origin: 'https://www.sendwave.com',
        referer: 'https://www.sendwave.com/',
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US',
      })
    }

    const [pricingRequest] = vi.mocked(httpRequest).mock.calls[1] ?? []
    expect(pricingRequest).toBeDefined()
    if (pricingRequest) {
      const params = new URLSearchParams({
        amountType: 'SEND',
        receiveCurrency: 'PHP',
        segmentName: 'ph_gcash',
        amount: '100.00',
        sendCurrency: 'EUR',
        sendCountryIso2: 'fr',
        receiveCountryIso2: 'ph',
      })

      expect(pricingRequest.url).toBe(
        `https://app.sendwave.com/v2/pricing-public?${params.toString()}`,
      )
      expect(pricingRequest.method).toBe('GET')
      expect(pricingRequest.headers).toMatchObject({
        origin: 'https://www.sendwave.com',
        referer: 'https://www.sendwave.com/',
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US',
      })
    }
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'sendwave',
      corridor_id: 'FR-PH-EUR',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchSendwaveQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
