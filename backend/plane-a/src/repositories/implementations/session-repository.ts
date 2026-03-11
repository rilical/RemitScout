import type { Pool } from 'pg'
import { query } from '../../../../shared/db'
import type {
  ISessionRepository,
  SessionCreateInput,
  SessionRecord,
} from '../interfaces/session-repository.interface'

export class SessionRepository implements ISessionRepository {
  constructor(private readonly pool: Pool) {}

  async createSession(input: SessionCreateInput): Promise<SessionRecord> {
    const result = await query<SessionRecord>(
      `
      INSERT INTO silver.user_session (
        session_id,
        user_id,
        anon_id,
        ip_hash,
        user_agent,
        device_type,
        location,
        expires_at,
        metadata,
        last_activity,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW(), TRUE)
      ON CONFLICT (session_id)
      DO UPDATE SET
        user_id = COALESCE(EXCLUDED.user_id, silver.user_session.user_id),
        anon_id = COALESCE(EXCLUDED.anon_id, silver.user_session.anon_id),
        ip_hash = COALESCE(EXCLUDED.ip_hash, silver.user_session.ip_hash),
        user_agent = COALESCE(EXCLUDED.user_agent, silver.user_session.user_agent),
        device_type = COALESCE(EXCLUDED.device_type, silver.user_session.device_type),
        location = COALESCE(EXCLUDED.location, silver.user_session.location),
        expires_at = COALESCE(EXCLUDED.expires_at, silver.user_session.expires_at),
        metadata = COALESCE(EXCLUDED.metadata, silver.user_session.metadata),
        last_activity = NOW(),
        is_active = TRUE
      RETURNING
        id,
        session_id,
        user_id,
        anon_id,
        ip_hash,
        user_agent,
        device_type,
        location,
        created_at,
        last_activity,
        expires_at,
        is_active,
        metadata
      `,
      [
        input.sessionId,
        input.userId ?? null,
        input.anonId ?? null,
        input.ipHash ?? null,
        input.userAgent ?? null,
        input.deviceType ?? null,
        input.location ?? null,
        input.expiresAt ?? null,
        input.metadata ?? null,
      ],
      this.pool,
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error('INSERT/upsert into user_session returned no rows')
    }
    return row
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const result = await query<SessionRecord>(
      `
      SELECT
        id,
        session_id,
        user_id,
        anon_id,
        ip_hash,
        user_agent,
        device_type,
        location,
        created_at,
        last_activity,
        expires_at,
        is_active,
        metadata
      FROM silver.user_session
      WHERE session_id = $1
      `,
      [sessionId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async getUserSessions(userId: string): Promise<SessionRecord[]> {
    const result = await query<SessionRecord>(
      `
      SELECT
        id,
        session_id,
        user_id,
        anon_id,
        ip_hash,
        user_agent,
        device_type,
        location,
        created_at,
        last_activity,
        expires_at,
        is_active,
        metadata
      FROM silver.user_session
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY last_activity DESC
      `,
      [userId],
      this.pool,
    )
    return result.rows
  }

  async getAnonSession(anonId: string): Promise<SessionRecord | null> {
    const result = await query<SessionRecord>(
      `
      SELECT
        id,
        session_id,
        user_id,
        anon_id,
        ip_hash,
        user_agent,
        device_type,
        location,
        created_at,
        last_activity,
        expires_at,
        is_active,
        metadata
      FROM silver.user_session
      WHERE anon_id = $1
      ORDER BY last_activity DESC
      LIMIT 1
      `,
      [anonId],
      this.pool,
    )
    return result.rows[0] ?? null
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    await query(
      `
      UPDATE silver.user_session
      SET last_activity = NOW()
      WHERE session_id = $1
      `,
      [sessionId],
      this.pool,
    )
  }

  async revokeSession(sessionId: string): Promise<void> {
    await query(
      `
      UPDATE silver.user_session
      SET is_active = FALSE,
          expires_at = NOW(),
          last_activity = NOW()
      WHERE session_id = $1
      `,
      [sessionId],
      this.pool,
    )
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await query<{ count: string }>(
      `
      UPDATE silver.user_session
      SET is_active = FALSE,
          expires_at = NOW(),
          last_activity = NOW()
      WHERE user_id = $1
        AND is_active = TRUE
        AND ($2::text IS NULL OR session_id <> $2)
      RETURNING id
      `,
      [userId, exceptSessionId ?? null],
      this.pool,
    )
    return result.rowCount ?? 0
  }

  async revokeExpiredSessions(): Promise<number> {
    const result = await query(
      `
      UPDATE silver.user_session
      SET is_active = FALSE
      WHERE is_active = TRUE
        AND (
          (expires_at IS NOT NULL AND expires_at < NOW())
          OR last_activity < NOW() - INTERVAL '30 days'
        )
      `,
      [],
      this.pool,
    )
    return result.rowCount ?? 0
  }

  async getActiveSessionCount(userId?: string, anonId?: string): Promise<number> {
    const result = await query<{ count: string }>(
      `
      SELECT COUNT(*)::text AS count
      FROM silver.user_session
      WHERE is_active = TRUE
        AND ($1::uuid IS NULL OR user_id = $1::uuid)
        AND ($2::text IS NULL OR anon_id = $2::text)
      `,
      [userId ?? null, anonId ?? null],
      this.pool,
    )
    return Number(result.rows[0]?.count ?? 0)
  }
}
