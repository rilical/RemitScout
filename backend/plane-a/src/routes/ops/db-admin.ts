import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireSuperAdmin } from '../../plugins/auth-plugin'
import { getErrorMessage } from '../../types/errors'
import { getRequestContext, logAuditEvent } from '../../services/audit-log'
import { ValidationError } from '../../../../shared/errors'

const logger = createLogger('plane-a.ops.db-admin')
const pool = getPool(config.db.planeAUrl)

const bodySchema = z.object({
  mode: z.enum(['status', 'ensure']).default('status'),
  confirm: z.string().trim().max(32).optional(),
})

const ensureAttemptsSql = `
CREATE TABLE IF NOT EXISTS silver.alert_notification_attempt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES silver.alert_rule(id) ON DELETE SET NULL,
  user_id UUID REFERENCES silver.user_account(user_id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  provider TEXT NOT NULL,
  to_email_hash TEXT,
  to_email TEXT,
  subject TEXT,
  text_body TEXT,
  html_body TEXT,
  status TEXT NOT NULL CHECK (status IN ('skipped', 'sent', 'failed')),
  skip_reason TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alert_notification_attempt_created_at_idx
  ON silver.alert_notification_attempt (created_at DESC);

CREATE INDEX IF NOT EXISTS alert_notification_attempt_alert_id_idx
  ON silver.alert_notification_attempt (alert_id, created_at DESC);

CREATE INDEX IF NOT EXISTS alert_notification_attempt_user_id_idx
  ON silver.alert_notification_attempt (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON silver.alert_notification_attempt TO plane_a;
`

export const dbAdminRoutes = (app: FastifyInstance) => {
  app.post(
    '/ops/db/ensure-alert-notification-attempts',
    { preHandler: requireSuperAdmin() },
    async (request, reply) => {
      const parsed = bodySchema.safeParse(request.body ?? {})
      if (!parsed.success) {
        throw new ValidationError('Invalid request', {
          details: { error: 'bad_request', details: parsed.error.issues },
        })
      }

      const requestedMode = parsed.data.mode
      const environment = (config.envName || config.env || '').toLowerCase()
      const prodLike = environment === 'prod'
        || environment === 'production'
        || environment === 'staging'
      const migrationPath = 'backend/db/migrations/073_alert_notification_attempts.sql'

      const ensureRequested = requestedMode === 'ensure'
      const appliedMode = prodLike ? 'status' : requestedMode
      const adminId = request.user?.user_id ?? 'unknown'

      try {
        const existsResult = await pool.query<{ regclass: string | null }>(
          `SELECT to_regclass('silver.alert_notification_attempt') AS regclass`,
        )
        const existsBefore = Boolean(existsResult.rows[0]?.regclass)

        if (ensureRequested && prodLike) {
          const payload = {
            success: true,
            requested_mode: requestedMode,
            applied_mode: appliedMode,
            exists: existsBefore,
            missing: !existsBefore,
            migration: migrationPath,
            message: 'DDL ensure is disabled in prod-like environments. Apply the migration instead.',
          }

          try {
            await logAuditEvent(pool, {
              actorId: adminId,
              actorType: 'admin',
              actorRole: request.user?.role ?? undefined,
              action: 'ops.db.ensure_alert_notification_attempts',
              entityType: 'db',
              entityId: 'silver.alert_notification_attempt',
              category: 'admin',
              severity: 'warning',
              metadata: payload,
              ...getRequestContext(request),
            })
          } catch (auditError) {
            logger.warn('ops_db_ensure_audit_failed', {
              error: auditError instanceof Error ? auditError.message : String(auditError),
            })
          }

          return payload
        }

        if (ensureRequested) {
          const confirm = (parsed.data.confirm || '').trim().toUpperCase()
          if (confirm !== 'APPLY') {
            reply.code(400)
            return {
              success: false,
              error: 'confirmation_required',
              message: 'Confirmation required. Set confirm="APPLY" to run DDL ensure in dev.',
            }
          }
          if (config.runtime.readOnly) {
            reply.code(409)
            return { success: false, error: 'read_only', message: 'Runtime is read-only.' }
          }
          const client = await pool.connect()
          try {
            await client.query('BEGIN')
            await client.query(ensureAttemptsSql)

            const existsAfterResult = await client.query<{ regclass: string | null }>(
              `SELECT to_regclass('silver.alert_notification_attempt') AS regclass`,
            )
            const existsAfter = Boolean(existsAfterResult.rows[0]?.regclass)
            const payload = {
              success: true,
              requested_mode: requestedMode,
              applied_mode: appliedMode,
              exists: existsAfter,
              missing: !existsAfter,
              migration: migrationPath,
              message: 'Ensure completed.',
            }

            await logAuditEvent(client, {
              actorId: adminId,
              actorType: 'admin',
              actorRole: request.user?.role ?? undefined,
              action: 'ops.db.ensure_alert_notification_attempts',
              entityType: 'db',
              entityId: 'silver.alert_notification_attempt',
              category: 'admin',
              severity: 'warning',
              metadata: payload,
              ...getRequestContext(request),
            })

            await client.query('COMMIT')
            return payload
          } catch (error) {
            await client.query('ROLLBACK')
            throw error
          } finally {
            client.release()
          }
        }

        const existsAfterResult = await pool.query<{ regclass: string | null }>(
          `SELECT to_regclass('silver.alert_notification_attempt') AS regclass`,
        )
        const existsAfter = Boolean(existsAfterResult.rows[0]?.regclass)

        return {
          success: true,
          requested_mode: requestedMode,
          applied_mode: appliedMode,
          exists: existsAfter,
          missing: !existsAfter,
          migration: migrationPath,
          message: existsAfter ? 'Table exists.' : 'Table is missing. Apply migration to create it.',
        }
      } catch (error) {
        logger.error('ensure_alert_notification_attempts_failed', {
          error: getErrorMessage(error),
        })
        reply.code(500)
        return { success: false, error: 'internal_error' }
      }
    },
  )
}
