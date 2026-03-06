import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { query } from '../shared/db'

const mockLogAuditEvent = vi.hoisted(() => vi.fn().mockResolvedValue('evt_correction'))
const mockGetRequestContext = vi.hoisted(() => vi.fn().mockReturnValue({ ipAddress: '203.0.113.10' }))
const mockClientQuery = vi.hoisted(() => vi.fn())
const mockClientRelease = vi.hoisted(() => vi.fn())
const mockPoolConnect = vi.hoisted(() => vi.fn())

vi.mock('../shared/db', () => ({
  query: vi.fn(),
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
  requireAdmin: () => () => undefined,
}))

vi.mock('../plane-a/src/services/audit-log', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
  getRequestContext: (...args: unknown[]) => mockGetRequestContext(...args),
}))

type MockReply = {
  code: ReturnType<typeof vi.fn>
}

type RouteHandler = (request: unknown, reply: MockReply) => Promise<unknown>

type MockQueryResult = {
  rows: Array<Record<string, unknown>>
}

const makeApp = () =>
  ({
    get: vi.fn(),
    post: vi.fn(),
    container: {
      pool: {
        connect: mockPoolConnect,
      },
    },
  }) as unknown as FastifyInstance

const getHandler = (app: FastifyInstance, method: 'get' | 'post', url: string) => {
  const call = vi.mocked(app[method]).mock.calls.find(entry => entry[0] === url)
  return call?.[call.length - 1] as RouteHandler
}

describe('index corrections routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClientQuery.mockResolvedValue(undefined)
    mockPoolConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    })
  })

  it('creates index corrections with the authenticated admin identity and audit trail', async () => {
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        correction_id: 'corr-1',
        corridor_id: 'usd-php',
        amount_bucket: 1000,
        method_profile: 'bank',
        date: '2026-03-05',
        field_name: 'teer',
        old_value: 1.23,
        new_value: 1.24,
        reason: 'manual remediation',
        corrected_by: 'admin@remit-scout.com',
        methodology_version: 'v1',
        approved_by: null,
        approved_at: null,
        created_at: '2026-03-05T12:00:00.000Z',
      }],
    } as MockQueryResult)

    const app = makeApp()
    const { indexCorrectionRoutes } = await import('../plane-a/src/routes/index-corrections')
    await indexCorrectionRoutes(app)

    const handler = getHandler(app, 'post', '/indices/corrections')
    const reply: MockReply = { code: vi.fn().mockReturnThis() }
    const result = await handler({
      user: { user_id: 'admin-1', email: 'admin@remit-scout.com', role: 'admin' },
      body: {
        corridor_id: 'usd-php',
        amount_bucket: 1000,
        method_profile: 'bank',
        date: '2026-03-05',
        field_name: 'teer',
        old_value: 1.23,
        new_value: 1.24,
        reason: 'manual remediation',
        methodology_version: 'v1',
      },
    }, reply)

    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(mockClientQuery).toHaveBeenNthCalledWith(2, 'COMMIT')
    expect(vi.mocked(query)).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO gold_export.index_correction'),
      ['usd-php', 1000, 'bank', '2026-03-05', 'teer', 1.23, 1.24, 'manual remediation', 'admin@remit-scout.com', 'v1'],
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
    )
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
      expect.objectContaining({
        action: 'indices.correction.created',
        actorId: 'admin-1',
        reason: 'manual remediation',
        afterSnapshot: expect.objectContaining({
          corridor_id: 'usd-php',
          field_name: 'teer',
          corrected_by: 'admin@remit-scout.com',
        }),
      }),
    )
    expect(reply.code).toHaveBeenCalledWith(201)
    expect(result).toEqual({
      correctionId: 'corr-1',
      status: 'pending_approval',
    })
  })

  it('approves index corrections with the authenticated admin identity and ignores caller-supplied approved_by', async () => {
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        correction_id: 'corr-1',
        corridor_id: 'usd-php',
        amount_bucket: 1000,
        method_profile: 'bank',
        date: '2026-03-05',
        field_name: 'teer',
        old_value: 1.23,
        new_value: 1.24,
        reason: 'manual remediation',
        corrected_by: 'creator@remit-scout.com',
        methodology_version: 'v1',
        approved_by: 'approver@remit-scout.com',
        approved_at: '2026-03-05T12:05:00.000Z',
        created_at: '2026-03-05T12:00:00.000Z',
      }],
    } as MockQueryResult)

    const app = makeApp()
    const { indexCorrectionRoutes } = await import('../plane-a/src/routes/index-corrections')
    await indexCorrectionRoutes(app)

    const handler = getHandler(app, 'post', '/indices/corrections/:correctionId/approve')
    const result = await handler({
      user: { user_id: 'admin-2', email: 'approver@remit-scout.com', role: 'admin' },
      params: { correctionId: 'corr-1' },
      body: { approved_by: 'spoofed@example.com' },
    }, { code: vi.fn().mockReturnThis() })

    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(mockClientQuery).toHaveBeenNthCalledWith(2, 'COMMIT')
    expect(vi.mocked(query)).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE gold_export.index_correction'),
      ['approver@remit-scout.com', 'corr-1'],
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
    )
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ query: mockClientQuery, release: mockClientRelease }),
      expect.objectContaining({
        action: 'indices.correction.approved',
        actorId: 'admin-2',
        afterSnapshot: {
          approved_by: 'approver@remit-scout.com',
          approved_at: '2026-03-05T12:05:00.000Z',
        },
      }),
    )
    expect(result).toEqual({
      correctionId: 'corr-1',
      status: 'approved',
      approvedBy: 'approver@remit-scout.com',
    })
  })

  it('rolls back correction creation when the audit log cannot be written', async () => {
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{
        correction_id: 'corr-2',
        corridor_id: 'usd-php',
        amount_bucket: 1000,
        method_profile: 'bank',
        date: '2026-03-05',
        field_name: 'teer',
        old_value: 1.23,
        new_value: 1.24,
        reason: 'manual remediation',
        corrected_by: 'admin@remit-scout.com',
        methodology_version: 'v1',
        approved_by: null,
        approved_at: null,
        created_at: '2026-03-05T12:00:00.000Z',
      }],
    } as MockQueryResult)
    mockLogAuditEvent.mockRejectedValueOnce(new Error('audit unavailable'))

    const app = makeApp()
    const { indexCorrectionRoutes } = await import('../plane-a/src/routes/index-corrections')
    await indexCorrectionRoutes(app)

    const handler = getHandler(app, 'post', '/indices/corrections')
    await expect(handler({
      user: { user_id: 'admin-1', email: 'admin@remit-scout.com', role: 'admin' },
      body: {
        corridor_id: 'usd-php',
        amount_bucket: 1000,
        method_profile: 'bank',
        date: '2026-03-05',
        field_name: 'teer',
        old_value: 1.23,
        new_value: 1.24,
        reason: 'manual remediation',
      },
    }, { code: vi.fn().mockReturnThis() })).rejects.toThrow('audit unavailable')

    expect(mockClientQuery).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(mockClientQuery).toHaveBeenNthCalledWith(2, 'ROLLBACK')
  })
})
