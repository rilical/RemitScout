import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyRequest } from 'fastify'

const mockGetEntries = vi.fn()
const mockGetIndicesLatest = vi.fn()
const mockResolveCorridorId = vi.fn()

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: () => () => undefined,
}))

describe('pulse overview route', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    mockGetEntries.mockReset()
    mockGetIndicesLatest.mockReset()
    mockResolveCorridorId.mockReset()
    mockGetEntries.mockResolvedValue([])

    app = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      container: {
        pool: {},
        repositories: {
          pulseCache: {
            getEntries: mockGetEntries,
          },
          goldIndices: {
            getIndicesSeries: vi.fn(),
            getIndicesLatest: mockGetIndicesLatest,
            resolveCorridorId: mockResolveCorridorId,
          },
          comparisonHistory: {
            listByUserId: vi.fn(),
          },
        },
      },
    } as any

    const { pulseRoutes } = await import('../plane-a/src/routes/pulse')
    await pulseRoutes(app)
  })

  it('populates overview with an RCI hero tile when Gold indices are available', async () => {
    mockGetIndicesLatest.mockResolvedValue({
      rci_ratio: 0.018,
      suppression_flag: false,
      provider_count: 6,
      method_profile: 'standard_bank',
    })

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/overview')?.[2] as any

    const result = await handler({
      query: {
        corridor: 'usd-php',
        corridor_id: 'US-PH-USD-PHP',
      },
    } as Partial<FastifyRequest>)

    const rciTile = result.tiles.find((tile: any) => tile.id === 'indices-rci')
    expect(rciTile).toMatchObject({
      id: 'indices-rci',
      label: 'RCI',
      value: '1.80%',
      delta: '6 providers',
      deltaType: 'neutral',
      deltaLabel: 'bank',
    })
    expect(mockGetIndicesLatest).toHaveBeenCalledWith({
      corridorId: 'US-PH-USD-PHP',
      amountBucket: 500,
      methodProfile: 'standard_bank',
    })
  })

  it('falls back the RCI tile to pending when no Gold row is found', async () => {
    mockGetIndicesLatest.mockResolvedValue(null)

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/overview')?.[2] as any

    const result = await handler({
      query: {
        corridor: 'usd-php',
        corridor_id: 'US-PH-USD-PHP',
      },
    } as Partial<FastifyRequest>)

    const rciTile = result.tiles.find((tile: any) => tile.id === 'indices-rci')
    expect(rciTile).toMatchObject({
      id: 'indices-rci',
      value: '—',
      delta: 'Data pending',
      deltaType: 'neutral',
      deltaLabel: 'bank',
    })
  })

  it('shows RCI value when export-suppressed but display-eligible (>=2 providers)', async () => {
    mockGetIndicesLatest.mockResolvedValue({
      rci_ratio: 0.024,
      suppression_flag: true,
      provider_count: 2,
      method_profile: 'standard_bank',
    })

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/overview')?.[2] as any

    const result = await handler({
      query: {
        corridor: 'usd-php',
        corridor_id: 'US-PH-USD-PHP',
      },
    } as Partial<FastifyRequest>)

    const rciTile = result.tiles.find((tile: any) => tile.id === 'indices-rci')
    expect(rciTile).toMatchObject({
      id: 'indices-rci',
      value: '2.40%',
      delta: '2 providers',
      deltaType: 'neutral',
      deltaLabel: 'bank',
    })
  })

  it('shows suppressed status when below display threshold (<2 providers)', async () => {
    mockGetIndicesLatest.mockResolvedValue({
      rci_ratio: 0.024,
      suppression_flag: true,
      provider_count: 1,
      method_profile: 'standard_bank',
    })

    const handler = vi
      .mocked(app.get)
      .mock.calls.find((call) => call[0] === '/pulse/overview')?.[2] as any

    const result = await handler({
      query: {
        corridor: 'usd-php',
        corridor_id: 'US-PH-USD-PHP',
      },
    } as Partial<FastifyRequest>)

    const rciTile = result.tiles.find((tile: any) => tile.id === 'indices-rci')
    expect(rciTile).toMatchObject({
      id: 'indices-rci',
      value: '—',
      delta: 'Suppressed',
      deltaType: 'negative',
      deltaLabel: 'bank',
    })
  })
})
