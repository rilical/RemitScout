import { beforeEach, describe, expect, it, vi } from 'vitest'

const queryMock = vi.fn()

vi.mock('../shared/db', () => ({
  createPool: () => ({ end: async () => undefined }),
  query: queryMock,
}))

vi.mock('../shared/tracing', () => ({
  initTracing: () => undefined,
}))

describe('Gold indices SQL regression', () => {
  beforeEach(() => {
    queryMock.mockReset()
    queryMock.mockResolvedValue({ rows: [{ upserted: 1 }] })
  })

  it('builds parameterized upsert query and avoids template interpolation', async () => {
    const { upsertGoldIndices } = await import('../scripts/gold-indices-job')

    const upserted = await upsertGoldIndices({} as never, {
      amountBucket: 500,
      lookbackDays: 7,
      corridorIds: ['US-MX-USD-MXN'],
    })

    expect(upserted).toBe(1)
    expect(queryMock).toHaveBeenCalledTimes(1)

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]

    expect(typeof sql).toBe('string')
    expect(sql).toContain('WITH weight_snapshot AS')
    expect(sql).toContain('AS prev_teer_rate')
    expect(sql).toContain('cw.method_profile = l.method_profile')
    expect(sql).toContain('gw.method_profile = l.method_profile')
    expect(sql).toContain('wmeta.method_profile = wv.method_profile')
    expect(sql).toMatch(/END\s*\)::method_profile AS method_profile/)
    expect(sql).toContain('abs(teer_rate - prev_teer_rate) / prev_teer_rate > $5')
    expect(sql).not.toContain('${')

    expect(Array.isArray(params)).toBe(true)
    expect(params).toHaveLength(10)
    expect(params[0]).toBe(500)
    expect(params[1]).toBe(7)
  })
})
