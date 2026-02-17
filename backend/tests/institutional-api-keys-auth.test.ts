import { beforeEach, describe, expect, it, vi } from 'vitest'

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
import { requireEntitlement } from '../plane-a/src/plugins/auth-plugin'
import { validateInstitutionalClientApiKey } from '../plane-a/src/services/institutional-clients'

describe('institutional api keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows institutional clients to access api_access guarded indices routes', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
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
    app.get(
      '/api/v1/indices/test',
      { preHandler: requireEntitlement('api_access') },
      async () => ({ ok: true }),
    )

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/test',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json()).toEqual({ ok: true })
    } finally {
      await app.close()
    }
  })

  it('rejects corridors not in the allowlist when corridor_id is provided', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'trial',
      corridors_allowed: ['US-MX-USD-MXN'],
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'active',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get(
      '/api/v1/indices/test',
      { preHandler: requireEntitlement('api_access') },
      async () => ({ ok: true }),
    )

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/test?corridor_id=US-CA-USD-CAD',
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

  it('rejects suspended institutional clients', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
      id: 'c-1',
      name: 'Client One',
      tier: 'trial',
      corridors_allowed: null,
      rate_limit_rpm: 60,
      rate_limit_daily: 100000,
      status: 'suspended',
      contract_start: null,
      contract_end: null,
    })

    const app = await buildApp()
    app.get(
      '/api/v1/indices/test',
      { preHandler: requireEntitlement('api_access') },
      async () => ({ ok: true }),
    )

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/indices/test',
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

  it('enforces scope mapping (trial tier lacks corridors:read)', async () => {
    vi.mocked(validateInstitutionalClientApiKey).mockResolvedValue({
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
    app.get(
      '/api/v1/providers/test',
      { preHandler: requireEntitlement('api_access') },
      async () => ({ ok: true }),
    )

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/providers/test',
        headers: { 'x-api-key': 'token' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({
        error: 'insufficient_scope',
      })
    } finally {
      await app.close()
    }
  })
})

