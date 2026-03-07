import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListKeysByPrefix = vi.hoisted(() => vi.fn())
const mockGetKeyById = vi.hoisted(() => vi.fn())
const mockMarkKeyUsed = vi.hoisted(() => vi.fn())
const mockRedisGet = vi.hoisted(() => vi.fn())

vi.mock('../shared/config', () => ({
  config: {
    planeA: {
      apiKeyRotationGraceSeconds: 300,
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

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: (...args: unknown[]) => mockRedisGet(...args),
  }),
}))

vi.mock('../plane-a/src/repositories', () => ({
  ApiKeyRepository: class {
    listKeysByPrefix = (...args: unknown[]) => mockListKeysByPrefix(...args)
    getKeyById = (...args: unknown[]) => mockGetKeyById(...args)
    markKeyUsed = (...args: unknown[]) => mockMarkKeyUsed(...args)
  },
}))

describe('validateApiKeyToken grace-period validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('treats a grace-period token as revoked when the backing key has been revoked', async () => {
    const { hashApiKey, validateApiKeyToken } = await import('../plane-a/src/services/api-keys')
    const token = 'rotated-grace-token'

    mockListKeysByPrefix.mockResolvedValue([])
    mockRedisGet.mockResolvedValue(JSON.stringify({
      key_id: 'key-1',
      user_id: 'user-1',
      key_prefix: token.slice(0, 8),
      key_hash: hashApiKey(token),
      name: 'Rotated key',
      scopes: ['indices:read'],
    }))
    mockGetKeyById.mockResolvedValue({
      key_id: 'key-1',
      user_id: 'user-1',
      key_prefix: 'newpref01',
      key_hash: 'new-hash',
      name: 'Rotated key',
      scopes: ['indices:read'],
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      last_used_at: null,
      revoked_at: new Date('2026-03-05T12:05:00.000Z'),
    })

    await expect(validateApiKeyToken({} as any, token)).resolves.toEqual({ status: 'revoked' })
    expect(mockMarkKeyUsed).not.toHaveBeenCalled()
  })

  it('reuses the current active key record for grace-period validation', async () => {
    const { hashApiKey, validateApiKeyToken } = await import('../plane-a/src/services/api-keys')
    const token = 'rotated-grace-token'

    mockListKeysByPrefix.mockResolvedValue([])
    mockRedisGet.mockResolvedValue(JSON.stringify({
      key_id: 'key-1',
      user_id: 'user-1',
      key_prefix: token.slice(0, 8),
      key_hash: hashApiKey(token),
      name: 'Rotated key',
      scopes: ['indices:read'],
    }))
    mockGetKeyById.mockResolvedValue({
      key_id: 'key-1',
      user_id: 'user-1',
      key_prefix: 'newpref01',
      key_hash: 'new-hash',
      name: 'Rotated key',
      scopes: ['indices:read', 'exports:read'],
      created_at: new Date('2026-03-05T12:00:00.000Z'),
      last_used_at: null,
      revoked_at: null,
    })

    await expect(validateApiKeyToken({} as any, token)).resolves.toEqual({
      status: 'active',
      apiKey: {
        key_id: 'key-1',
        user_id: 'user-1',
        key_prefix: 'newpref01',
        name: 'Rotated key',
        scopes: ['indices:read', 'exports:read'],
      },
    })
    expect(mockMarkKeyUsed).toHaveBeenCalledWith('key-1')
  })
})
