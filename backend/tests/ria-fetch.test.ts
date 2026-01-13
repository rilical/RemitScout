import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchRiaQuote } from '../plane-b/src/providers/ria/fetch'

describe('fetchRiaQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a Ria quote request for a corridor', async () => {
    const request: CollectorRequest = {
      provider_id: 'ria',
      corridor_id: 'US-MX-USD-MXN',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 1000,
      locale: 'en-US',
    }

    vi.mocked(httpRequest).mockResolvedValue({
      status: 200,
      bodyText: '{"ok":true}',
      json: { ok: true },
    })

    const result = await fetchRiaQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual({ ok: true })

    expect(httpRequest).toHaveBeenCalledTimes(1)
    const [options] = vi.mocked(httpRequest).mock.calls[0] ?? []
    expect(options).toBeDefined()
    if (!options) return

    expect(options.url).toBe('https://public.riamoneytransfer.com/MoneyTransferCalculator/Calculate')
    expect(options.method).toBe('POST')
    expect(options.body).toEqual({
      selections: {
        countryFrom: 'US',
        countryTo: 'MX',
        currencyFrom: 'USD',
        currencyTo: 'MXN',
        amountFrom: 1000,
        paymentMethod: 'DebitCard',
        deliveryMethod: 'BankDeposit',
        promoId: 0,
        shouldCalcAmountFrom: false,
        shouldCalcVariableRates: true,
        locale: 'en-us',
      },
    })
    expect(options.headers).toMatchObject({
      origin: 'https://www.riamoneytransfer.com',
      referer: 'https://www.riamoneytransfer.com/',
      accept: '*/*',
      'content-type': 'application/json',
      'client-type': 'PublicSite',
      culturecode: 'en-US',
      appversion: '4.0',
    })
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'ria',
      corridor_id: 'US-MX-USD',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchRiaQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
