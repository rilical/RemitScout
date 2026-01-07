import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchWiseQuote } from '../plane-b/src/providers/wise/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchWiseQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a Wise quote request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'wise',
      corridor_id: 'US-PH-USD-PHP',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: '{"ok":true}',
      json: { ok: true },
    })

    const result = await fetchWiseQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    expect(options.url).toBe('https://wise.com/gateway/v3/quotes')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({
      sourceCurrency: 'USD',
      targetCurrency: 'PHP',
      sourceAmount: 100,
      profile: 'personal',
      targetAmount: null,
      rateType: 'FIXED',
      sourceCountry: 'US',
      targetCountry: 'PH',
    })
    expect(options.headers).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://wise.com',
      referer: 'https://wise.com/',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    })
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'wise',
      corridor_id: 'US-PH-USD',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchWiseQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
