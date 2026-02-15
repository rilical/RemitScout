// @vitest-environment node
import { createServer } from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, eventHandler, toNodeListener } from 'h3'
import rateLimit from '~/server/middleware/rate-limit'
import { checkRateLimit, resetRateLimiterForTests } from '~/server/utils/rateLimiter'

type TestServer = { server: ReturnType<typeof createServer>, baseUrl: string }

const startServer = async (): Promise<TestServer> => {
  const app = createApp()
  app.use(rateLimit)
  app.use(eventHandler(() => ({ ok: true })))

  const server = createServer(toNodeListener(app))
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  return { server, baseUrl: `http://127.0.0.1:${port}` }
}

let active: TestServer | null = null
afterEach(() => {
  active?.server.close()
  active = null
})

beforeEach(() => {
  resetRateLimiterForTests()
})

describe('rate-limit middleware', () => {
  it('allows first 120 requests and blocks request 121', async () => {
    active = await startServer()

    for (let i = 1; i <= 120; i++) {
      const res = await fetch(`${active.baseUrl}/api/test`, {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      })
      expect(res.status).toBe(200)
      expect(Number(res.headers.get('x-ratelimit-remaining'))).toBe(120 - i)
    }

    const res121 = await fetch(`${active.baseUrl}/api/test`, {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    expect(res121.status).toBe(429)
  })

  it('uses higher limit for authenticated requests', async () => {
    active = await startServer()
    const res = await fetch(`${active.baseUrl}/api/test`, {
      headers: { 'x-forwarded-for': '2.2.2.2', 'authorization': 'Bearer token' },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('x-ratelimit-limit')).toBe('600')
    expect(res.headers.get('x-ratelimit-remaining')).toBe('599')
  })

  it('applies stricter limit to Stripe checkout endpoint', async () => {
    active = await startServer()

    for (let i = 1; i <= 10; i++) {
      const res = await fetch(`${active.baseUrl}/api/stripe/create-checkout`, {
        headers: { 'x-forwarded-for': '3.3.3.3' },
      })
      expect(res.status).toBe(200)
      expect(Number(res.headers.get('x-ratelimit-remaining'))).toBe(10 - i)
    }

    const res11 = await fetch(`${active.baseUrl}/api/stripe/create-checkout`, {
      headers: { 'x-forwarded-for': '3.3.3.3' },
    })
    expect(res11.status).toBe(429)
  })

  it('resets after the window elapses (unit test of limiter clock)', () => {
    vi.useFakeTimers()
    try {
      const key = '4.4.4.4'
      for (let i = 0; i < 5; i++) {
        const r = checkRateLimit(key, { windowMs: 60_000, maxRequests: 5 })
        expect(r.allowed).toBe(true)
      }

      const blocked = checkRateLimit(key, { windowMs: 60_000, maxRequests: 5 })
      expect(blocked.allowed).toBe(false)

      vi.setSystemTime(Date.now() + 60_001)
      const after = checkRateLimit(key, { windowMs: 60_000, maxRequests: 5 })
      expect(after.allowed).toBe(true)
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('different IPs have independent limits', async () => {
    active = await startServer()

    // Exhaust IP1 quickly on a sensitive endpoint.
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${active.baseUrl}/api/stripe/create-checkout`, {
        headers: { 'x-forwarded-for': '5.5.5.5' },
      })
      expect(res.status).toBe(200)
    }

    const ip1Blocked = await fetch(`${active.baseUrl}/api/stripe/create-checkout`, {
      headers: { 'x-forwarded-for': '5.5.5.5' },
    })
    expect(ip1Blocked.status).toBe(429)

    const ip2Allowed = await fetch(`${active.baseUrl}/api/stripe/create-checkout`, {
      headers: { 'x-forwarded-for': '6.6.6.6' },
    })
    expect(ip2Allowed.status).toBe(200)
  })
})
