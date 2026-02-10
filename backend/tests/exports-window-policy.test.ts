import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance, FastifyReply } from 'fastify'

const mockCountByUserAndStatus = vi.fn()
const mockCreate = vi.fn()

vi.mock('../shared/db', () => ({
  getPool: vi.fn().mockReturnValue({}),
  query: vi.fn(),
}))

vi.mock('../shared/config', () => ({
  config: {
    db: {
      planeAUrl: '',
    },
    queues: {
      exports: {
        mode: 'queue',
        url: 'https://example.com/queue',
      },
    },
    storage: {
      exports: {
        bucket: 'test-bucket',
      },
    },
    exports: {
      maxActivePerUser: 2,
    },
  },
}))

vi.mock('../shared/sqs', () => ({
  sendJsonMessage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  getRequestContext: vi.fn().mockReturnValue({}),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../plane-a/src/repositories', () => ({
  ExportJobRepository: vi.fn().mockImplementation(() => ({
    countByUserAndStatus: mockCountByUserAndStatus,
    create: mockCreate,
    listByUserId: vi.fn(),
    getById: vi.fn(),
  })),
}))

describe('exports route plan window enforcement', () => {
  let app: FastifyInstance
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCountByUserAndStatus.mockResolvedValue(0)
    mockCreate.mockResolvedValue({
      id: 'job_1',
      job_type: 'history_csv',
      status: 'queued',
      created_at: new Date('2026-02-10T00:00:00.000Z'),
    })

    app = {
      get: vi.fn(),
      post: vi.fn(),
    } as any

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    }

    const { exportsRoutes } = await import('../plane-a/src/routes/exports')
    await exportsRoutes(app)
  })

  it('rejects plus exports that exceed 30 days (inclusive)', async () => {
    const call = vi.mocked(app.post).mock.calls.find((c) => c[0] === '/exports')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', role: 'user' },
      entitlementsContext: {
        planCode: 'plus',
        entitlements: {
          exports_max_days: 30,
        },
      },
      body: {
        dataType: 'history',
        format: 'csv',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31', // 31 days inclusive
      },
    } as any

    const result = await handler(request, mockReply)

    expect(vi.mocked(mockReply.code as any)).toHaveBeenCalledWith(400)
    expect(result).toMatchObject({
      error: 'export_window_exceeds_plan_limit',
      allowedDays: 30,
      windowDays: 31,
    })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects plus history exports when date range is missing', async () => {
    const call = vi.mocked(app.post).mock.calls.find((c) => c[0] === '/exports')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', role: 'user' },
      entitlementsContext: {
        planCode: 'plus',
        entitlements: {
          exports_max_days: 30,
        },
      },
      body: {
        dataType: 'history',
        format: 'csv',
      },
    } as any

    const result = await handler(request, mockReply)

    expect(vi.mocked(mockReply.code as any)).toHaveBeenCalledWith(400)
    expect(result).toMatchObject({
      error: 'export_date_range_required',
      allowedDays: 30,
    })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('allows enterprise exports for large windows', async () => {
    const call = vi.mocked(app.post).mock.calls.find((c) => c[0] === '/exports')
    const handler = call?.[2] as any

    const request = {
      user: { user_id: 'u1', role: 'user' },
      entitlementsContext: {
        planCode: 'enterprise',
        entitlements: {
          exports_max_days: null,
        },
      },
      body: {
        dataType: 'history',
        format: 'csv',
        dateFrom: '2020-01-01',
        dateTo: '2026-01-31',
      },
    } as any

    const result = await handler(request, mockReply)

    expect(result.success).toBe(true)
    expect(result.job).toMatchObject({
      id: 'job_1',
      status: 'queued',
      jobType: 'history_csv',
    })
    expect(mockCreate).toHaveBeenCalled()
  })
})
