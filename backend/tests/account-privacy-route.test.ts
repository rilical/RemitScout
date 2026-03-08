import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ValidationError } from '../shared/errors'

const mockUpsertUserAccount = vi.fn()
const mockGetPrivacySettings = vi.fn()
const mockUpdatePrivacySettings = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../plane-a/src/repositories', async () => {
  const actual = await vi.importActual<typeof import('../plane-a/src/repositories')>(
    '../plane-a/src/repositories',
  )
  return {
    ...actual,
    DailyUsageCounterRepository: vi.fn().mockImplementation(() => ({
      incrementAndGet: vi.fn().mockResolvedValue(0),
      getCount: vi.fn().mockResolvedValue(0),
    })),
    UserAccountRepository: vi.fn().mockImplementation(() => ({
      upsertUserAccount: mockUpsertUserAccount,
      getPrivacySettings: mockGetPrivacySettings,
      updatePrivacySettings: mockUpdatePrivacySettings,
    })),
  }
})

describe('account privacy routes', () => {
  let app: FastifyInstance
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockUpsertUserAccount.mockResolvedValue(undefined)

    app = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      container: {
        pool: {},
        repositories: {
          userAccount: {
            upsertUserAccount: mockUpsertUserAccount,
            getPrivacySettings: mockGetPrivacySettings,
            updatePrivacySettings: mockUpdatePrivacySettings,
          },
        },
      },
    } as any

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }

    const { accountRoutes } = await import('../plane-a/src/routes/account')
    await accountRoutes(app as FastifyInstance)
  })

  it('fails closed when updated_at is null', async () => {
    mockGetPrivacySettings.mockResolvedValue({
      analytics_enabled: true,
      marketing_enabled: true,
      personalization_enabled: true,
      updated_at: null,
    })

    const call = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/account/privacy')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', email: 'u@test.com' },
    } as Partial<FastifyRequest>

    const result = await handler(request, mockReply)

    expect(result).toEqual({
      settings: {
        analytics: false,
        marketing: false,
        personalization: false,
        updated_at: null,
      },
    })
  })

  it('returns stored settings when updated_at is set', async () => {
    mockGetPrivacySettings.mockResolvedValue({
      analytics_enabled: false,
      marketing_enabled: true,
      personalization_enabled: false,
      updated_at: '2026-02-09T00:00:00.000Z',
    })

    const call = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/account/privacy')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', email: 'u@test.com' },
    } as Partial<FastifyRequest>

    const result = await handler(request, mockReply)

    expect(result).toEqual({
      settings: {
        analytics: false,
        marketing: true,
        personalization: false,
        updated_at: '2026-02-09T00:00:00.000Z',
      },
    })
  })

  it('preserves marketing when omitted from PUT payload', async () => {
    mockUpdatePrivacySettings.mockResolvedValue({
      analytics_enabled: true,
      marketing_enabled: true,
      personalization_enabled: false,
      updated_at: '2026-02-09T00:00:00.000Z',
    })

    const call = vi.mocked(app.put).mock.calls.find((c) => c[0] === '/account/privacy')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', email: 'u@test.com' },
      body: { analytics: true, personalization: false },
    } as Partial<FastifyRequest>

    const result = await handler(request, mockReply)

    expect(mockUpdatePrivacySettings).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        analytics_enabled: true,
        personalization_enabled: false,
        marketing_enabled: undefined,
      }),
    )
    expect(result.settings.marketing).toBe(true)
  })

  it('throws validation error when privacy payload is invalid', async () => {
    const call = vi.mocked(app.put).mock.calls.find((c) => c[0] === '/account/privacy')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', email: 'u@test.com' },
      body: { analytics: 'yes' },
    } as Partial<FastifyRequest>

    const invalidRequest = handler(request, mockReply)
    await expect(invalidRequest).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidRequest).rejects.toMatchObject({
      statusCode: 400,
      code: 'validation_error',
    })
  })
})
