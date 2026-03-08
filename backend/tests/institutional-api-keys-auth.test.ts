import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()
const mockValidateInstitutionalClientApiKey = vi.fn()

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../shared/db', async () => {
  const actual = await vi.importActual<any>('../shared/db')
  return {
    ...actual,
    query: (...args: any[]) => mockQuery(...args),
  }
})

vi.mock('../plane-a/src/services/api-keys', () => ({
  validateApiKey: vi.fn(),
  validateApiKeyToken: vi.fn().mockResolvedValue({ status: 'invalid' }),
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

describe('institutional api keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateInstitutionalClientApiKey.mockResolvedValue(null)
    mockQuery.mockImplementation(async (sql: string) => {
      const text = String(sql)

      if (text.includes('MAX(o.observed_at)')) {
        return {
          rows: [
            {
              provider_id: 'provider-1',
              provider_name: 'Provider One',
              last_observed_at: new Date('2026-02-15T00:00:00.000Z'),
              age_minutes: 12,
            },
          ],
          rowCount: 1,
        }
      }

      if (text.includes('provider_counts AS')) {
        return {
          rows: [
            {
              top_share: 0.4,
              top_two_share: 0.7,
            },
          ],
          rowCount: 1,
        }
      }

      return { rows: [], rowCount: 0 }
    })
  })

  it('allows active institutional clients on corridor coverage when scope and corridor are permitted', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'standard',
      corridors_allowed: ['US-MX-USD-MXN'],
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
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toMatchObject({
        corridorId: 'US-MX-USD-MXN',
        providerCount: 1,
        publishable: false,
        publishGateReasons: ['insufficient_providers'],
      })
    } finally {
      await app.close()
    }
  })

  it('rejects corridors not in the allowlist', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'standard',
      corridors_allowed: ['US-MX-USD-MXN'],
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
        url: '/api/v1/corridors/US-CA-USD-CAD/coverage',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'corridor_not_allowed',
        corridor_id: 'US-CA-USD-CAD',
      })
    } finally {
      await app.close()
    }
  })

  it('treats an empty corridor allowlist as deny-all', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'standard',
      corridors_allowed: [],
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
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'corridor_not_allowed',
        corridor_id: 'US-MX-USD-MXN',
      })
    } finally {
      await app.close()
    }
  })

  it('rejects suspended institutional clients', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'standard',
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
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'token' },
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

  it('rejects revoked institutional clients', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'premium',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'revoked',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'token' },
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

  it('rejects contract-expired institutional clients', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'premium',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: '2024-01-01',
      contract_end: '2026-03-04',
    })

    const app = await buildApp()

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'token' },
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

  it('returns insufficient_scope when the institutional tier lacks corridor access', async () => {
    mockValidateInstitutionalClientApiKey.mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'trial',
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
        url: '/api/v1/corridors/US-MX-USD-MXN/coverage',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'insufficient_scope',
        requiredScopes: ['corridors:read'],
      })
    } finally {
      await app.close()
    }
  })
})
