import type { FastifyRequest } from 'fastify'
import type { Pool } from 'pg'
import { randomUUID } from 'crypto'
import { query } from '../../../shared/db'
import { createLogger } from '../../../shared/logger'

const logger = createLogger('plane-a.audit-log')

export type AuditLogInput = {
  actorId: string
  actorType: 'user' | 'admin' | 'system' | 'service' | 'api_key'
  actorRole?: string
  action: string
  entityType: string
  entityId?: string
  resourceType?: string
  resourceId?: string
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
  reason?: string
  evidenceLinks?: string[]
  ipAddress?: string
  userAgent?: string
  requestId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
  severity?: 'info' | 'warning' | 'error' | 'critical'
  category: 'user_action' | 'security' | 'compliance' | 'admin' | 'system' | 'billing' | 'data_access'
}

export const getRequestContext = (request?: FastifyRequest) => {
  if (!request) {
    return {}
  }
  const forwarded = request.headers['x-forwarded-for']
  const ipAddress =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : request.ip || undefined

  return {
    ipAddress,
    userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
    requestId: typeof request.id === 'string' ? request.id : undefined,
    sessionId: typeof request.headers['x-session-id'] === 'string' ? request.headers['x-session-id'] : undefined,
  }
}

const computeChanges = (
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
) => {
  if (!before || !after) return null
  const changes: Record<string, { before: unknown; after: unknown }> = {}
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of allKeys) {
    const beforeValue = before[key]
    const afterValue = after[key]
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes[key] = { before: beforeValue, after: afterValue }
    }
  }
  return Object.keys(changes).length > 0 ? changes : null
}

export const logAuditEvent = async (pool: Pool, input: AuditLogInput): Promise<string> => {
  const eventId = `evt_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${randomUUID().slice(0, 8)}`
  const changes = computeChanges(input.beforeSnapshot, input.afterSnapshot)

  if (input.beforeSnapshot && !input.reason) {
    logger.warn('audit_log_missing_reason', {
      action: input.action,
      entity_type: input.entityType,
    })
  }

  try {
    await query(
      `INSERT INTO silver.audit_log (
        event_id, actor_id, actor_type, actor_role, action,
        entity_type, entity_id, resource_type, resource_id,
        before_snapshot, after_snapshot, changes,
        reason, evidence_links, ip_address, user_agent,
        request_id, session_id, metadata, severity, category
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      )`,
      [
        eventId,
        input.actorId,
        input.actorType,
        input.actorRole || null,
        input.action,
        input.entityType,
        input.entityId || null,
        input.resourceType || null,
        input.resourceId || null,
        input.beforeSnapshot ? JSON.stringify(input.beforeSnapshot) : null,
        input.afterSnapshot ? JSON.stringify(input.afterSnapshot) : null,
        changes ? JSON.stringify(changes) : null,
        input.reason || null,
        input.evidenceLinks ? JSON.stringify(input.evidenceLinks) : null,
        input.ipAddress || null,
        input.userAgent || null,
        input.requestId || null,
        input.sessionId || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.severity || 'info',
        input.category,
      ],
      pool,
    )
    return eventId
  } catch (error) {
    logger.error('audit_log_insert_failed', {
      error: error instanceof Error ? error.message : String(error),
      action: input.action,
    })
    throw error
  }
}
