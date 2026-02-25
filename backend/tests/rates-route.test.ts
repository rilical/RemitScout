import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { AppError, ValidationError } from '../shared/errors'

const mockGetRateRecord = vi.fn()
const mockGetHistory = vi.fn()
const mockGetLatestHistory = vi.fn()
const mockEnqueueRequest = vi.fn()
const mockGetLatestRequestByPair = vi.fn()
const mockListLatestByCurrencyPair = vi.fn()

const makeApp = () => ({
  get: vi.fn(),
  container: {
    repositories: {
      fxRate: { getRateRecord: (...args: any[]) => mockGetRateRecord(...args) },
      fxRateHistory: {
        getHistory: (...args: any[]) => mockGetHistory(...args),
        getLatestHistory: (...args: any[]) => mockGetLatestHistory(...args),
      },
      fxRateRefresh: {
        enqueueRequest: (...args: any[]) => mockEnqueueRequest(...args),
        getLatestRequestByPair: (...args: any[]) => mockGetLatestRequestByPair(...args),
      },
      latestQuote: { listLatestByCurrencyPair: (...args: any[]) => mockListLatestByCurrencyPair(...args) },
    },
  },
}) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

process.env.FX_RATE_REFRESH_ENABLED = '1'

describe('rates route', () => {
  const loadHandlers = async () => {
    const app = makeApp()
    const { ratesRoutes } = await import('../plane-a/src/routes/rates')
    await ratesRoutes(app)
    return {
      spot: getHandler(app, '/rates/spot'),
      history: getHandler(app, '/rates/history'),
    }
  }

  const historyRow = (date: string, rate: number) => ({
    base_currency: 'BASE',
    quote_currency: 'QUOTE',
    rate,
    bid: null,
    ask: null,
    rate_date: date,
    source: 'OANDA',
    created_at: `${date}T00:00:00.000Z`,
  })

  it('validates spot query params', async () => {
    vi.clearAllMocks()
    const { spot: handler } = await loadHandlers()
    await expect(handler({ query: { base: 'US' } }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('returns not found when spot rate is unavailable', async () => {
    vi.clearAllMocks()
    mockGetRateRecord.mockResolvedValue(null)

    const { spot: handler } = await loadHandlers()
    await expect(handler({ query: { base: 'USD', quote: 'MXN' } }, {} as any)).rejects.toBeInstanceOf(AppError)
  })

  it('returns direct history with ready status and non-derived metadata', async () => {
    vi.clearAllMocks()
    mockGetRateRecord.mockResolvedValue({
      base_currency: 'ALL',
      quote_currency: 'DZD',
      rate: 14.91,
      bid: null,
      ask: null,
      source: 'OANDA',
      last_updated: new Date('2026-02-25T10:00:00.000Z'),
      updated_at: new Date('2026-02-25T10:00:00.000Z'),
    })
    mockGetLatestHistory.mockResolvedValue([
      historyRow('2026-02-24', 14.85),
      historyRow('2026-02-25', 14.91),
    ])
    mockEnqueueRequest.mockResolvedValue(null)

    const { history: handler } = await loadHandlers()
    const response = await handler({ query: { base: 'all', quote: 'dzd', days: 7 } }, {} as any)

    expect(response.status).toBe('ready')
    expect(response.derived).toBe(false)
    expect(response.bridgeCurrency).toBeNull()
    expect(response.history).toHaveLength(2)
    expect(response.history[1].rate).toBe(14.91)
  })

  it('derives history through USD bridge when direct pair is unavailable', async () => {
    vi.clearAllMocks()
    mockGetRateRecord.mockResolvedValue(null)
    mockGetLatestHistory.mockImplementation(async (base: string, quote: string) => {
      if (base === 'ALL' && quote === 'DZD') return []
      if (base === 'ALL' && quote === 'USD') {
        return [historyRow('2026-02-24', 0.0100), historyRow('2026-02-25', 0.0102)]
      }
      if (base === 'USD' && quote === 'DZD') {
        return [historyRow('2026-02-25', 146.8)]
      }
      return []
    })

    const { history: handler } = await loadHandlers()
    const response = await handler({ query: { base: 'ALL', quote: 'DZD', days: 7 } }, {} as any)

    expect(response.status).toBe('ready')
    expect(response.derived).toBe(true)
    expect(response.bridgeCurrency).toBe('USD')
    expect(response.refreshQueued).toBe(false)
    expect(response.history).toHaveLength(1)
    expect(response.history[0].source).toBe('DERIVED_USD_BRIDGE')
    expect(response.history[0].rate).toBeCloseTo(1.49736, 6)
  })

  it('falls back to EUR bridge when USD bridge data is missing', async () => {
    vi.clearAllMocks()
    mockGetRateRecord.mockResolvedValue(null)
    mockGetLatestHistory.mockImplementation(async (base: string, quote: string) => {
      if (base === 'ALL' && quote === 'DZD') return []
      if (base === 'ALL' && quote === 'USD') return []
      if (base === 'USD' && quote === 'DZD') return []
      if (base === 'ALL' && quote === 'EUR') {
        return [historyRow('2026-02-25', 0.0095)]
      }
      if (base === 'EUR' && quote === 'DZD') {
        return [historyRow('2026-02-25', 157.1)]
      }
      return []
    })

    const { history: handler } = await loadHandlers()
    const response = await handler({ query: { base: 'ALL', quote: 'DZD', days: 7 } }, {} as any)

    expect(response.status).toBe('ready')
    expect(response.derived).toBe(true)
    expect(response.bridgeCurrency).toBe('EUR')
    expect(response.history[0].source).toBe('DERIVED_EUR_BRIDGE')
    expect(response.history[0].rate).toBeCloseTo(1.49245, 6)
  })

  it('returns unavailable when recent exhausted refresh failure exists', async () => {
    vi.clearAllMocks()
    mockGetRateRecord.mockResolvedValue(null)
    mockGetLatestHistory.mockResolvedValue([])
    mockGetLatestRequestByPair.mockResolvedValue({
      requestId: 'req-exhausted',
      status: 'failed',
      retryCount: 3,
      processedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      lastRequestedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      errorMessage: 'unsupported_pair',
    })

    const { history: handler } = await loadHandlers()
    const response = await handler({ query: { base: 'ALL', quote: 'DZD', days: 7 } }, {} as any)

    expect(response.status).toBe('unavailable')
    expect(response.refreshQueued).toBe(false)
    expect(response.refreshRequestId).toBeNull()
    expect(mockEnqueueRequest).not.toHaveBeenCalled()
  })

  it('returns warming and enqueues refresh when no recent exhausted failure exists', async () => {
    vi.clearAllMocks()
    mockGetRateRecord.mockResolvedValue(null)
    mockGetLatestHistory.mockResolvedValue([])
    mockGetLatestRequestByPair.mockResolvedValue(null)
    mockEnqueueRequest.mockResolvedValue('req-123')

    const { history: handler } = await loadHandlers()
    const response = await handler({ query: { base: 'ALL', quote: 'DZD', days: 7 } }, {} as any)

    expect(response.status).toBe('warming')
    expect(response.refreshQueued).toBe(true)
    expect(response.refreshRequestId).toBe('req-123')
    expect(mockEnqueueRequest).toHaveBeenCalledTimes(1)
  })
})
