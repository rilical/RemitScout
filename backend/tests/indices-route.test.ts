import { describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { ValidationError } from '../shared/errors'

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn().mockResolvedValue({ rows: [{ count: 0 }] }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireEntitlement: () => () => undefined,
}))

vi.mock('../plane-a/src/repositories', () => ({
  GoldIndicesRepository: vi.fn().mockImplementation(() => ({
    getAvailability: vi.fn().mockResolvedValue(null),
    getIndicesSeries: vi.fn().mockResolvedValue([]),
    getIndicesLatest: vi.fn().mockResolvedValue(null),
  })),
}))

const makeApp = () => ({ get: vi.fn() }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as ((request: any, reply: any) => Promise<any>)
}

describe('indices route', () => {
  it('validates corridor id format', async () => {
    const app = makeApp()
    const { indicesRoutes } = await import('../plane-a/src/routes/indices')
    await indicesRoutes(app)

    const handler = getHandler(app, '/indices/series')
    await expect(
      handler({ query: { corridor_id: 'BAD', amount_bucket: 500, method_profile: 'standard_bank' } }, { header: vi.fn(), code: vi.fn() }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
