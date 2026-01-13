import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('../plane-b/src/collectors/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { httpRequest } from '../plane-b/src/collectors/http-client'
import { fetchKoronaPayQuote } from '../plane-b/src/providers/koronapay/fetch'
import { getUserAgentForCorridor } from '../plane-b/src/collectors/user-agent'

describe('fetchKoronaPayQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds KoronaPay quote and tariff info requests', async () => {
    const request: CollectorRequest = {
      provider_id: 'koronapay',
      corridor_id: 'DE-TR-EUR-TRY',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    const tariffsPayload = [{ sendingAmount: 10000 }]
    const tariffInfoPayload = [{ paymentMethod: 'debitCard' }]

    vi.mocked(httpRequest)
      .mockResolvedValueOnce({
        status: 200,
        bodyText: JSON.stringify(tariffsPayload),
        json: tariffsPayload,
      })
      .mockResolvedValueOnce({
        status: 200,
        bodyText: JSON.stringify(tariffInfoPayload),
        json: tariffInfoPayload,
      })

    const result = await fetchKoronaPayQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toMatchObject({
      tariffs: tariffsPayload,
      tariffInfo: tariffInfoPayload,
    })

    expect(httpRequest).toHaveBeenCalledTimes(2)
    const [tariffsRequest] = vi.mocked(httpRequest).mock.calls[0] ?? []
    const [tariffInfoRequest] = vi.mocked(httpRequest).mock.calls[1] ?? []

    expect(tariffsRequest?.url).toBe(
      'https://koronapay.com/api/transfers/tariffs?sendingCountryId=DEU&receivingCountryId=TUR&sendingCurrencyId=978&receivingCurrencyId=949&sendingAmount=10000&paymentMethod=debitCard&receivingMethod=card&paidNotificationEnabled=false',
    )
    expect(tariffsRequest?.headers).toMatchObject({
      accept: 'application/vnd.cft-data.v2.152+json',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      referer: 'https://koronapay.com/transfers/europe/en/',
      'user-agent': getUserAgentForCorridor(request.corridor_id),
      'x-application': 'Qpay-Web/3.0',
    })

    expect(tariffInfoRequest?.url).toBe(
      'https://koronapay.com/api/transfers/tariffs/info?sendingCountryId=DEU&receivingCountryId=TUR&forTransferRepeat=false&paymentMethod=debitCard',
    )
  })

  it('rejects invalid corridor ids', async () => {
    const request: CollectorRequest = {
      provider_id: 'koronapay',
      corridor_id: 'BE-UZ-EUR',
      amount_bucket: 100,
      payin_method: 'debit_card',
      payout_method: 'bank_deposit',
      send_amount: 100,
      locale: 'en-US',
    }

    await expect(fetchKoronaPayQuote(request)).rejects.toThrow('invalid corridor_id')
    expect(httpRequest).not.toHaveBeenCalled()
  })
})
