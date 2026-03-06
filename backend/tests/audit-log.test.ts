import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'pg'
import { getRequestContext, logAuditEvent } from '../plane-a/src/services/audit-log'
import { query } from '../shared/db'

vi.mock('../shared/db', () => ({
  query: vi.fn(),
}))

describe('audit-log', () => {
  type RequestContextInput = Parameters<typeof getRequestContext>[0]

  it('prefers the trusted runtime source IP for direct requests', () => {
    const context = getRequestContext({
      headers: {
        'x-forwarded-for': '203.0.113.10, 127.0.0.1',
        'user-agent': 'test-agent',
        'x-session-id': 'session-123',
      },
      id: 'req-1',
      ip: '10.0.0.1',
    } as RequestContextInput)

    expect(context).toEqual({
      ipAddress: '10.0.0.1',
      userAgent: 'test-agent',
      requestId: 'req-1',
      sessionId: 'session-123',
    })
  })

  it('uses the final forwarded hop for CloudFront-proxied requests', () => {
    const context = getRequestContext({
      headers: {
        'x-amz-cf-id': 'cf-request-id',
        'x-forwarded-for': '198.51.100.20, 203.0.113.10',
        'user-agent': 'test-agent',
      },
      id: 'req-2',
      ip: '54.239.1.10',
    } as RequestContextInput)

    expect(context).toEqual({
      ipAddress: '203.0.113.10',
      userAgent: 'test-agent',
      requestId: 'req-2',
      sessionId: undefined,
    })
  })

  it('returns empty context when request is missing', () => {
    expect(getRequestContext()).toEqual({})
  })

  it('writes audit log with change tracking', async () => {
    vi.mocked(query).mockResolvedValue({ rows: [] })

    const pool = {} as Pool
    const eventId = await logAuditEvent(pool, {
      actorId: 'user-1',
      actorType: 'user',
      action: 'update_profile',
      entityType: 'profile',
      entityId: 'profile-1',
      beforeSnapshot: { name: 'Old' },
      afterSnapshot: { name: 'New' },
      reason: 'user_request',
      category: 'user_action',
    })

    expect(eventId).toMatch(/^evt_\d{8}_/)
    expect(query).toHaveBeenCalledTimes(1)

    const [sql, params] = vi.mocked(query).mock.calls[0]
    expect(sql).toContain('INSERT INTO silver.audit_log')
    expect(params?.[0]).toBe(eventId)

    const changes = JSON.parse(params?.[11] as string)
    expect(changes).toEqual({
      name: { before: 'Old', after: 'New' },
    })
  })

  it('stores null changes when no before/after', async () => {
    vi.mocked(query).mockResolvedValue({ rows: [] })

    const pool = {} as Pool
    await logAuditEvent(pool, {
      actorId: 'system',
      actorType: 'system',
      action: 'job_run',
      entityType: 'job',
      category: 'system',
    })

    const [, params] = vi.mocked(query).mock.calls.at(-1) || []
    expect(params?.[11]).toBeNull()
  })
})
