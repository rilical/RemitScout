import { describe, expect, it } from 'vitest'

import {
  buildRightsMatrixCorridorEligibilitySql,
  isRightsMatrixCorridorEligible,
} from '../shared/rights-matrix-corridor'

describe('rights matrix corridor eligibility', () => {
  it('rejects corridors outside the authoritative rights country sets', () => {
    expect(
      isRightsMatrixCorridorEligible('US-MX-USD-MXN', {
        sourceCountries: ['CA'],
        destinationCountries: ['MX'],
      }),
    ).toBe(false)

    expect(
      isRightsMatrixCorridorEligible('US-MX-USD-MXN', {
        sourceCountries: ['US'],
        destinationCountries: ['PH'],
      }),
    ).toBe(false)
  })

  it('treats null or empty country sets as no match', () => {
    expect(
      isRightsMatrixCorridorEligible('US-MX-USD-MXN', {
        sourceCountries: [],
        destinationCountries: ['MX'],
      }),
    ).toBe(false)

    expect(
      isRightsMatrixCorridorEligible('US-MX-USD-MXN', {
        sourceCountries: ['US'],
        destinationCountries: null,
      }),
    ).toBe(false)
  })

  it('builds a SQL predicate that checks both source and destination country sets', () => {
    const sql = buildRightsMatrixCorridorEligibilitySql({
      rightsAlias: 'rm',
      corridorIdSql: 'qr.corridor_id',
    })

    expect(sql).toContain('rm.source_countries')
    expect(sql).toContain('rm.destination_countries')
    expect(sql).toContain("split_part(qr.corridor_id, '-', 1)")
    expect(sql).toContain("split_part(qr.corridor_id, '-', 2)")
  })
})
