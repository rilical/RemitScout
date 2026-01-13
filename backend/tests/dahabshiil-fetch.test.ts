import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchDahabshiilQuote } from '../plane-b/src/providers/dahabshiil/fetch'

describe('fetchDahabshiilQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a Dahabshiil quote request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'dahabshiil',
      corridor_id: 'US-KE-USD-USD',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'cash_pickup',
      send_amount: 100,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: '{"ok":true}',
      json: { ok: true },
    })

    const result = await fetchDahabshiilQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    const params = new URLSearchParams({
      source_country_code: 'US',
      destination_country_iso2: 'KE',
      amount_type: 'SOURCE',
      amount: '100.00',
      destination_currency: 'USD',
      type: 'Cash Collection',
    })

    expect(options.url).toBe(
      `https://apigw-us.dahabshiil.com/remit/transaction/get-charges-anonymous?${params.toString()}`,
    )
    expect(options.method).toBe('GET')
    expect(options.headers).toMatchObject({
      origin: 'https://www.dahabshiil.com',
      referer: 'https://www.dahabshiil.com/',
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US',
    })
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'dahabshiil',
      corridor_id: 'US-KE-USD',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'cash_pickup',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchDahabshiilQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
