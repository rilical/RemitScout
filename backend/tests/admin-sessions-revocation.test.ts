import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    set: async (key: string, value: string) => {
      store.set(key, value)
      return 'OK'
    },
    get: async (key: string) => store.get(key) ?? null,
  }),
}))

describe('admin session revocation blocklist', () => {
  beforeEach(() => {
    store.clear()
  })

  it('marks a jti revoked and returns true on lookup', async () => {
    const { revokeAdminJti, isAdminJtiRevoked } = await import('../plane-a/src/services/admin-sessions')

    const revoked = await revokeAdminJti('jti-test-123', 60)
    expect(revoked).toBe(true)

    const isRevoked = await isAdminJtiRevoked('jti-test-123')
    expect(isRevoked).toBe(true)
  })
})
