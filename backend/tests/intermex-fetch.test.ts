import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchIntermexQuote } from '../plane-b/src/providers/intermex/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchIntermexQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds Intermex feesrates request', async () => {
    const request: CollectorRequest = {
      provider_id: 'intermex',
      corridor_id: 'US-MX-USD-MXN',
      amount_bucket: 900,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 900,
      locale: 'en-US',
    }

    const responsePayload = {
      rate: 17.5,
      origAmount: 900,
    }

    vi.mocked(httpRequest).mockResolvedValueOnce({
      status: 200,
      bodyText: JSON.stringify(responsePayload),
      json: responsePayload,
    })

    const result = await fetchIntermexQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual(responsePayload)
    expect(httpRequest).toHaveBeenCalledTimes(1)

    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options?.url).toBe(
      'https://api.imxi.com/pricing/api/v3/feesrates?DestCountryAbbr=MX&DestCurrency=MXN&OriCountryAbbr=USA&OriStateAbbr=PA&StyleId=3&TranTypeId=3&DeliveryType=W&OriCurrency=USD&ChannelId=1&OriAmount=900&DestAmount=0&SenderPaymentMethodId=3',
    )
    expect(options?.headers).toMatchObject({
      accept: 'application/json, text/plain, */*',
      channelid: '1',
      languageid: '1',
      partnerid: '1',
      'ocp-apim-subscription-key': '2162a586e2164623a1cd9b6b2d300b4c',
      origin: 'https://www.intermexonline.com',
      referer: 'https://www.intermexonline.com/',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    })
  })
})
