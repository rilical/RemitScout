import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as dbModule from '../shared/db'
import * as redisModule from '../shared/redis'

const mockConfig = vi.hoisted(() => ({
  redis: { url: '' },
  fxRates: {
    oandaRateLimitMaxRetries: 1,
    oandaRateLimitBackoffMs: 0,
    oandaRateLimitBackoffMaxMs: 0,
    oandaRateLimitJitterMs: 0,
    oandaRpm: 100000,
    oandaBurstMultiplier: 2,
  },
}))

vi.mock('../shared/config', () => ({ config: mockConfig }))

import { OandaRateFetcher } from '../shared/oanda-rate-fetcher'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn(),
}))

describe('OandaRateFetcher', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('retries on 429 and succeeds', async () => {
    const responseBody = {
      response: [
        {
          average_bid: '1.0',
          average_ask: '1.2',
          close_time: new Date().toISOString(),
        },
      ],
    }

    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(responseBody), { status: 200 }))

    global.fetch = fetchSpy as any

    const fetcher = new OandaRateFetcher({} as any, false)
    const result = await fetcher.fetchRate('USD', 'EUR', false, { source: 'test' })

    expect(result.success).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('returns fallback error after max retries', async () => {
    vi.mocked(dbModule.query).mockResolvedValue({ rows: [], rowCount: 0 } as any)

    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 429 }))

    global.fetch = fetchSpy as any

    const fetcher = new OandaRateFetcher({} as any, false)
    const result = await fetcher.fetchRate('USD', 'EUR', false, { source: 'test' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('No rate data available')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
