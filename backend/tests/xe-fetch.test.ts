import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchXeQuote } from '../plane-b/src/providers/xe/fetch'

describe('fetchXeQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds an XE quote request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'xe',
      corridor_id: 'US-IN-USD-INR',
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

    const result = await fetchXeQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    expect(options.url).toBe('https://launchpad-api.xe.com/v2/quotes')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({
      sellCcy: 'USD',
      buyCcy: 'INR',
      userCountry: 'US',
      amount: 100,
      fixedCcy: 'USD',
      countryTo: 'IN',
    })
    expect(options.headers).toMatchObject({
      origin: 'https://www.xe.com',
      referer: 'https://www.xe.com/',
      accept: '*/*',
      'content-type': 'application/json',
    })

    const headers = options.headers ?? {}
    expect(headers['x-correlation-id']).toMatch(/^XECOM-/)
    expect(headers.deviceid).toBeTruthy()
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'xe',
      corridor_id: 'US-IN-USD',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchXeQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
