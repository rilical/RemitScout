import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockCreateOrUpdateSession = vi.fn()
const mockRecordOutboundClick = vi.fn()
const mockRecordProviderVisit = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../shared/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue(null),
}))

vi.mock('../plane-a/src/repositories', () => ({
  TelemetryRepository: vi.fn().mockImplementation(() => ({
    createOrUpdateSession: mockCreateOrUpdateSession,
    recordOutboundClick: mockRecordOutboundClick,
    recordProviderVisit: mockRecordProviderVisit,
    getAnalyticsAggregate: vi.fn(),
  })),
  UserAccountRepository: vi.fn().mockImplementation(() => ({
    getPrivacySettings: vi.fn().mockResolvedValue({ analytics_enabled: true, updated_at: new Date().toISOString() }),
  })),
}))

describe('telemetry click route', () => {
  let app: FastifyInstance
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockCreateOrUpdateSession.mockResolvedValue({
      session_id: 'session-12345678',
      anon_id: null,
      last_activity: new Date(),
    })

    app = {
      post: vi.fn(),
      get: vi.fn(),
      container: {
        pool: {},
        repositories: {
          telemetry: {
            createOrUpdateSession: mockCreateOrUpdateSession,
            recordOutboundClick: mockRecordOutboundClick,
            recordProviderVisit: mockRecordProviderVisit,
            recordSearchEvent: vi.fn(),
            recordConversionEvent: vi.fn(),
            getAnalyticsAggregate: vi.fn(),
          },
          userAccount: {
            getPrivacySettings: vi.fn().mockResolvedValue({ analytics_enabled: true, updated_at: new Date().toISOString() }),
          },
        },
      },
    } as any

    mockRequest = {
      body: {
        session_id: 'session-12345678',
        provider_id: 'wise',
        target_url: 'https://example.com/visit?ref=123',
        is_affiliate: true,
        quoted_rate: 56.12,
        quoted_fee: 3.5,
      },
      user: { user_id: 'user-1' } as any,
    }

    mockReply = {
      code: vi.fn().mockReturnThis(),
    }

    const { telemetryRoutes } = await import('../plane-a/src/routes/telemetry')
    await telemetryRoutes(app as FastifyInstance)
  })

  it('records affiliate clicks with sanitized urls', async () => {
    const call = vi
      .mocked(app.post)
      .mock.calls.find((call) => call[0] === '/telemetry/click')
    const handler = (call?.[2] ?? call?.[1]) as any

    const result = await handler(mockRequest, mockReply)

    expect(result).toEqual({ success: true })
    expect(mockRecordOutboundClick).toHaveBeenCalledWith(
      expect.objectContaining({
        provider_id: 'wise',
        target_url: 'https://example.com/visit',
        is_affiliate: true,
      }),
    )
    expect(mockRecordProviderVisit).toHaveBeenCalled()
  })

  it('throws validation error for malformed click payload', async () => {
    const call = vi
      .mocked(app.post)
      .mock.calls.find((entry) => entry[0] === '/telemetry/click')
    const handler = (call?.[2] ?? call?.[1]) as any

    const invalidRequest = handler(
      {
        body: {},
        user: { user_id: 'user-1' } as any,
      } as Partial<FastifyRequest>,
      mockReply,
    )

    await expect(invalidRequest).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidRequest).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })
})
