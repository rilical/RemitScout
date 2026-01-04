export type SessionRecord = {
  id: string
  session_id: string
  user_id: string | null
  anon_id: string | null
  ip_address: string | null
  user_agent: string | null
  device_type: string | null
  location: string | null
  created_at: Date
  last_activity: Date
  expires_at: Date | null
  is_active: boolean
  metadata: Record<string, unknown> | null
}

export type SessionCreateInput = {
  sessionId: string
  userId?: string
  anonId?: string
  ipAddress?: string
  userAgent?: string
  deviceType?: string
  location?: string
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface ISessionRepository {
  createSession(input: SessionCreateInput): Promise<SessionRecord>
  getSession(sessionId: string): Promise<SessionRecord | null>
  getUserSessions(userId: string): Promise<SessionRecord[]>
  getAnonSession(anonId: string): Promise<SessionRecord | null>
  updateLastActivity(sessionId: string): Promise<void>
  revokeSession(sessionId: string): Promise<void>
  revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number>
  revokeExpiredSessions(): Promise<number>
  getActiveSessionCount(userId?: string, anonId?: string): Promise<number>
}
