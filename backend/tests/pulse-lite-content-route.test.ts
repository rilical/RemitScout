import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyRequest } from 'fastify'

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: () => () => undefined,
}))

describe('pulse lite content routes', () => {
  const mockGetEntries = vi.fn()
  const mockListByUserId = vi.fn()
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetEntries.mockReset()
    mockListByUserId.mockReset()

    app = {
      get: vi.fn(),
      delete: vi.fn(),
      post: vi.fn(),
      container: {
        pool: {},
        repositories: {
          pulseCache: {
            getEntries: mockGetEntries,
          },
          goldIndices: {
            getIndicesSeries: vi.fn(),
            getIndicesLatest: vi.fn(),
            resolveCorridorId: vi.fn(),
          },
          comparisonHistory: {
            listByUserId: mockListByUserId,
          },
        },
      },
    } as any

    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app)
  })

  it('returns cached narrative payload', async () => {
    mockGetEntries.mockImplementation(async (keys: string[]) => ([
      {
        key: keys[0],
        payload: JSON.stringify({
          summary: 'USD→INR pricing tightened this week.',
          generatedAt: '2026-01-02T00:00:00.000Z',
          source: 'rule_based',
        }),
        updated_at: new Date('2026-01-02T00:05:00.000Z'),
      },
    ]))

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/narrative')?.[2] as any

    const result = await handler({ query: {} } as Partial<FastifyRequest>)

    expect(result.summary).toBe('USD→INR pricing tightened this week.')
    expect(result.generatedAt).toBe('2026-01-02T00:00:00.000Z')
    expect(result.dataAvailable).toBe(true)
  })

  it('returns personal-history fallback when user context is missing', async () => {
    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/personal-history')?.[2] as any

    const result = await handler({ query: {} } as Partial<FastifyRequest>)

    expect(result).toEqual({
      available: false,
      message: 'Compare a corridor to unlock personalized send timing insights.',
    })
    expect(mockListByUserId).not.toHaveBeenCalled()
  })

  it('returns personal-history fallback when user has no comparison history', async () => {
    mockListByUserId.mockResolvedValue([])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/personal-history')?.[2] as any

    const result = await handler({
      query: {},
      user: { user_id: 'user-123' },
    } as Partial<FastifyRequest>)

    expect(mockListByUserId).toHaveBeenCalledWith('user-123', 1, 0)
    expect(result).toEqual({
      available: false,
      message: 'Compare a corridor to unlock personalized send timing insights.',
    })
  })
})
