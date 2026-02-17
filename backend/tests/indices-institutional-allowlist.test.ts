import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../shared/db', async () => {
  const actual = await vi.importActual<any>('../shared/db')
  return {
    ...actual,
    query: (...args: any[]) => mockQuery(...args),
  }
})

vi.mock('../plane-a/src/services/institutional-clients', async () => {
  const actual = await vi.importActual<any>('../plane-a/src/services/institutional-clients')
  return {
    ...actual,
    validateInstitutionalClientApiKey: vi.fn(),
  }
})

import { buildApp } from '../plane-a/src/app'
import { validateInstitutionalClientApiKey } from '../plane-a/src/services/institutional-clients'

describe('indices corridors institutional filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters /indices/corridors to corridors_allowed when institutional client has an allowlist', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'trial',
      corridors_allowed: ['US-MX-USD-MXN'],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const rows = [
      {
        corridor_id: 'US-MX-USD-MXN',
        source_country: 'US',
        dest_country: 'MX',
        source_currency: 'USD',
        dest_currency: 'MXN',
        data_points: 10,
        last_updated: new Date('2026-02-15T00:00:00.000Z'),
      },
      {
        corridor_id: 'US-CA-USD-CAD',
        source_country: 'US',
        dest_country: 'CA',
        source_currency: 'USD',
        dest_currency: 'CAD',
        data_points: 5,
        last_updated: new Date('2026-02-15T00:00:00.000Z'),
      },
    ]

    mockQuery.mockImplementation(async (sql: string, params: any[]) => {
      const text = String(sql)

      if (text.includes('INSERT INTO public.api_usage_log')) {
        return { rows: [], rowCount: 1 }
      }

      if (text.includes('FROM gold_export.cdp_daily') && text.includes('GROUP BY corridor_id')) {
        const allowlist = Array.isArray(params?.[1]) ? (params[1] as string[]) : null
        const filtered = allowlist ? rows.filter((r) => allowlist.includes(r.corridor_id)) : rows
        return { rows: filtered, rowCount: filtered.length }
      }

      return { rows: [], rowCount: 0 }
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/corridors',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json() as any
      expect(Array.isArray(body.corridors)).toBe(true)
      expect(body.corridors.map((c: any) => c.corridorId)).toEqual(['US-MX-USD-MXN'])
    } finally {
      await app.close()
    }
  })
})

