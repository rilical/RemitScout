import { describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchRemitbeeQuote } from '../plane-b/src/providers/remitbee/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchRemitbeeQuote', () => {
  it('builds a remitbee request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'remitbee',
      corridor_id: 'CA-IN-CAD-INR',
      amount_bucket: 900,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 900,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: '{"ok":true}',
      json: { ok: true },
    })

    const result = await fetchRemitbeeQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    expect(options.url).toBe('https://api.remitbee.com/public-services/compressed/calculate-money-transfer')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({
      transfer_amount: '900.00',
      country_id: 103,
      currency_code: 'INR',
      include_timeline: true,
      is_special_rate: true,
    })
    expect(options.headers).toMatchObject({
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      origin: 'https://www.remitbee.com',
      referer: 'https://www.remitbee.com/',
      'accept-language': 'en-US',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
    })
  })

  it('rejects non-CA source corridors', async () => {
    const request: CollectorRequest = {
      provider_id: 'remitbee',
      corridor_id: 'US-IN-USD-INR',
      amount_bucket: 900,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 900,
      locale: 'en-US',
    }

    await expect(fetchRemitbeeQuote(request)).rejects.toThrow('remitbee only supports CA/CAD')
  })
})
