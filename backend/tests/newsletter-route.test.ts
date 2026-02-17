import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockFindByEmail = vi.fn()
const mockUpdatePendingTokens = vi.fn()
const mockCreatePending = vi.fn()
const mockSendConfirmationEmail = vi.fn()
const mockSendWelcomeEmail = vi.fn()
const mockFindByVerifyTokenHash = vi.fn()
const mockFindByUnsubscribeTokenHash = vi.fn()
const mockActivate = vi.fn()
const mockUnsubscribe = vi.fn()
const mockCheckRateLimit = vi.fn()
const mockPoolQuery = vi.fn()

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}))

vi.mock('../shared/config', () => ({
  config: {
    newsletter: {
      tokenExpiryHours: 24,
      baseUrl: 'https://app.remitscout.test',
      welcomeEnabled: false,
    },
    billing: {
      stripe: {
        frontendBaseUrl: 'https://app.remitscout.test',
      },
    },
  },
}))

vi.mock('../plane-a/src/container', () => ({
  planeAContainer: {
    pool: {
      query: (...args: any[]) => mockPoolQuery(...args),
    },
    repositories: {
      newsletter: {
        findByEmail: (...args: any[]) => mockFindByEmail(...args),
        updatePendingTokens: (...args: any[]) => mockUpdatePendingTokens(...args),
        createPending: (...args: any[]) => mockCreatePending(...args),
        findByVerifyTokenHash: (...args: any[]) => mockFindByVerifyTokenHash(...args),
        findByUnsubscribeTokenHash: (...args: any[]) => mockFindByUnsubscribeTokenHash(...args),
        activate: (...args: any[]) => mockActivate(...args),
        unsubscribe: (...args: any[]) => mockUnsubscribe(...args),
      },
    },
  },
}))

vi.mock('../plane-a/src/services/newsletter-email', () => ({
  sendConfirmationEmail: (...args: any[]) => mockSendConfirmationEmail(...args),
  sendWelcomeEmail: (...args: any[]) => mockSendWelcomeEmail(...args),
}))

vi.mock('../plane-a/src/utils/rate-limit', () => ({
  buildRateLimitKey: () => 'newsletter:key',
  checkRateLimit: (...args: any[]) => mockCheckRateLimit(...args),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: () => ({ ip: '127.0.0.1' }),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

const makeApp = () => ({
  container: {
    pool: {
      query: (...args: any[]) => mockPoolQuery(...args),
    },
    repositories: {
      newsletter: {
        findByEmail: (...args: any[]) => mockFindByEmail(...args),
        updatePendingTokens: (...args: any[]) => mockUpdatePendingTokens(...args),
        createPending: (...args: any[]) => mockCreatePending(...args),
        findByVerifyTokenHash: (...args: any[]) => mockFindByVerifyTokenHash(...args),
        findByUnsubscribeTokenHash: (...args: any[]) => mockFindByUnsubscribeTokenHash(...args),
        activate: (...args: any[]) => mockActivate(...args),
        unsubscribe: (...args: any[]) => mockUnsubscribe(...args),
      },
    },
  },
  get: vi.fn(),
  post: vi.fn(),
}) as unknown as FastifyInstance

const getHandler = (
  app: FastifyInstance,
  method: 'get' | 'post',
  url: string,
) => {
  const call = vi.mocked(app[method]).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

const makeReply = () => ({
  code: vi.fn().mockReturnThis(),
  type: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
  redirect: vi.fn().mockReturnValue({ redirected: true }),
})

describe('newsletter route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPoolQuery.mockResolvedValue({ rowCount: 0 })
    mockCheckRateLimit.mockResolvedValue(false)
    mockFindByEmail.mockResolvedValue(null)
    mockSendConfirmationEmail.mockResolvedValue(undefined)
  })

  it('returns 400 for invalid subscribe payload', async () => {
    const app = makeApp()
    const { newsletterRoutes } = await import('../plane-a/src/routes/newsletter')
    await newsletterRoutes(app)

    const handler = getHandler(app, 'post', '/newsletter/subscribe')
    const reply = makeReply()
    await expect(handler({ body: {} }, reply)).rejects.toMatchObject({
      code: 'validation_error',
      statusCode: 400,
    })
  })

  it('returns 429 when subscribe rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValue(true)

    const app = makeApp()
    const { newsletterRoutes } = await import('../plane-a/src/routes/newsletter')
    await newsletterRoutes(app)

    const handler = getHandler(app, 'post', '/newsletter/subscribe')
    const reply = makeReply()
    await expect(handler({ body: { email: 'a@test.com' } }, reply)).rejects.toMatchObject({
      code: 'rate_limited',
      statusCode: 429,
    })
  })

  it('returns pending on successful subscribe', async () => {
    const app = makeApp()
    const { newsletterRoutes } = await import('../plane-a/src/routes/newsletter')
    await newsletterRoutes(app)

    const handler = getHandler(app, 'post', '/newsletter/subscribe')
    const reply = makeReply()
    const response = await handler({ body: { email: 'a@test.com', source: 'Landing' } }, reply)

    expect(mockCreatePending).toHaveBeenCalled()
    expect(mockSendConfirmationEmail).toHaveBeenCalled()
    expect(response).toMatchObject({ success: true, status: 'pending' })
  })

  it('returns 400 for invalid status query', async () => {
    const app = makeApp()
    const { newsletterRoutes } = await import('../plane-a/src/routes/newsletter')
    await newsletterRoutes(app)

    const handler = getHandler(app, 'get', '/newsletter/status')
    const reply = makeReply()
    await expect(handler({ query: {} }, reply)).rejects.toMatchObject({
      code: 'validation_error',
      statusCode: 400,
    })
  })
})
