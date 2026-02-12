import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { AppError, ValidationError } from '../shared/errors'

const mockGetRateRecord = vi.fn()
const mockGetHistory = vi.fn()
const mockGetLatestHistory = vi.fn()
const mockEnqueueRequest = vi.fn()
const mockListLatestByCurrencyPair = vi.fn()

vi.mock('../plane-a/src/container', () => ({
  planeAContainer: {
    repositories: {
      fxRate: { getRateRecord: (...args: any[]) => mockGetRateRecord(...args) },
      fxRateHistory: {
        getHistory: (...args: any[]) => mockGetHistory(...args),
        getLatestHistory: (...args: any[]) => mockGetLatestHistory(...args),
      },
      fxRateRefresh: { enqueueRequest: (...args: any[]) => mockEnqueueRequest(...args) },
      latestQuote: { listLatestByCurrencyPair: (...args: any[]) => mockListLatestByCurrencyPair(...args) },
    },
  },
}))

const makeApp = () => ({ get: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('rates route', () => {
  it('validates spot query params', async () => {
    const app = makeApp()
    const { ratesRoutes } = await import('../plane-a/src/routes/rates')
    await ratesRoutes(app)

    const handler = getHandler(app, '/rates/spot')
    await expect(handler({ query: { base: 'US' } }, {} as any)).rejects.toBeInstanceOf(ValidationError)
  })

  it('returns not found when spot rate is unavailable', async () => {
    mockGetRateRecord.mockResolvedValue(null)

    const app = makeApp()
    const { ratesRoutes } = await import('../plane-a/src/routes/rates')
    await ratesRoutes(app)

    const handler = getHandler(app, '/rates/spot')
    await expect(handler({ query: { base: 'USD', quote: 'MXN' } }, {} as any)).rejects.toBeInstanceOf(AppError)
  })
})
