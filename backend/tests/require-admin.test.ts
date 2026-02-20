import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockConfig = vi.hoisted(() => ({
  env: 'production',
  db: {
    planeAUrl: 'postgres://localhost:5432/remit',
  },
  planeA: {
    adminEmails: ['ops@remit-scout.com'],
    adminEmailDomains: [],
    adminRequireAllowlist: true,
    adminAllowlistStrict: true,
    enterpriseApiRateLimitMax: 600,
    enterpriseApiRateLimitWindowMs: 60_000,
    enterpriseApiKeyMax: 5,
  },
}))

const mockQuery = vi.hoisted(() => vi.fn())
const mockWarn = vi.hoisted(() => vi.fn())
const mockError = vi.hoisted(() => vi.fn())

vi.mock('../shared/config', () => ({
  config: mockConfig,
}))

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    warn: mockWarn,
    error: mockError,
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/auth/verify-supabase-jwt', () => ({
  verifySupabaseJwt: vi.fn(),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  validateApiKey: vi.fn(),
}))

vi.mock('../plane-a/src/services/institutional-clients', () => ({
  getInstitutionalClientScopes: vi.fn(),
  isInstitutionalClientActive: vi.fn().mockReturnValue(false),
  validateInstitutionalClientApiKey: vi.fn(),
}))

vi.mock('../plane-a/src/services/entitlements', () => ({
  getEntitlementsForPlan: vi.fn(),
}))

vi.mock('../plane-a/src/services/user-plan', () => ({
  ensureUserPlan: vi.fn(),
  getUserPlan: vi.fn(),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: vi.fn().mockReturnValue({}),
  logAuditEvent: vi.fn(),
}))

vi.mock('../plane-a/src/types/errors', () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}))

import { requireAdmin } from '../plane-a/src/plugins/auth-plugin'

const makeReply = () => ({
  code: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig.env = 'production'
    mockConfig.planeA.adminEmails = ['ops@remit-scout.com']
    mockConfig.planeA.adminEmailDomains = []
    mockConfig.planeA.adminRequireAllowlist = true
    mockConfig.planeA.adminAllowlistStrict = true
    mockQuery.mockResolvedValue({ rows: [] })
  })

  it('denies super admin when allowlist is configured and user is not allowlisted', async () => {
    const handler = requireAdmin()
    const reply = makeReply()

    await handler(
      {
        user: { user_id: 'u-1', email: 'other@remit-scout.com', role: 'super_admin' },
      } as any,
      reply as any,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'forbidden' })
  })

  it('allows allowlisted admin', async () => {
    const handler = requireAdmin()
    const reply = makeReply()

    await handler(
      {
        user: { user_id: 'u-1', email: 'ops@remit-scout.com', role: 'admin' },
      } as any,
      reply as any,
    )

    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('denies when allowlist is required but missing', async () => {
    mockConfig.planeA.adminEmails = []
    mockConfig.planeA.adminEmailDomains = []

    const handler = requireAdmin()
    const reply = makeReply()

    await handler(
      {
        user: { user_id: 'u-1', email: 'ops@remit-scout.com', role: 'admin' },
      } as any,
      reply as any,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'forbidden' })
    expect(mockError).toHaveBeenCalledWith(
      'admin_allowlist_required_but_unconfigured',
      expect.any(Object),
    )
  })

  it('denies allowlisted user without admin role', async () => {
    const handler = requireAdmin()
    const reply = makeReply()

    await handler(
      {
        user: { user_id: 'u-1', email: 'ops@remit-scout.com', role: 'user' },
      } as any,
      reply as any,
    )

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith({ error: 'forbidden' })
  })
})
