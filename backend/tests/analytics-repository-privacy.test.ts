import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { AnalyticsRepository } from '../plane-a/src/repositories/implementations/analytics-repository'
import * as dbModule from '../shared/db'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('AnalyticsRepository privacy controls', () => {
  let repository: AnalyticsRepository
  let pool: Pool

  beforeEach(() => {
    vi.clearAllMocks()
    pool = {} as Pool
    repository = new AnalyticsRepository(pool)
  })

  it('groups low-volume corridors into a regional aggregate', async () => {
    vi.mocked(dbModule.query)
      .mockResolvedValueOnce({
        rows: [
          {
            corridor_id: 'US-MX',
            from_country: 'US',
            to_country: 'MX',
            search_count: 220,
            click_count: 120,
            unique_users: 42,
          },
          {
            corridor_id: 'GB-PK',
            from_country: 'GB',
            to_country: 'PK',
            search_count: 10,
            click_count: 2,
            unique_users: 3,
          },
        ],
        rowCount: 2,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          { corridor_id: 'US-MX', search_count: 200 },
          { corridor_id: 'GB-PK', search_count: 9 },
        ],
        rowCount: 2,
      } as any)

    const rows = await repository.getPopularCorridors({
      startDate: new Date('2026-02-01T00:00:00.000Z'),
      endDate: new Date('2026-02-02T00:00:00.000Z'),
      limit: 10,
    })

    expect(rows).toHaveLength(2)
    expect(rows.find(row => row.corridor_id === 'US-MX')).toMatchObject({
      suppressed: false,
      privacy: { applied: true },
    })
    expect(rows.find(row => row.corridor_id === 'REGIONAL-AGGREGATE')).toMatchObject({
      suppressionReason: 'low_volume_grouped',
      aggregationBasis: 'regional_aggregate',
      suppressed: false,
    })
  })
})

