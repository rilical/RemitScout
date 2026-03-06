import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()

vi.mock('../shared/db', async () => {
  const actual = await vi.importActual<any>('../shared/db')
  return {
    ...actual,
    query: (...args: any[]) => mockQuery(...args),
  }
})

describe('institutional launch service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('computes accumulating maturity from the Gold export window', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          min_date: '2026-01-01',
          max_date: '2026-03-01',
          updated_at: new Date('2026-03-05T00:00:00.000Z'),
          row_count: 100,
        },
      ],
      rowCount: 1,
    })

    const { getInstitutionalDataMaturity } = await import('../plane-a/src/services/institutional-launch')
    const result = await getInstitutionalDataMaturity({} as any)

    expect(result).toEqual({
      ready: false,
      requiredDays: 180,
      availableDays: 60,
      reason: 'accumulating_history',
      updatedAt: '2026-03-05T00:00:00.000Z',
    })
  })

  it('reports no sellable history when Gold exports are empty', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          min_date: null,
          max_date: null,
          updated_at: null,
          row_count: 0,
        },
      ],
      rowCount: 1,
    })

    const { getInstitutionalDataMaturity } = await import('../plane-a/src/services/institutional-launch')
    const result = await getInstitutionalDataMaturity({} as any)

    expect(result).toEqual({
      ready: false,
      requiredDays: 180,
      availableDays: 0,
      reason: 'no_sellable_history',
      updatedAt: null,
    })
  })

  it('enforces the launch gate only in prod-like environments', async () => {
    const { toInstitutionalLaunchGate } = await import('../plane-a/src/services/institutional-launch')

    const maturity = {
      ready: false,
      requiredDays: 180,
      availableDays: 45,
      reason: 'accumulating_history' as const,
      updatedAt: '2026-03-05T00:00:00.000Z',
    }

    expect(toInstitutionalLaunchGate(maturity, 'prod')).toMatchObject({
      enforced: true,
      blocked: true,
    })
    expect(toInstitutionalLaunchGate(maturity, 'staging')).toMatchObject({
      enforced: false,
      blocked: false,
    })
  })
})
