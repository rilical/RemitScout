import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockCheckRateLimit = vi.fn()
const mockFetch = vi.fn()

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/config', () => ({
  config: {
    auth: {
      supabase: {
        url: 'https://supabase.test',
        publishableKey: 'anon-key',
      },
    },
  },
}))

vi.mock('../plane-a/src/utils/rate-limit', () => ({
  buildRateLimitKey: () => 'pwd-reset:hashed',
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}))

const makeApp = () => ({ post: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.post).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

const makeReply = () => ({
  code: vi.fn().mockReturnThis(),
  send: vi.fn().mockImplementation((payload) => payload),
})

describe('auth forgot-password route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue(false)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a generic 200 response for invalid payloads to avoid email enumeration', async () => {
    const app = makeApp()
    const { authRoutes } = await import('../plane-a/src/routes/auth')
    await authRoutes(app)

    const handler = getHandler(app, '/auth/forgot-password')
    const reply = makeReply()
    const response = await handler({ body: { email: 'not-an-email' } }, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(response).toEqual({
      message: 'If that email exists, a reset link has been sent.',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns a generic 200 response when rate-limited and skips the Supabase proxy', async () => {
    mockCheckRateLimit.mockResolvedValue(true)

    const app = makeApp()
    const { authRoutes } = await import('../plane-a/src/routes/auth')
    await authRoutes(app)

    const handler = getHandler(app, '/auth/forgot-password')
    const reply = makeReply()
    const response = await handler({ body: { email: 'user@example.com' } }, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(response).toEqual({
      message: 'If that email exists, a reset link has been sent.',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('normalizes the email and proxies reset requests to Supabase recover', async () => {
    const app = makeApp()
    const { authRoutes } = await import('../plane-a/src/routes/auth')
    await authRoutes(app)

    const handler = getHandler(app, '/auth/forgot-password')
    const reply = makeReply()
    const response = await handler({ body: { email: 'USER@Example.com' } }, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(response).toEqual({
      message: 'If that email exists, a reset link has been sent.',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://supabase.test/auth/v1/recover',
      expect.objectContaining({
        method: 'POST',
        headers: {
          apikey: 'anon-key', // pragma: allowlist secret
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
    )
  })
})
