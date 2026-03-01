import { describe, expect, it } from 'vitest'

import { buildB2bEffectiveRateSql, resolveB2bEffectiveRate } from '../shared/quote-rate'

describe('resolveB2bEffectiveRate', () => {
  it('prefers base rate when present', () => {
    const rate = resolveB2bEffectiveRate({
      baseRate: 19.4,
      sendAmount: 100,
      receiveAmount: 2500,
      impliedFxRate: 25,
    })

    expect(rate).toBe(19.4)
  })

  it('falls back to derived rate when base rate is missing', () => {
    const rate = resolveB2bEffectiveRate({
      baseRate: null,
      sendAmount: 100,
      receiveAmount: 2300,
      impliedFxRate: 25,
    })

    expect(rate).toBe(23)
  })

  it('uses implied rate only as a final fallback', () => {
    const rate = resolveB2bEffectiveRate({
      baseRate: null,
      sendAmount: null,
      receiveAmount: null,
      impliedFxRate: 18.5,
    })

    expect(rate).toBe(18.5)
  })
})

describe('buildB2bEffectiveRateSql', () => {
  it('builds expression using base -> derived -> implied fallback chain', () => {
    const sql = buildB2bEffectiveRateSql('qr')

    expect(sql).toContain('NULLIF(qr.base_rate::double precision, 0)')
    expect(sql).toContain('qr.receive_amount::double precision / qr.send_amount::double precision')
    expect(sql).toContain('NULLIF(qr.implied_fx_rate::double precision, 0)')
  })
})
