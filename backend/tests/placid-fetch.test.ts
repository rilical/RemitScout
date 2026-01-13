import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchPlacidQuote } from '../plane-b/src/providers/placid/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

const fixturePath = path.join(
  process.cwd(),
  'plane-b',
  'src',
  'providers',
  'placid',
  'fixtures',
  'rates-fees.html',
)

const htmlFixture = readFileSync(fixturePath, 'utf8')

describe('fetchPlacidQuote', () => {
  it('builds a placid request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'placid',
      corridor_id: 'US-IN-USD-INR',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: htmlFixture,
      json: undefined,
    })

    const result = await fetchPlacidQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload.rates.length).toBe(11)
    expect(result.payload.fees.length).toBe(3)

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    expect(options.url).toBe('https://www.placid.net/rates-fees.php')
    expect(options.method).toBe('GET')
    expect(options.headers).toMatchObject({
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      referer: 'https://www.placid.net/',
    })
  })

  it('rejects non-USD source corridors', async () => {
    const request: CollectorRequest = {
      provider_id: 'placid',
      corridor_id: 'US-IN-EUR-INR',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchPlacidQuote(request)).rejects.toThrow('placid only supports USD')
  })

  it('rejects corridor currency mismatches', async () => {
    const request: CollectorRequest = {
      provider_id: 'placid',
      corridor_id: 'US-IN-USD-USD',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchPlacidQuote(request)).rejects.toThrow('placid corridor currency mismatch')
  })
})
