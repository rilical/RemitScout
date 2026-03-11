import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { registerAdminIpAllowlist } from '../plane-a/src/plugins/ip-allowlist'

describe('admin IP allowlist', () => {
  const apps: Array<ReturnType<typeof Fastify>> = []

  afterEach(async () => {
    await Promise.all(apps.splice(0).map(app => app.close()))
  })

  const createApp = async (allowlist: string[]) => {
    const app = Fastify()
    apps.push(app)
    registerAdminIpAllowlist(app, allowlist)
    app.get('/api/v1/admin/test', async () => ({ ok: true }))
    app.get('/api/v1/ops/test', async () => ({ ok: true }))
    app.get('/api/v1/audit/test', async () => ({ ok: true }))
    app.get('/api/v1/analytics/test', async () => ({ ok: true }))
    app.get('/api/v1/telemetry/analytics', async () => ({ ok: true }))
    app.get('/api/v1/indices/corrections', async () => ({ ok: true }))
    await app.ready()
    return app
  }

  it('uses the trusted runtime source IP for direct admin requests even when x-forwarded-for is spoofed', async () => {
    const app = await createApp(['203.0.113.10/32'])

    const denied = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/test',
      remoteAddress: '198.51.100.50',
      headers: {
        'x-forwarded-for': '203.0.113.10',
      },
    })

    expect(denied.statusCode).toBe(403)
    expect(denied.json()).toEqual({
      error: 'forbidden',
      code: 'admin_ip_not_allowlisted',
    })

    const allowed = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/test',
      remoteAddress: '203.0.113.10',
      headers: {
        'x-forwarded-for': '198.51.100.50',
      },
    })

    expect(allowed.statusCode).toBe(200)
  })

  it('uses the leftmost (viewer) IP from x-forwarded-for for CloudFront requests', async () => {
    const app = await createApp(['203.0.113.10/32'])

    const allowed = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/test',
      remoteAddress: '54.239.1.10',
      headers: {
        'x-amz-cf-id': 'cf-request-id',
        'x-forwarded-for': '203.0.113.10, 54.239.1.10',
      },
    })

    // CloudFront places the real viewer IP first in XFF; the last entry is the edge
    expect(allowed.statusCode).toBe(200)
  })

  it('uses remoteAddress directly for non-CloudFront requests (ignores XFF)', async () => {
    const app = await createApp(['10.0.0.1/32'])

    const allowed = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/test',
      remoteAddress: '10.0.0.1',
      headers: {
        'x-forwarded-for': '203.0.113.10, 198.51.100.50',
      },
    })

    // Non-CloudFront: remoteAddress (from Fastify trust proxy) is used directly
    expect(allowed.statusCode).toBe(200)
  })

  it('prefers the CloudFront viewer address when the header is available', async () => {
    const app = await createApp(['203.0.113.10/32'])

    const allowed = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/test',
      remoteAddress: '54.239.1.10',
      headers: {
        'x-amz-cf-id': 'cf-request-id',
        'cloudfront-viewer-address': '203.0.113.10:43124',
        'x-forwarded-for': '198.51.100.50, 54.239.1.10',
      },
    })

    expect(allowed.statusCode).toBe(200)
  })

  it('protects index corrections with the same admin IP allowlist', async () => {
    const app = await createApp(['203.0.113.10/32'])

    const denied = await app.inject({
      method: 'GET',
      url: '/api/v1/indices/corrections',
      remoteAddress: '198.51.100.50',
    })

    expect(denied.statusCode).toBe(403)
    expect(denied.json()).toEqual({
      error: 'forbidden',
      code: 'admin_ip_not_allowlisted',
    })
  })

  it('protects ops, audit, analytics, and telemetry admin routes with the same allowlist response code', async () => {
    const app = await createApp(['203.0.113.10/32'])

    for (const url of [
      '/api/v1/ops/test',
      '/api/v1/audit/test',
      '/api/v1/analytics/test',
      '/api/v1/telemetry/analytics',
    ]) {
      const response = await app.inject({
        method: 'GET',
        url,
        remoteAddress: '198.51.100.50',
      })

      expect(response.statusCode, url).toBe(403)
      expect(response.json(), url).toEqual({
        error: 'forbidden',
        code: 'admin_ip_not_allowlisted',
      })
    }
  })
})
