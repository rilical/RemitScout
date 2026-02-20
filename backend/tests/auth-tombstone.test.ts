import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../shared/config', () => ({
  config: {
    db: {
      planeAUrl: '',
    },
    planeA: {
      adminEmails: [],
      adminEmailDomains: [],
      adminRequireAllowlist: false,
      adminAllowlistStrict: false,
      enterpriseApiRateLimitMax: 0,
      enterpriseApiRateLimitWindowMs: 60000,
      enterpriseApiKeyMax: 10,
    },
    env: 'test',
    privacy: {
      kAnonymityMinimum: 5,
      corridorMinDataPoints24h: 100,
      providerMinQuotesPerCorridor: 50,
      trendMinLookbackDays: 7,
      corridorMaxTrendPct: 50,
    },
  },
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn().mockResolvedValue({
    user_id: 'u1',
    email: 'u@test.com',
    claims: {},
  }),
}))

describe('auth tombstone guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [{ user_id: 'u1' }], rowCount: 1 })
  })

  it('marks request as deleted and does not attach user', async () => {
    const { authPlugin } = await import('../plane-a/src/plugins/auth-plugin')

    const app: any = {
      addHook: vi.fn(),
    }

    authPlugin(app)

    const hook = vi.mocked(app.addHook).mock.calls.find((c) => c[0] === 'preHandler')?.[1] as any
    const request: any = { headers: { authorization: 'Bearer token' } }

    await hook(request)

    expect(request.accountDeleted).toBe(true)
    expect(request.user).toBeUndefined()
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('silver.account_deletion_tombstone'),
      ['u1'],
      expect.anything(),
    )
  })
})
