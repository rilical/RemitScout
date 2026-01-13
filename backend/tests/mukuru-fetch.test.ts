import { describe, expect, it, vi } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'

vi.mock('undici', () => ({
  fetch: vi.fn(),
  ProxyAgent: class {},
}))

import { fetch as undiciFetch } from 'undici'
import { fetchMukuruQuote } from '../plane-b/src/providers/mukuru/fetch'

const mockResponse = (body: string, setCookies: string[] = []) => ({
  status: 200,
  text: vi.fn().mockResolvedValue(body),
  headers: {
    getSetCookie: () => setCookies,
    get: vi.fn().mockReturnValue(null),
  },
})

describe('fetchMukuruQuote', () => {
  it('builds pricecheck/products/calculate requests and carries cookies', async () => {
    const request: CollectorRequest = {
      provider_id: 'mukuru',
      corridor_id: 'ZA-ZW-ZAR-ZAR',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'cash_pickup',
      send_amount: 100,
      locale: 'en-US',
    }

    const pageHtml = [
      '<input type="hidden" name="csrf_pricing" value="csrf-token">',
      '<input type="hidden" name="from_currency_iso" value="ZAR">',
    ].join('')

    vi.mocked(undiciFetch)
      .mockResolvedValueOnce(mockResponse(pageHtml, ['mukurusession=abc123; Path=/']))
      .mockResolvedValueOnce(mockResponse(JSON.stringify({
        status: 'success',
        data: [
          { id: 31, title: 'Cash ZAR', iso: 'ZAR', is_send_calculator: true, show_fee: 1 },
        ],
      })))
      .mockResolvedValueOnce(mockResponse(JSON.stringify({
        status: 'success',
        data: {
          payin_amount: 100,
          payout_amount: 100,
          rate_message: 'Rate R1:R1',
          charge_message: '',
        },
      })))

    const result = await fetchMukuruQuote(request)

    expect(result.status).toBe(200)
    expect(result.payload).toEqual(
      expect.objectContaining({
        selectedProduct: expect.objectContaining({ id: 31, iso: 'ZAR' }),
        payoutMethod: 'cash_pickup',
      }),
    )

    expect(undiciFetch).toHaveBeenCalledTimes(3)
    const productsCall = vi.mocked(undiciFetch).mock.calls[1]
    const productsOptions = productsCall?.[1] as { headers?: Record<string, string> }
    expect(productsOptions?.headers?.cookie).toContain('mukurusession=abc123')

    const calculateUrl = vi.mocked(undiciFetch).mock.calls[2]?.[0] as string
    expect(calculateUrl).toContain('csrf_pricing=csrf-token')
    expect(calculateUrl).toContain('from_currency_iso=ZAR')
    expect(calculateUrl).toContain('currency_id=31')
  })

  it('returns 422 when no products match corridor currency', async () => {
    const request: CollectorRequest = {
      provider_id: 'mukuru',
      corridor_id: 'ZA-ZW-ZAR-ZAR',
      amount_bucket: 100,
      payin_method: 'bank_transfer',
      payout_method: 'cash_pickup',
      send_amount: 100,
      locale: 'en-US',
    }

    const pageHtml = [
      '<input type="hidden" name="csrf_pricing" value="csrf-token">',
      '<input type="hidden" name="from_currency_iso" value="ZAR">',
    ].join('')

    vi.mocked(undiciFetch)
      .mockResolvedValueOnce(mockResponse(pageHtml, ['mukurusession=abc123; Path=/']))
      .mockResolvedValueOnce(mockResponse(JSON.stringify({
        status: 'success',
        data: [],
      })))

    const result = await fetchMukuruQuote(request)

    expect(result.status).toBe(422)
    expect(result.payload).toEqual(
      expect.objectContaining({
        products: [],
        selectedProduct: null,
      }),
    )
  })
})
