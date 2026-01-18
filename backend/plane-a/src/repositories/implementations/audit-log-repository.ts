import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import { logAuditEvent } from '../../services/audit-log'
import type {
  AuditLogEntry,
  AuditLogFilters,
  IAuditLogRepository,
  SecurityEventFilters,
} from '../interfaces/audit-log-repository.interface'
import type { AuditLogInput } from '../../services/audit-log'

const buildWhereClause = (filters: AuditLogFilters) => {
  const conditions: string[] = []
  const params: Array<string | Date | number> = []

  const add = (condition: string, value: string | Date | number | undefined) => {
    if (value === undefined) return
    params.push(value)
    conditions.push(condition.replace('$idx', `$${params.length}`))
  }

  add('actor_id = $idx', filters.actor_id)
  add('actor_type = $idx', filters.actor_type)
  add('action = $idx', filters.action)
  add('entity_type = $idx', filters.entity_type)
  add('entity_id = $idx', filters.entity_id)
  add('category = $idx', filters.category)
  add('severity = $idx', filters.severity)
  add('created_at >= $idx', filters.start_date)
  add('created_at <= $idx', filters.end_date)

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return { whereClause, params }
}

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly pool: Pool) {}

  async createLog(input: AuditLogInput): Promise<string> {
    return logAuditEvent(this.pool, input)
  }

  async getLogs(filters: AuditLogFilters): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const { whereClause, params } = buildWhereClause(filters)
    const limit = filters.limit ?? 100
    const offset = filters.offset ?? 0

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM silver.audit_log ${whereClause}`,
      params,
      this.pool,
    )

    const result = await query<AuditLogEntry>(
      `SELECT id, event_id, actor_id, actor_type, actor_role, action,
              entity_type, entity_id, resource_type, resource_id,
              before_snapshot, after_snapshot, changes,
              reason, evidence_links, ip_address, user_agent,
              request_id, session_id, metadata, severity, category, created_at
       FROM silver.audit_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
      this.pool,
    )

    return {
      logs: result.rows,
      total: countResult.rows[0]?.total ?? 0,
    }
  }

  async getLog(eventId: string): Promise<AuditLogEntry | null> {
    const result = await query<AuditLogEntry>(
      `SELECT id, event_id, actor_id, actor_type, actor_role, action,
              entity_type, entity_id, resource_type, resource_id,
              before_snapshot, after_snapshot, changes,
              reason, evidence_links, ip_address, user_agent,
              request_id, session_id, metadata, severity, category, created_at
       FROM silver.audit_log
       WHERE event_id = $1`,
      [eventId],
      this.pool,
    )

    return result.rows[0] ?? null
  }

  async exportLogs(filters: AuditLogFilters, format: 'csv' | 'json'): Promise<string> {
    const { logs } = await this.getLogs({
      ...filters,
      limit: filters.limit ?? 1000,
      offset: filters.offset ?? 0,
    })

    if (format === 'json') {
      return JSON.stringify(logs)
    }

    const header = [
      'event_id',
      'actor_id',
      'actor_type',
      'actor_role',
      'action',
      'entity_type',
      'entity_id',
      'category',
      'severity',
      'created_at',
    ]

    const lines = logs.map((log) =>
      [
        log.event_id,
        log.actor_id,
        log.actor_type,
        log.actor_role ?? '',
        log.action,
        log.entity_type,
        log.entity_id ?? '',
        log.category,
        log.severity ?? '',
        log.created_at.toISOString(),
      ]
        .map((value) => escapeCsv(String(value)))
        .join(','),
    )

    return [header.join(','), ...lines].join('\n')
  }

  async getActivityByUser(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogEntry>(
      `SELECT id, event_id, actor_id, actor_type, actor_role, action,
              entity_type, entity_id, resource_type, resource_id,
              before_snapshot, after_snapshot, changes,
              reason, evidence_links, ip_address, user_agent,
              request_id, session_id, metadata, severity, category, created_at
       FROM silver.audit_log
       WHERE actor_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
      this.pool,
    )

    return result.rows
  }

  async getSecurityEvents(filters: SecurityEventFilters): Promise<AuditLogEntry[]> {
    const params: Array<string | Date | number> = []
    const conditions: string[] = ['category = $1']
    params.push('security')

    if (filters.severity) {
      params.push(filters.severity)
      conditions.push(`severity = $${params.length}`)
    }
    if (filters.start_date) {
      params.push(filters.start_date)
      conditions.push(`created_at >= $${params.length}`)
    }
    if (filters.end_date) {
      params.push(filters.end_date)
      conditions.push(`created_at <= $${params.length}`)
    }

    const limit = filters.limit ?? 200
    params.push(limit)

    const result = await query<AuditLogEntry>(
      `SELECT id, event_id, actor_id, actor_type, actor_role, action,
              entity_type, entity_id, resource_type, resource_id,
              before_snapshot, after_snapshot, changes,
              reason, evidence_links, ip_address, user_agent,
              request_id, session_id, metadata, severity, category, created_at
       FROM silver.audit_log
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
      this.pool,
    )

    return result.rows
  }
}
