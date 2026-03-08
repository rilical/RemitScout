import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateKey = vi.fn()

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/repositories', () => ({
  ApiKeyRepository: vi.fn().mockImplementation(() => ({
    createKey: (...args: any[]) => mockCreateKey(...args),
    listKeys: vi.fn(),
    getKeyByHash: vi.fn(),
    listKeysByPrefix: vi.fn(),
    listActiveKeysByPrefix: vi.fn(),
    getActiveKeyById: vi.fn(),
    revokeKey: vi.fn(),
    markKeyUsed: vi.fn(),
    countActiveKeys: vi.fn(),
  })),
}))

import { createApiKey } from '../plane-a/src/services/api-keys'

describe('createApiKey scope handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateKey.mockImplementation(async (input: any) => ({
      key_id: 'key-1',
      user_id: input.user_id,
      key_prefix: input.key_prefix,
      key_hash: input.key_hash,
      name: input.name ?? null,
      scopes: input.scopes ?? [],
      created_at: new Date('2026-02-15T00:00:00.000Z'),
      last_used_at: null,
      revoked_at: null,
    }))
  })

  it('preserves explicitly requested supported scopes without broadening them', async () => {
    const result = await createApiKey({} as any, 'user-1', {
      scopes: ['exports:read'],
    })

    expect(result.scopes).toEqual(['exports:read'])
  })

  it('applies the default retail scopes when no scopes are requested', async () => {
    const result = await createApiKey({} as any, 'user-1')

    expect(result.scopes).toEqual(['indices:read', 'corridors:read'])
  })
})
