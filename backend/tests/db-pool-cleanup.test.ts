import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const processOnceSpy = vi.spyOn(process, 'once')
const poolEndMock = vi.fn(async () => undefined)

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    end: poolEndMock,
    on: vi.fn(),
    query: vi.fn(),
    connect: vi.fn(),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  })),
}))

vi.mock('../shared/config', () => ({
  config: {
    env: 'test',
    runtime: { isLambda: false, isEcs: false },
    dbPool: {},
    db: { url: 'postgres://remit:remit@127.0.0.1:5432/remit' },
  },
}))

vi.mock('../shared/db-metrics', () => ({
  recordQueryFromSql: vi.fn(),
  updateConnectionPoolMetrics: vi.fn(),
}))

vi.mock('../shared/connection-manager', () => ({
  registerDatabasePool: vi.fn(),
}))

vi.mock('../shared/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe('database pool cleanup wiring', () => {
  beforeEach(() => {
    vi.resetModules()
    processOnceSpy.mockClear()
    poolEndMock.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('avoids direct SIGTERM/SIGINT pool cleanup handlers', async () => {
    const { createPool } = await import('../shared/db')

    createPool('postgres://remit:remit@127.0.0.1:5432/remit')

    const registeredEvents = processOnceSpy.mock.calls.map(([event]) => event)
    expect(registeredEvents).toContain('beforeExit')
    expect(registeredEvents).not.toContain('SIGTERM')
    expect(registeredEvents).not.toContain('SIGINT')
  })
})
