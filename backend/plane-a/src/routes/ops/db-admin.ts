import type { FastifyInstance } from 'fastify'
import { getPool } from '../../../../shared/db'
import { config } from '../../../../shared/config'
import { createLogger } from '../../../../shared/logger'
import { requireAdmin } from '../../plugins/auth-plugin'
import { getErrorMessage } from '../../types/errors'

const logger = createLogger('plane-a.ops.db-admin')
const pool = getPool(config.db.planeAUrl)

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
    { preHandler: requireAdmin() },
    async (_request, reply) => {
      const environment = (process.env.ENVIRONMENT || '').toLowerCase()
      if (environment === 'prod') {
        reply.code(403)
        return { success: false, error: 'forbidden', message: 'Not available in prod.' }
      }
      if (config.runtime.readOnly) {
        reply.code(409)
        return { success: false, error: 'read_only', message: 'Runtime is read-only.' }
      }

      try {
        await pool.query(ensureAttemptsSql)
        return { success: true }
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

