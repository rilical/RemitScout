import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const mockQuery = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: mockQuery,
}))

vi.mock('../shared/config', () => ({
  config: {
    db: {
      planeAUrl: '',
    },
  },
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => () => undefined,
}))

const mockRenderPdf = vi.fn().mockResolvedValue(Buffer.from('pdf-bytes'))
vi.mock('../scripts/export-generators', () => ({
  renderPdf: mockRenderPdf,
}))

describe('gold exports admin download route', () => {
  type ExportRouteHandler = (
    request: FastifyRequest<{ Querystring: Record<string, unknown> }>,
    reply: FastifyReply,
  ) => Promise<unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeApp = () => ({
    get: vi.fn(),
    post: vi.fn(),
  }) as unknown as FastifyInstance

  const getExportHandler = (app: FastifyInstance) => {
    const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === '/ops/gold/exports/cdp-daily/export')
    return call?.[2] as ExportRouteHandler
  }

  const mockReply = () => {
    const reply: { header: ReturnType<typeof vi.fn>; code: ReturnType<typeof vi.fn> } = {
      header: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
    }
    return reply
  }

  const sampleExportRows = [
    {
      date: '2026-02-14',
      corridor_id: 'US-MX-USD-MXN',
      from_country: 'US',
      to_country: 'MX',
      from_currency: 'USD',
      to_currency: 'MXN',
      amount_bucket: 500,
      method_profile: 'standard_bank',
      teer_rate: 19.45,
      rci_ratio: 0.025,
      rvi_bps: 12.2,
      mid_market_rate: 19.73,
      provider_count: 11,
      provider_count_binned: 10,
      rci_median_bps: 180,
      rci_p10_bps: 150,
      rci_p90_bps: 230,
      dispersion_bps: 2,
      volatility_7d: 0.8,
      weight_confidence: 0.91,
      weight_window_days: 30,
      weighting_model: 'market_depth',
      methodology_version: 'v1',
      pipeline_version: 'p1',
      suppression_flag: false,
      suppression_reason: null,
      created_at: new Date('2026-02-14T00:00:00.000Z'),
    },
  ]

  it('exports snapshot as CSV', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: sampleExportRows })

    const app = makeApp()
    const { goldExportsRoutes } = await import('../plane-a/src/routes/ops/gold-exports')
    await goldExportsRoutes(app)

    const handler = getExportHandler(app)
    const reply = mockReply()

    const response = await handler(
      {
        query: {
          amount_bucket: 500,
          method_profile: 'standard_bank',
          date: '2026-02-14',
          format: 'csv',
        },
      },
      reply,
    )

    expect(typeof response).toBe('string')
    expect(response).toContain('date,corridor_id')
    expect(response).toContain('US-MX-USD-MXN')
    expect(response).toContain('19.45')
    expect(vi.mocked(reply.header)).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(vi.mocked(reply.header)).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="gold-exports-2026-02-14-standard_bank-500.csv"',
    )
  })

  it('exports snapshot as PDF', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: sampleExportRows })

    const app = makeApp()
    const { goldExportsRoutes } = await import('../plane-a/src/routes/ops/gold-exports')
    await goldExportsRoutes(app)

    const handler = getExportHandler(app)
    const reply = mockReply()

    const response = await handler(
      {
        query: {
          amount_bucket: 500,
          method_profile: 'standard_bank',
          date: '2026-02-14',
          format: 'pdf',
        },
      },
      reply,
    )

    expect(response).toBeInstanceOf(Buffer)
    expect(response?.toString()).toBe('pdf-bytes')
    expect(mockRenderPdf).toHaveBeenCalled()
    expect(vi.mocked(reply.header)).toHaveBeenCalledWith('Content-Type', 'application/pdf')
    expect(vi.mocked(reply.header)).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="gold-exports-2026-02-14-standard_bank-500.pdf"',
    )
  })
})
