import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuoteAttemptRepository = {
  listLatestAttemptsByProvider: vi.fn(),
}

const mockLatestQuoteRepository = {
  listLatestByProvider: vi.fn(),
}

const mockGetHealthCorridors = vi.hoisted(() => vi.fn())
const mockSendAdminWebhook = vi.hoisted(() => vi.fn())

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
}))

vi.mock('../shared/health-corridors', () => ({
  getHealthCorridors: (...args: unknown[]) => mockGetHealthCorridors(...args),
}))

vi.mock('../plane-a/src/services/provider-metadata', () => ({
  getProviderMetadata: () => null,
}))

vi.mock('../plane-a/src/services/admin-webhooks', () => ({
  sendAdminWebhook: (...args: unknown[]) => mockSendAdminWebhook(...args),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

const makeApp = () =>
  ({
    get: vi.fn(),
    container: {
      repositories: {
        quoteAttempt: mockQuoteAttemptRepository,
        latestQuote: mockLatestQuoteRepository,
      },
    },
  }) as unknown as FastifyInstance

describe('ops providers aggregate health route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetHealthCorridors.mockReturnValue(['US-MX-USD-MXN'])
    mockQuoteAttemptRepository.listLatestAttemptsByProvider.mockResolvedValue([])
    mockLatestQuoteRepository.listLatestByProvider.mockResolvedValue([])
  })

  it('returns provider summary and optional corridor payload', async () => {
    const app = makeApp()
    const { providerHealthRegistry, registerProvidersHealthAggregateRoute } = await import('../plane-a/src/routes/ops/provider-health')
    registerProvidersHealthAggregateRoute(app)

    const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/ops/providers/health')
    const handler = call?.[2] as ((request: any, reply: any) => Promise<any>)
    expect(handler).toBeTruthy()

    const reply = { code: vi.fn().mockReturnThis() }
    const response = await handler({ query: { include_corridors: '1' } }, reply)

    expect(response.summary.total_providers).toBe(providerHealthRegistry.length)
    expect(response.summary.include_corridors).toBe(true)
    expect(response.providers).toHaveLength(providerHealthRegistry.length)
    expect(response.providers[0]).toHaveProperty('corridors')
    expect(response.providers[0].summary).toMatchObject({
      corridor_count: 1,
    })
  })
})
