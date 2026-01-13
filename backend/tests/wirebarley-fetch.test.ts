import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchWireBarleyQuote } from '../plane-b/src/providers/wirebarley/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchWireBarleyQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds WireBarley exrate request', async () => {
    const request: CollectorRequest = {
      provider_id: 'wirebarley',
      corridor_id: 'KR-PH-KRW-PHP',
      amount_bucket: 100000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 100000,
      locale: 'en-US',
    }

    const responsePayload = {
      data: { exRates: [] },
      status: 0,
    }

    vi.mocked(httpRequest).mockResolvedValueOnce({
      status: 200,
      bodyText: JSON.stringify(responsePayload),
      json: responsePayload,
    })

    const result = await fetchWireBarleyQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual(responsePayload)
    expect(httpRequest).toHaveBeenCalledTimes(1)

    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options?.url).toBe(
      'https://www.wirebarley.com/kr/remittance/api/v1/exrate/KR/KRW',
    )
    expect(options?.headers).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'device-type': 'WEB',
      'device-model': 'Chrome',
      'device-version': '143.0.0.0',
      lang: 'en',
      referer: 'https://www.wirebarley.com/',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    })
  })
})
