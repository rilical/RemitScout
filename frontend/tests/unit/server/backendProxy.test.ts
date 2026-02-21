// @vitest-environment node
import { createServer } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, eventHandler, toNodeListener } from 'h3'
import { __resetBackendProxyCircuitForTests, proxyToBackend } from '~/server/utils/backendProxy'

vi.mock('ofetch', () => {
  return {
    $fetch: {
      raw: vi.fn(),
    },
  }
})

const { $fetch } = await import('ofetch') as unknown as { $fetch: { raw: ReturnType<typeof vi.fn> } }

type TestServer = { server: ReturnType<typeof createServer>, baseUrl: string }

const startServer = async (handler: (event: any) => Promise<any>) => {
  const app = createApp()
  app.use(eventHandler(handler))

  const server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  return { server, baseUrl: `http://127.0.0.1:${port}` } satisfies TestServer
}

let active: TestServer | null = null
afterEach(() => {
  active?.server.close()
  active = null
})

beforeEach(() => {
  vi.clearAllMocks()
  __resetBackendProxyCircuitForTests()
  process.env.API_BASE = 'https://backend.example.com'
})

describe('proxyToBackend', () => {
  it('forwards headers and sets x-request-id', async () => {
    $fetch.raw.mockResolvedValueOnce({ status: 200, headers: new Headers(), _data: { ok: true } })

    active = await startServer(async (event) => {
      event.context.requestId = 'req_test_1'
      return await proxyToBackend(event, '/providers')
    })

    const res = await fetch(`${active.baseUrl}/`, {
      headers: {
        authorization: 'Bearer abc',
        cookie: 'a=b',
      },
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('x-request-id')).toBe('req_test_1')
    expect(res.headers.get('server-timing')).toContain('backend;dur=')

    expect($fetch.raw).toHaveBeenCalledTimes(1)
    const [url, init] = $fetch.raw.mock.calls[0] as any[]
    expect(String(url)).toContain('/api/v1/providers')
    expect(init.headers.authorization).toBe('Bearer abc')
    expect(init.headers.cookie).toBe('a=b')
    expect(init.headers['x-request-id']).toBe('req_test_1')
  })

  it('forwards set-cookie and rewrites proxied api path', async () => {
    const headers = new Headers()
    Object.defineProperty(headers, 'getSetCookie', {
      value: () => ['plane_a_admin_refresh=abc123; Path=/api/v1/sessions; HttpOnly; SameSite=Strict'],
      configurable: true,
    })

    $fetch.raw.mockResolvedValueOnce({ status: 200, headers, _data: { ok: true } })

    active = await startServer(async (event) => {
      event.context.requestId = 'req_cookie'
      return await proxyToBackend(event, '/sessions/admin/refresh', { maxRetries: 0 })
    })

    const res = await fetch(`${active.baseUrl}/`, { method: 'POST' })
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('plane_a_admin_refresh=abc123')
    expect(setCookie).toContain('Path=/api/sessions')
    expect(setCookie).not.toContain('Path=/api/v1/sessions')
  })

  it('retries on 5xx and succeeds', async () => {
    $fetch.raw
      .mockResolvedValueOnce({ status: 503, headers: new Headers(), _data: { message: 'nope' } })
      .mockResolvedValueOnce({ status: 503, headers: new Headers(), _data: { message: 'nope' } })
      .mockResolvedValueOnce({ status: 200, headers: new Headers(), _data: { ok: true } })

    active = await startServer(async (event) => {
      event.context.requestId = 'req_retry'
      return await proxyToBackend(event, '/providers', { maxRetries: 2 })
    })

    const res = await fetch(`${active.baseUrl}/`)
    expect(res.status).toBe(200)
    expect($fetch.raw).toHaveBeenCalledTimes(3)
  })

  it('does not retry on 4xx and passes through status', async () => {
    $fetch.raw.mockResolvedValueOnce({ status: 400, headers: new Headers(), _data: { error: 'bad_request' } })

    active = await startServer(async (event) => {
      event.context.requestId = 'req_400'
      return await proxyToBackend(event, '/providers')
    })

    const res = await fetch(`${active.baseUrl}/`)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'bad_request' })
    expect($fetch.raw).toHaveBeenCalledTimes(1)
  })

  it('returns 204 for non-blocking paths on failure', async () => {
    $fetch.raw.mockResolvedValueOnce({ status: 503, headers: new Headers(), _data: { message: 'down' } })

    active = await startServer(async (event) => {
      event.context.requestId = 'req_nb'
      return await proxyToBackend(event, '/telemetry/click')
    })

    const res = await fetch(`${active.baseUrl}/`)
    expect(res.status).toBe(204)
    expect($fetch.raw).toHaveBeenCalledTimes(1)
  })

  it('sanitizes 5xx responses into a stable 503 shape', async () => {
    $fetch.raw.mockResolvedValueOnce({ status: 500, headers: new Headers(), _data: { message: 'stacktrace: ...' } })

    active = await startServer(async (event) => {
      event.context.requestId = 'req_5xx'
      return await proxyToBackend(event, '/providers', { maxRetries: 0 })
    })

    const res = await fetch(`${active.baseUrl}/`)
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('service_unavailable')
    expect(body.requestId).toBe('req_5xx')
  })
})
