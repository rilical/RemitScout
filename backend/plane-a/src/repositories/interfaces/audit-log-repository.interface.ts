import type { AuditLogInput } from '../../services/audit-log'

export type AuditLogEntry = {
  id: string
  event_id: string
  actor_id: string
  actor_type: string
  actor_role: string | null
  action: string
  entity_type: string
  entity_id: string | null
  resource_type: string | null
  resource_id: string | null
  before_snapshot: unknown | null
  after_snapshot: unknown | null
  changes: unknown | null
  reason: string | null
  evidence_links: unknown | null
  ip_address: string | null
  user_agent: string | null
  request_id: string | null
  session_id: string | null
  metadata: unknown | null
  severity: string | null
  category: string
  created_at: Date
}

export type AuditLogFilters = {
  actor_id?: string
  actor_type?: string
  action?: string
  entity_type?: string
  entity_id?: string
  category?: string
  severity?: string
  start_date?: Date
  end_date?: Date
  limit?: number
  offset?: number
}

export type SecurityEventFilters = {
  start_date?: Date
  end_date?: Date
  severity?: string
  limit?: number
}

export interface IAuditLogRepository {
  createLog(input: AuditLogInput): Promise<string>
  getLogs(filters: AuditLogFilters): Promise<{ logs: AuditLogEntry[]; total: number }>
  getLog(eventId: string): Promise<AuditLogEntry | null>
  exportLogs(filters: AuditLogFilters, format: 'csv' | 'json'): Promise<string>
  getActivityByUser(userId: string, limit?: number): Promise<AuditLogEntry[]>
  getSecurityEvents(filters: SecurityEventFilters): Promise<AuditLogEntry[]>
}
