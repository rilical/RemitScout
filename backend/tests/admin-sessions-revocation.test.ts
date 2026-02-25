import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as redisModule from '../shared/redis'

const store = new Map<string, string>()

const createRedisClient = () => ({
  set: vi.fn(async (key: string, value: string) => {
    store.set(key, value)
    return 'OK'
  }),
  get: vi.fn(async (key: string) => store.get(key) ?? null),
})

const resetEnv = () => {
  vi.resetModules()
  store.clear()
  delete process.env.PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED
}

const loadAdminSessions = async () => {
  const module = await import('../plane-a/src/services/admin-sessions')
  return module
}

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn(),
}))

describe('admin session revocation blocklist', () => {
  beforeEach(() => {
    resetEnv()
  })

  it('marks a jti revoked and returns true on lookup', async () => {
    vi.mocked(redisModule.getRedisClient).mockResolvedValue(createRedisClient())

    const { revokeAdminJti, isAdminJtiRevoked } = await loadAdminSessions()

    const revoked = await revokeAdminJti('jti-test-123', 60)
    expect(revoked).toBe(true)

    const isRevoked = await isAdminJtiRevoked('jti-test-123')
    expect(isRevoked).toBe(true)
  })

  it('returns false when redis is unavailable and fail-closed is disabled', async () => {
    process.env.PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED = '0'
    vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)

    const { isAdminJtiRevoked } = await loadAdminSessions()

    await expect(isAdminJtiRevoked('jti-test-fail-open')).resolves.toBe(false)
  })

  it('returns true when redis is unavailable and fail-closed is enabled', async () => {
    process.env.PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED = '1'
    vi.mocked(redisModule.getRedisClient).mockResolvedValue(null)

    const { isAdminJtiRevoked } = await loadAdminSessions()

    await expect(isAdminJtiRevoked('jti-test-fail-closed')).resolves.toBe(true)
  })

  it('returns true when redis lookup throws and fail-closed is enabled', async () => {
    process.env.PLANE_A_ADMIN_REVOCATION_FAIL_CLOSED = '1'
    vi.mocked(redisModule.getRedisClient).mockRejectedValue(new Error('boom'))

    const { isAdminJtiRevoked } = await loadAdminSessions()

    await expect(isAdminJtiRevoked('jti-test-fail-closed-exception')).resolves.toBe(true)
  })
})
