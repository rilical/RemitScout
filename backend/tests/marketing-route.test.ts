import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockCheckRateLimit = vi.fn()
const mockInsertQuery = vi.fn()
const mockGetPrivacySettings = vi.fn()
const mockFetch = vi.fn()
const mockConfig = {
  marketing: {
    meta: {
      pixelId: '',
      accessToken: '',
      testEventCode: '',
    },
    tiktok: {
      pixelId: '',
      accessToken: '',
      testEventCode: '',
    },
  },
}

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/config', () => ({
  config: mockConfig,
}))

vi.mock('../shared/db', () => ({
  query: (...args: any[]) => mockInsertQuery(...args),
}))

vi.mock('../plane-a/src/container', () => ({
  planeAContainer: {
    pool: {},
    repositories: {
      userAccount: {
        getPrivacySettings: (...args: any[]) => mockGetPrivacySettings(...args),
      },
    },
  },
}))

vi.mock('../plane-a/src/utils/rate-limit', () => ({
  buildRateLimitKey: () => 'marketing:key',
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}))

const makeApp = () => ({
  post: vi.fn(),
  container: {
    pool: {},
    repositories: {
      userAccount: {
        getPrivacySettings: (...args: any[]) => mockGetPrivacySettings(...args),
      },
    },
  },
}) as unknown as FastifyInstance

const getPostHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

const makeReply = () => ({
  code: vi.fn().mockReturnThis(),
})

describe('marketing route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue(false)
    mockInsertQuery.mockResolvedValue({ rowCount: 1 })
    mockGetPrivacySettings.mockResolvedValue({
      marketing_enabled: true,
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    })
    mockConfig.marketing.meta.pixelId = ''
    mockConfig.marketing.meta.accessToken = ''
    mockConfig.marketing.meta.testEventCode = ''
    mockConfig.marketing.tiktok.pixelId = ''
    mockConfig.marketing.tiktok.accessToken = ''
    mockConfig.marketing.tiktok.testEventCode = ''
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 0, message: 'OK' }),
    })
    vi.stubGlobal('fetch', mockFetch)
  })

  it('returns 400 on invalid payload', async () => {
    const app = makeApp()
    const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
    await marketingRoutes(app)

    const handler = getPostHandler(app, '/marketing/meta')
    const reply = makeReply()
    await expect(handler({ body: {} }, reply)).rejects.toMatchObject({
      code: 'validation_error',
      statusCode: 400,
    })
  })

  it('returns 429 when request is rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValue(true)

    const app = makeApp()
    const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
    await marketingRoutes(app)

    const handler = getPostHandler(app, '/marketing/meta')
    const reply = makeReply()
    await expect(
      handler({ body: { event_name: 'PageView' }, ip: '127.0.0.1', headers: {} }, reply),
    ).rejects.toMatchObject({
      code: 'rate_limited',
      statusCode: 429,
    })
  })

  it('skips delivery when user opted out', async () => {
    mockGetPrivacySettings.mockResolvedValue({
      marketing_enabled: false,
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    })

    const app = makeApp()
    const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
    await marketingRoutes(app)

    const handler = getPostHandler(app, '/marketing/meta')
    const response = await handler(
      {
        body: { event_name: 'Purchase', value: 10, currency: 'usd' },
        ip: '127.0.0.1',
        headers: {},
        user: { user_id: 'u-1', email: 'test@example.com' },
      },
      makeReply(),
    )

    expect(response).toEqual({ success: true, skipped: 'opt_out' })
  })

  it('stores anonymized client context for marketing events', async () => {
    const app = makeApp()
    const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
    await marketingRoutes(app)

    const handler = getPostHandler(app, '/marketing/meta')
    const response = await handler(
      {
        body: { event_name: 'Lead' },
        ip: '203.0.113.89',
        headers: {
          'user-agent': 'Mozilla/5.0 AppleWebKit Chrome/122.0.0.0 Safari/537.36',
        },
      },
      makeReply(),
    )

    expect(response).toMatchObject({ success: true })
    expect(mockInsertQuery).toHaveBeenCalled()
    const params = mockInsertQuery.mock.calls[0]?.[1] as unknown[]
    expect(params[20]).toBe('203.0.113.0')
    expect(String(params[21])).toMatch(/^[a-f0-9]{64}$/)
    expect(params[22]).toBe('chrome')
  })

  it('returns disabled when TikTok events API credentials are missing', async () => {
    const app = makeApp()
    const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
    await marketingRoutes(app)

    const handler = getPostHandler(app, '/marketing/tiktok')
    const response = await handler(
      {
        body: { event_name: 'Search', corridor_id: 'US-IN-USD-INR' },
        ip: '203.0.113.89',
        headers: { 'user-agent': 'Mozilla/5.0 Chrome/122.0.0.0' },
      },
      makeReply(),
    )

    expect(response).toMatchObject({
      success: true,
      delivered: false,
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('forwards TikTok event when API credentials are configured', async () => {
    mockConfig.marketing.tiktok.pixelId = 'D6E03RJC77UEP1KMQJN0'
    mockConfig.marketing.tiktok.accessToken = 'tok_test'

    const app = makeApp()
    const { marketingRoutes } = await import('../plane-a/src/routes/marketing')
    await marketingRoutes(app)

    const handler = getPostHandler(app, '/marketing/tiktok')
    const response = await handler(
      {
        body: {
          event_name: 'Search',
          event_id: 'event_12345678',
          event_source_url: 'https://staging.remit-scout.com/send-money',
          corridor_id: 'US-IN-USD-INR',
          value: 42.5,
          currency: 'usd',
          ttclid: 'ttclid123',
          ttp: 'ttp_cookie_1',
          custom_data: { search_string: 'US-IN-USD-INR' },
        },
        ip: '198.51.100.10',
        headers: { 'user-agent': 'Mozilla/5.0 Chrome/122.0.0.0' },
        user: { user_id: 'user_1', email: 'buyer@example.com' },
      },
      makeReply(),
    )

    expect(response).toMatchObject({
      success: true,
      delivered: true,
      event_id: 'event_12345678',
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://business-api.tiktok.com/open_api/v1.3/event/track/')
    expect(init.headers).toMatchObject({
      'Access-Token': 'tok_test',
      'Content-Type': 'application/json',
    })
    const payload = JSON.parse(String(init.body))
    expect(payload.event_source_id).toBe('D6E03RJC77UEP1KMQJN0')
    expect(payload.data?.[0]?.event).toBe('Search')
  })
})
