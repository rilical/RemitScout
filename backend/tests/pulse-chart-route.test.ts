import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const mockGetEntries = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: () => () => undefined,
}))

vi.mock('../plane-a/src/repositories', () => ({
  PulseCacheRepository: vi.fn().mockImplementation(() => ({
    getEntries: mockGetEntries,
  })),
}))

describe('pulse chart route', () => {
  let app: FastifyInstance
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetEntries.mockClear()

    app = {
      get: vi.fn(),
    } as any

    mockRequest = {
      params: { chartId: 'all-in-cost' },
      query: {},
    }

    mockReply = {
      code: vi.fn().mockReturnThis(),
    }

    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app as FastifyInstance)
  })

  it('normalizes chart payload and stamps lastUpdated', async () => {
    const updatedAt = new Date('2025-01-01T00:00:00.000Z')
    mockGetEntries.mockResolvedValue([
      {
        key: 'pulse:chart:all-in-cost',
        payload: JSON.stringify({ series: [], insight: 'ok' }),
        updated_at: updatedAt,
      },
    ])

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/charts/:chartId')?.[2] as any

    const result = await handler(mockRequest, mockReply)

    expect(result.metadata.lastUpdated).toBe(updatedAt.toISOString())
    expect(result.series).toEqual([])
    expect(result.insight).toBe('ok')
  })
})
