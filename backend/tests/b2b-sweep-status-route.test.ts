import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'

const mockQuery = vi.hoisted(() => vi.fn())

vi.mock('../shared/config', () => ({
  config: {
    db: {
      planeAUrl: 'postgres://localhost:5432/remit',
    },
    env: 'development',
    envName: 'dev',
    planeB: {
      disableTier1: false,
    },
  },
}))

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: (...args: unknown[]) => mockQuery(...args),
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('../plane-a/src/plugins/auth-plugin', () => ({
  requireAdmin: () => {
    const handler = () => undefined
    ;(handler as { __guardTag?: string }).__guardTag = 'requireAdmin'
    return handler
  },
  requireSuperAdmin: () => {
    const handler = () => undefined
    ;(handler as { __guardTag?: string }).__guardTag = 'requireSuperAdmin'
    return handler
  },
}))

type RouteHandler = (request: Record<string, unknown>, reply: { code: (status: number) => unknown }) => Promise<unknown>

const makeApp = () =>
  ({
    get: vi.fn(),
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, url: string) => {
  const call = vi.mocked(app.get).mock.calls.find((entry) => entry[0] === url)
  return call?.[call.length - 1] as RouteHandler
}

describe('/ops/b2b-sweep-status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('derives schedule drift from completed runs instead of the schedule table', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            priority_tier: 'tier_1',
            status: 'running',
            cadence_minutes: 10,
            target_minutes: 10,
            observation_mode: false,
            corridors_total: 12,
            providers_total: 8,
            enqueued_at: new Date('2026-03-05T11:56:00.000Z'),
            started_at: new Date('2026-03-05T11:56:00.000Z'),
            finished_at: null,
            created_at: new Date('2026-03-05T11:56:00.000Z'),
          },
          {
            priority_tier: 'tier_2',
            status: 'completed',
            cadence_minutes: 180,
            target_minutes: 180,
            observation_mode: false,
            corridors_total: 40,
            providers_total: 5,
            enqueued_at: new Date('2026-03-05T08:20:00.000Z'),
            started_at: new Date('2026-03-05T08:20:00.000Z'),
            finished_at: new Date('2026-03-05T08:30:00.000Z'),
            created_at: new Date('2026-03-05T08:20:00.000Z'),
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            priority_tier: 'tier_1',
            status: 'completed',
            cadence_minutes: 10,
            target_minutes: 10,
            observation_mode: false,
            corridors_total: 12,
            providers_total: 7,
            enqueued_at: new Date('2026-03-05T11:40:00.000Z'),
            started_at: new Date('2026-03-05T11:40:00.000Z'),
            finished_at: new Date('2026-03-05T11:45:00.000Z'),
            created_at: new Date('2026-03-05T11:40:00.000Z'),
          },
          {
            priority_tier: 'tier_2',
            status: 'completed',
            cadence_minutes: 180,
            target_minutes: 180,
            observation_mode: false,
            corridors_total: 40,
            providers_total: 5,
            enqueued_at: new Date('2026-03-05T08:20:00.000Z'),
            started_at: new Date('2026-03-05T08:20:00.000Z'),
            finished_at: new Date('2026-03-05T08:30:00.000Z'),
            created_at: new Date('2026-03-05T08:20:00.000Z'),
          },
        ],
      })

    const app = makeApp()
    const { b2bSweepStatusRoutes } = await import('../plane-a/src/routes/ops/b2b-sweep-status')
    await b2bSweepStatusRoutes(app)

    const handler = getHandler(app, '/ops/b2b-sweep-status')
    const reply = { code: vi.fn().mockReturnThis() }
    const response = await handler({}, reply) as {
      schedule: Array<{
        priorityTier: string
        providers: number
        anyEnabled: boolean
        driftMinutes: number | null
      }>
      latestRuns: Array<{ priorityTier: string; status: string }>
    }

    expect(response.schedule).toEqual([
      {
        priorityTier: 'tier_1',
        providers: 8,
        anyEnabled: true,
        driftMinutes: 5,
      },
      {
        priorityTier: 'tier_2',
        providers: 5,
        anyEnabled: true,
        driftMinutes: 30,
      },
    ])
    expect(response.latestRuns).toHaveLength(2)
    expect(mockQuery).toHaveBeenCalledTimes(2)
    for (const call of mockQuery.mock.calls) {
      expect(String(call[0])).not.toContain('silver.b2b_sweep_schedule')
    }
  })
})
