import { describe, expect, it } from 'vitest'

describe('gold indices SQL rights-matrix regression', () => {
  it('enforces rights country sets in batch and live aggregate queries', async () => {
    const { goldIndicesSql } = await import('../scripts/gold-indices-job')
    const { goldIndicesLiveSql } = await import('../scripts/gold-indices-live')

    const queries = [
      goldIndicesSql.indicesUpsertQuery,
      goldIndicesLiveSql.buildIndicesQuery(),
    ]

    for (const sql of queries) {
      expect(sql).toContain('rm.source_countries')
      expect(sql).toContain('rm.destination_countries')
      expect(sql).toContain("split_part(qr.corridor_id, '-', 1)")
      expect(sql).toContain("split_part(qr.corridor_id, '-', 2)")
      expect(sql).toContain('pcc.is_supported = true')
    }
  })
})
