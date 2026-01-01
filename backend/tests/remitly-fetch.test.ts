import { URL } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchRemitlyQuote } from '../plane-b/src/providers/remitly/fetch'

describe('fetchRemitlyQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a remitly estimate request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD-MXN',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: '{"ok":true}',
      json: { ok: true },
    })

    const result = await fetchRemitlyQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    const url = new URL(options.url)
    expect(`${url.origin}${url.pathname}`).toBe('https://api.remitly.io/v3/calculator/estimate')
    expect(url.searchParams.get('conduit')).toBe('USA:USD-MEX:MXN')
    expect(url.searchParams.get('anchor')).toBe('SEND')
    expect(url.searchParams.get('amount')).toBe('100')
    expect(url.searchParams.get('purpose')).toBe('OTHER')
    expect(url.searchParams.get('customer_segment')).toBe('UNRECOGNIZED')
    expect(url.searchParams.get('strict_promo')).toBe('false')

    expect(options.headers).toMatchObject({
      accept: 'application/json',
      origin: 'https://www.remitly.com',
      referer: 'https://www.remitly.com/',
      'accept-language': 'en',
      'user-agent': 'RemitScoutCollector/1.0',
    })
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'remitly',
      corridor_id: 'US-MX-USD',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchRemitlyQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
