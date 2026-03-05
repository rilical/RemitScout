import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../shared/config', async () => {
  const actual = await vi.importActual<any>('../shared/config')
  return {
    ...actual,
    config: {
      ...actual.config,
      planeA: {
        ...actual.config.planeA,
        cors: {
          ...actual.config.planeA?.cors,
          origins: ['http://localhost:3000'],
        },
      },
    },
  }
})

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/services/institutional-clients', async () => {
  const actual = await vi.importActual<any>('../plane-a/src/services/institutional-clients')
  return {
    ...actual,
    validateInstitutionalClientApiKey: vi.fn(),
  }
})

import { buildApp } from '../plane-a/src/app'
import { validateInstitutionalClientApiKey } from '../plane-a/src/services/institutional-clients'

/**
 * Tests for the global institutional client guard in auth-plugin.ts.
 *
 * These verify that corridor allowlist and contract expiration are enforced
 * on ALL routes — including routes that do NOT use requireEntitlement as a
 * preHandler. This prevents institutional clients from bypassing guards by
 * calling public routes directly.
 */
describe('institutional global guard (routes without requireEntitlement)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects expired institutional clients on non-entitlement routes', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-expired',
      name: 'Expired Client',
      tier: 'standard',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: '2024-01-01',
      contract_end: '2025-01-01', // expired
    })

    const app = await buildApp()
    app.get('/api/v1/quotes/test-public', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/quotes/test-public',
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

  it('rejects suspended institutional clients on non-entitlement routes', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-suspended',
      name: 'Suspended Client',
      tier: 'standard',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'suspended',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get('/api/v1/quotes/test-public', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/quotes/test-public',
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

  it('rejects corridor-restricted client on disallowed corridor (non-entitlement route)', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-restricted',
      name: 'Restricted Client',
      tier: 'standard',
      corridors_allowed: ['US-MX-USD-MXN'],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get('/api/v1/quotes/test-public', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/quotes/test-public?corridor_id=US-CA-USD-CAD',
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

  it('allows corridor-restricted client on allowed corridor (non-entitlement route)', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-restricted',
      name: 'Restricted Client',
      tier: 'standard',
      corridors_allowed: ['US-MX-USD-MXN'],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get('/api/v1/quotes/test-public', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/quotes/test-public?corridor_id=US-MX-USD-MXN',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ ok: true })
    } finally {
      await app.close()
    }
  })

  it('allows active institutional client with no corridor restriction on any route', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-active',
      name: 'Active Client',
      tier: 'standard',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: '2024-01-01',
      contract_end: '2099-12-31',
    })

    const app = await buildApp()
    app.get('/api/v1/quotes/test-public', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/quotes/test-public?corridor_id=US-CA-USD-CAD',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ ok: true })
    } finally {
      await app.close()
    }
  })

  it('treats empty corridors_allowed array as deny-all (no corridors permitted)', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-empty-array',
      name: 'Premium Client',
      tier: 'premium',
      corridors_allowed: [],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get('/api/v1/quotes/test-public', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/quotes/test-public?corridor_id=US-CA-USD-CAD',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: 'corridor_not_allowed' })
    } finally {
      await app.close()
    }
  })

  it('rejects corridor-restricted client on disallowed corridor via path param', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-restricted',
      name: 'Restricted Client',
      tier: 'standard',
      corridors_allowed: ['US-MX-USD-MXN'],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get('/api/v1/test/:corridorId', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test/US-CA-USD-CAD',
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

  it('allows corridor-restricted client on allowed corridor via path param', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-restricted',
      name: 'Restricted Client',
      tier: 'standard',
      corridors_allowed: ['US-MX-USD-MXN'],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get('/api/v1/test/:corridorId', async () => ({ ok: true }))

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/test/US-MX-USD-MXN',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ ok: true })
    } finally {
      await app.close()
    }
  })
})
