import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockValidateApiKeyToken = vi.fn()
const mockValidateInstitutionalClientApiKey = vi.fn()

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/services/api-keys', () => ({
  validateApiKey: vi.fn(),
  validateApiKeyToken: (...args: any[]) => mockValidateApiKeyToken(...args),
  hashApiKey: vi.fn((token: string) => token),
  createApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
  countActiveApiKeys: vi.fn(),
}))

vi.mock('../plane-a/src/services/institutional-clients', async () => {
  const actual = await vi.importActual<any>('../plane-a/src/services/institutional-clients')
  return {
    ...actual,
    validateInstitutionalClientApiKey: (...args: any[]) => mockValidateInstitutionalClientApiKey(...args),
  }
})

import { buildApp } from '../plane-a/src/app'

describe('API-key global guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateApiKeyToken.mockResolvedValue({ status: 'invalid' })
    mockValidateInstitutionalClientApiKey.mockResolvedValue(null)
  })

  it('returns invalid_api_key on public routes when x-api-key is unknown', async () => {
    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/geo',
        headers: { 'x-api-key': 'bad-token' },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toMatchObject({
        error: 'unauthorized',
        code: 'invalid_api_key',
      })
    } finally {
      await app.close()
    }
  })

  it('returns revoked_api_key on public routes when a retail key has been revoked', async () => {
    mockValidateApiKeyToken.mockResolvedValue({ status: 'revoked' })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/geo',
        headers: { 'x-api-key': 'revoked-token' },
      })

      expect(res.statusCode).toBe(401)
      expect(res.json()).toMatchObject({
        error: 'unauthorized',
        code: 'revoked_api_key',
      })
    } finally {
      await app.close()
    }
  })

  it('blocks active institutional clients from public retail routes', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Institutional Client',
      tier: 'premium',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/geo',
        headers: { 'x-api-key': 'institutional-token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'forbidden',
        code: 'api_key_route_not_allowed',
      })
    } finally {
      await app.close()
    }
  })

  it('blocks active retail user API keys from public retail-plan routes without explicit API-key policy', async () => {
    mockValidateApiKeyToken.mockResolvedValue({
      status: 'active',
      apiKey: {
        key_id: 'key-1',
        user_id: 'user-1',
        key_prefix: 'abc12345',
        name: 'Retail Key',
        scopes: ['indices:read', 'corridors:read'],
      },
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/geo',
        headers: { 'x-api-key': 'retail-token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'forbidden',
        code: 'api_key_route_not_allowed',
      })
    } finally {
      await app.close()
    }
  })

  it('blocks inactive institutional clients everywhere before route policy fallback', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Institutional Client',
      tier: 'premium',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'suspended',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/geo',
        headers: { 'x-api-key': 'institutional-token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'forbidden',
        code: 'institutional_inactive',
      })
    } finally {
      await app.close()
    }
  })
})
