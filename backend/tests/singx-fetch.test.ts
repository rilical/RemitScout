import { describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchSingxQuote } from '../plane-b/src/providers/singx/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchSingxQuote', () => {
  it('builds a singx request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'singx',
      corridor_id: 'SG-IN-SGD-INR',
      amount_bucket: 1000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 1000,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: '{"ok":true}',
      json: { ok: true },
    })

    const result = await fetchSingxQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    expect(options.url).toBe('https://api.singx.co/central/landing/fx/SG/exchange')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({
      fromCurrency: 'SGD',
      toCurrency: 'INR',
      amount: '1000.00',
      type: 'Send',
      swift: false,
      cashPickup: false,
      wallet: false,
      business: false,
    })
    expect(options.headers).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://www.singx.co',
      referer: 'https://www.singx.co/',
      'accept-language': 'en-US',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    })
  })

  it('rejects unsupported source currencies', async () => {
    const request: CollectorRequest = {
      provider_id: 'singx',
      corridor_id: 'GB-IN-GBP-INR',
      amount_bucket: 1000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 1000,
      locale: 'en-US',
    }

    await expect(fetchSingxQuote(request)).rejects.toThrow('unsupported singx source currency')
  })

  it('rejects corridors with mismatched destination countries', async () => {
    const request: CollectorRequest = {
      provider_id: 'singx',
      corridor_id: 'SG-US-SGD-INR',
      amount_bucket: 1000,
      payin_method: 'bank_transfer',
      payout_method: 'bank_deposit',
      send_amount: 1000,
      locale: 'en-US',
    }

    await expect(fetchSingxQuote(request)).rejects.toThrow('singx corridor destination mismatch')
  })
})
