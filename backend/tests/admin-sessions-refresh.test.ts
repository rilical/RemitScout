import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPoolConnect = vi.hoisted(() => vi.fn())
const mockClientQuery = vi.hoisted(() => vi.fn())
const mockClientRelease = vi.hoisted(() => vi.fn())
const mockQuery = vi.hoisted(() => vi.fn())
const mockResolveAdminAccess = vi.hoisted(() => vi.fn())
const mockIssuePlaneAAdminAccessToken = vi.hoisted(() => vi.fn())

vi.mock('../shared/config', () => ({
  config: {
    env: 'development',
    planeA: {
      adminRefreshTokenTtlSeconds: 3600,
      adminAccessTokenTtlSeconds: 900,
      adminRefreshCookieName: 'plane_a_admin_refresh',
    },
  },
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../shared/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

vi.mock('../plane-a/src/services/admin-access', () => ({
  resolveAdminAccess: (...args: unknown[]) => mockResolveAdminAccess(...args),
}))

vi.mock('../plane-a/src/auth/admin-jwt', () => ({
  issuePlaneAAdminAccessToken: (...args: unknown[]) => mockIssuePlaneAAdminAccessToken(...args),
}))

describe('refreshAdminSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    })
  })

  it('revokes the refresh-token family and fails closed when admin access has been removed', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        rows: [{
          id: 'token-id',
          user_id: '00000000-0000-4000-8000-000000000111',
          token_family_id: '00000000-0000-4000-8000-000000000222',
          expires_at: future,
          revoked_at: null,
          rotated_at: null,
          metadata: { mfa_verified: true },
        }],
      })
      .mockResolvedValueOnce(undefined)
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ email: 'ops@remit-scout.com', app_role: 'admin' }],
      })
      .mockResolvedValueOnce({ rows: [] })
    mockResolveAdminAccess.mockResolvedValue({
      allowed: false,
      appRole: 'admin',
      denyReason: 'admin_allowlist_denied',
    })

    const { refreshAdminSession } = await import('../plane-a/src/services/admin-sessions')

    await expect(refreshAdminSession({
      pool: {
        connect: mockPoolConnect,
      } as any,
      refreshToken: 'refresh-token',
      ipHash: 'ip-hash',
      userAgent: 'browser',
    })).rejects.toEqual(expect.objectContaining({
      code: 'admin_allowlist_denied',
      statusCode: 403,
    }))

    expect(mockResolveAdminAccess).toHaveBeenCalledWith(expect.objectContaining({
      userId: '00000000-0000-4000-8000-000000000111',
      email: 'ops@remit-scout.com',
    }))
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE public.admin_refresh_token'),
      ['00000000-0000-4000-8000-000000000222', 'admin_allowlist_denied'],
      expect.anything(),
    )
    expect(mockIssuePlaneAAdminAccessToken).not.toHaveBeenCalled()
    expect(mockClientQuery).toHaveBeenNthCalledWith(3, 'COMMIT')
    expect(mockClientRelease).toHaveBeenCalled()
  })

  it('reuses the stored Supabase role when refreshing an admin session', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    mockClientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        rows: [{
          id: 'token-id',
          user_id: '00000000-0000-4000-8000-000000000111',
          token_family_id: '00000000-0000-4000-8000-000000000222',
          expires_at: future,
          revoked_at: null,
          rotated_at: null,
          metadata: { mfa_verified: true, supabase_role: 'super_admin' },
        }],
      })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    mockQuery.mockResolvedValueOnce({
      rows: [{ email: 'ops@remit-scout.com', app_role: null }],
    })
    mockResolveAdminAccess.mockResolvedValue({
      allowed: true,
      appRole: null,
      email: 'ops@remit-scout.com',
    })
    mockIssuePlaneAAdminAccessToken.mockResolvedValue({
      token: 'access-token',
      jti: 'jti-2',
      expiresIn: 900,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    })

    const { refreshAdminSession } = await import('../plane-a/src/services/admin-sessions')

    await expect(refreshAdminSession({
      pool: {
        connect: mockPoolConnect,
      } as any,
      refreshToken: 'refresh-token',
      ipHash: 'ip-hash',
      userAgent: 'browser',
    })).resolves.toMatchObject({
      accessToken: 'access-token',
      tokenType: 'Bearer',
    })

    expect(mockResolveAdminAccess).toHaveBeenCalledWith(expect.objectContaining({
      userId: '00000000-0000-4000-8000-000000000111',
      email: 'ops@remit-scout.com',
      supabaseRole: 'super_admin',
    }))
    expect(mockIssuePlaneAAdminAccessToken).toHaveBeenCalledWith(expect.objectContaining({
      userId: '00000000-0000-4000-8000-000000000111',
      role: 'super_admin',
      appRole: null,
    }))
  })
})
