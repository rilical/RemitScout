import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const mockListByUserId = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn(),
}))

vi.mock('../shared/config', () => ({
  config: {
    db: {
      planeAUrl: '',
    },
  },
}))

vi.mock('../plane-a/src/repositories', () => ({
  ComparisonHistoryRepository: vi.fn().mockImplementation(() => ({
    listByUserId: mockListByUserId,
  })),
}))

describe('history recent route', () => {
  let app: FastifyInstance
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()

    app = {
      get: vi.fn(),
      post: vi.fn(),
    } as any

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }

    const { historyRoutes } = await import('../plane-a/src/routes/history')
    await historyRoutes(app as FastifyInstance)
  })

  it('returns latest comparison history records', async () => {
    mockListByUserId.mockResolvedValue([
      {
        id: 'h1',
        user_id: 'u1',
        from_country: 'US',
        to_country: 'PH',
        amount: 500,
        method: 'bank',
        path: '/send-money/united-states-to-philippines',
        created_at: new Date('2026-02-09T00:00:00.000Z'),
      },
    ])

    const call = vi.mocked(app.get).mock.calls.find((c) => c[0] === '/history/recent')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1' },
      query: { limit: '1' },
    } as Partial<FastifyRequest>

    const result = await handler(request, mockReply)

    expect(mockListByUserId).toHaveBeenCalledWith('u1', 1, 0)
    expect(result.success).toBe(true)
    expect(result.records[0]).toMatchObject({
      id: 'h1',
      from_country: 'US',
      to_country: 'PH',
      amount: 500,
      method: 'bank',
    })
  })
})

