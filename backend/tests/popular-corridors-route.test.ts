import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as businessMetrics from '../shared/business-metrics'

const mockListPopularCorridors = vi.fn()

vi.mock('../shared/business-metrics', () => ({
  recordSearch: vi.fn(),
}))

vi.mock('../plane-a/src/repositories', () => ({
  PopularCorridorRepository: vi.fn().mockImplementation(() => ({
    listPopularCorridors: mockListPopularCorridors,
  })),
}))

describe('popular-corridors route', () => {
  let app: FastifyInstance
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockListPopularCorridors.mockClear()

    mockRequest = {
      headers: {},
      query: {},
    }

    mockReply = {
      code: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
    }

    app = {
      get: vi.fn(),
    } as any

    const { popularCorridorsRoutes } = await import('../plane-a/src/routes/popular-corridors')
    await popularCorridorsRoutes(app as FastifyInstance)
  })

  it('returns popular corridors successfully', async () => {
    const mockCorridors = [
      {
        route: 'US-MX',
        count_24h: 100,
        top_provider: 'remitly',
        fee_range: '$0-5',
        speed_range: '1-2 days',
        best_for: 'low fees',
        updated_at: new Date('2024-01-01'),
      },
    ]

    mockListPopularCorridors.mockResolvedValue(mockCorridors)

    const handler = vi.mocked(app.get).mock.calls[0][1] as any
    const result = await handler(mockRequest, mockReply)

    expect(mockListPopularCorridors).toHaveBeenCalled()
    expect(mockReply.code).not.toHaveBeenCalledWith(500)
    expect(mockReply.header).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age=60'))
    expect(mockReply.header).toHaveBeenCalledWith('ETag', expect.any(String))
    expect(result.success).toBe(true)
  })

  it('transforms corridors to frontend format', async () => {
    const mockCorridors = [
      {
        route: 'US-MX',
        count_24h: 100,
        top_provider: 'remitly',
        fee_range: '$0-5',
        speed_range: '1-2 days',
        best_for: 'low fees',
        updated_at: new Date('2024-01-01'),
      },
    ]

    mockListPopularCorridors.mockResolvedValue(mockCorridors)

    const handler = vi.mocked(app.get).mock.calls[0][1] as any
    const result = await handler(mockRequest, mockReply)

    expect(result.data).toEqual([
      {
        route: 'US-MX',
        count24h: 100,
        topProvider: 'remitly',
        feeRange: '$0-5',
        speedRange: '1-2 days',
        bestFor: 'low fees',
      },
    ])
    expect(result.corridors).toEqual(result.data)
  })

  it('handles cache hit with If-None-Match header', async () => {
    const mockCorridors = [
      {
        route: 'US-MX',
        count_24h: 100,
        top_provider: 'remitly',
        fee_range: '$0-5',
        speed_range: '1-2 days',
        best_for: 'low fees',
        updated_at: new Date('2024-01-01'),
      },
    ]

    mockListPopularCorridors.mockResolvedValue(mockCorridors)

    const handler = vi.mocked(app.get).mock.calls[0][1] as any

    await handler(mockRequest, mockReply)
    const etag = vi.mocked(mockReply.header).mock.calls.find(
      (call) => call[0] === 'ETag',
    )?.[1] as string

    vi.clearAllMocks()
    mockRequest.headers = { 'if-none-match': etag }
    mockListPopularCorridors.mockResolvedValue(mockCorridors)

    const secondResult = await handler(mockRequest, mockReply)

    expect(mockReply.code).toHaveBeenCalledWith(304)
    expect(secondResult).toBe('')
  })

  it('handles invalid response from repository', async () => {
    mockListPopularCorridors.mockResolvedValue(null as any)

    const handler = vi.mocked(app.get).mock.calls[0][1] as any
    const result = await handler(mockRequest, mockReply)

    expect(mockReply.code).toHaveBeenCalledWith(500)
    expect(result.error).toBe('internal_error')
  })

  it('handles repository errors', async () => {
    mockListPopularCorridors.mockRejectedValue(new Error('Database error'))

    const handler = vi.mocked(app.get).mock.calls[0][1] as any
    const result = await handler(mockRequest, mockReply)

    expect(mockReply.code).toHaveBeenCalledWith(500)
    expect(result.error).toBe('internal_error')
  })

  it('records search metrics', async () => {
    const mockCorridors = [
      {
        route: 'US-MX',
        count_24h: 100,
        top_provider: 'remitly',
        fee_range: '$0-5',
        speed_range: '1-2 days',
        best_for: 'low fees',
        updated_at: new Date('2024-01-01'),
      },
    ]

    mockListPopularCorridors.mockResolvedValue(mockCorridors)

    const handler = vi.mocked(app.get).mock.calls[0][1] as any
    await handler(mockRequest, mockReply)

    expect(businessMetrics.recordSearch).toHaveBeenCalledWith('popular', 'corridors')
  })

  it('handles empty corridors list', async () => {
    mockListPopularCorridors.mockResolvedValue([])

    const handler = vi.mocked(app.get).mock.calls[0][1] as any
    const result = await handler(mockRequest, mockReply)

    expect(result.count).toBe(0)
    expect(result.data).toEqual([])
  })

  it('handles metrics recording errors gracefully', async () => {
    vi.mocked(businessMetrics.recordSearch).mockImplementation(() => {
      throw new Error('Metrics error')
    })

    const mockCorridors = [
      {
        route: 'US-MX',
        count_24h: 100,
        top_provider: 'remitly',
        fee_range: '$0-5',
        speed_range: '1-2 days',
        best_for: 'low fees',
        updated_at: new Date('2024-01-01'),
      },
    ]

    mockListPopularCorridors.mockResolvedValue(mockCorridors)

    const handler = vi.mocked(app.get).mock.calls[0][1] as any

    await expect(handler(mockRequest, mockReply)).resolves.not.toThrow()
  })
})

