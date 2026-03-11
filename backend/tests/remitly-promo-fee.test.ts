import { describe, expect, it } from 'vitest'

import type { CollectorRequest } from '../plane-b/src/collectors/types'
import { parseRemitlyPayload } from '../plane-b/src/providers/remitly/parse'

const request: CollectorRequest = {
  provider_id: 'remitly',
  corridor_id: 'US-AL-USD-ALL',
  amount_bucket: 100,
  payin_method: 'debit_card',
  payout_method: 'bank_deposit',
  send_amount: 100,
  locale: 'en-US',
}

describe('parseRemitlyPayload promo fee handling', () => {
  it('stores the effective promotional fee instead of the raw fee discount amount', () => {
    const parsed = parseRemitlyPayload({
      estimate: {
        conduit: {
          source_currency: { alpha3: 'USD' },
        },
        exchange_rate: {
          promotional_exchange_rate: '84.00',
          base_rate: '82.76',
          capped_promotional_exchange_rate_amount: '500.00',
        },
        fee: { total_fee_amount: '1.99' },
        discount: { fee_discount_amount: '1.99' },
        pay_in_method: 'DEBIT',
        pay_out_method: '',
        receive_amount: '8400.00',
        send_amount: '100.00',
        total_charge_amount: '100.00',
      },
    }, request)

    expect(parsed).not.toBeNull()
    expect(parsed?.fee_amount).toBe(1.99)
    expect(parsed?.promotional_fee_amount).toBe(0)
    expect(parsed?.promotional_rate).toBe(84)
    expect(parsed?.base_rate).toBe(82.76)
  })
})
