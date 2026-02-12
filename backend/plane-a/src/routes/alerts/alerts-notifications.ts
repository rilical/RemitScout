import type { FastifyInstance } from 'fastify'
import { recordRequest } from '../../../../shared/api-metrics'
import { config } from '../../../../shared/config'
import { getRequestContext, logAuditEvent } from '../../services/audit-log'
import { verifyAlertUnsubscribeToken } from '../../services/alert-unsubscribe'
import { getErrorMessage } from '../../types/errors'
import { logger } from './shared'
import { ValidationError } from '../../../../shared/errors'

export const registerAlertsNotificationRoutes = async (app: FastifyInstance) => {
  const { pool } = app.container

  app.get('/alerts/unsubscribe', async (request, reply) => {
    const startTime = Date.now()
    const token = typeof (request.query as { token?: string }).token === 'string'
      ? (request.query as { token?: string }).token
      : ''

    if (!token) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
            throw new ValidationError('Invalid request', { details: reply
        .type('text/html')
        .send('<h2>Unsubscribe failed</h2><p>Missing unsubscribe token.</p>') })
    }

    const payload = verifyAlertUnsubscribeToken(token)
    if (!payload) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 400, durationSeconds)
            throw new ValidationError('Invalid request', { details: reply
        .type('text/html')
        .send('<h2>Unsubscribe failed</h2><p>Invalid or expired token.</p>') })
    }

    const { userId } = payload
    try {
      const result = await pool.query(
        `UPDATE silver.notification_pref
         SET unsubscribed = TRUE, updated_at = NOW()
         WHERE owner_type = 'user' AND user_id = $1`,
        [userId],
      )

      if (result.rowCount === 0) {
        await pool.query(
          `INSERT INTO silver.notification_pref (
             owner_type,
             user_id,
             channel,
             timezone,
             daily_send_hour,
             digest_enabled,
             marketing_opt_in,
             unsubscribed,
             created_at,
             updated_at
           ) VALUES (
             'user',
             $1,
             'email',
             'UTC',
             9,
             FALSE,
             FALSE,
             TRUE,
             NOW(),
             NOW()
           )`,
          [userId],
        )
      }

      try {
        await logAuditEvent(pool, {
          actorId: userId,
          actorType: 'user',
          action: 'alert.unsubscribe',
          entityType: 'notification_pref',
          entityId: userId,
          category: 'user_action',
          severity: 'info',
          ...getRequestContext(request),
        })
      } catch (error) {
        logger.warn('audit_log_failed', {
          user_id: userId,
          error: getErrorMessage(error),
        })
      }

      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 200, durationSeconds)
      const baseUrl = config.alerts.unsubscribe.baseUrl.replace(/\/$/, '')
      return reply
        .type('text/html')
        .send(
          `<h2>You're unsubscribed</h2><p>Email alerts are now disabled.</p><p><a href="${baseUrl}/dashboard?tab=account&section=notifications">Manage notification preferences</a></p>`,
        )
    } catch (error) {
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('GET', '/alerts/unsubscribe', 500, durationSeconds)
      logger.error('alert_unsubscribe_failed', {
        user_id: userId,
        error: error instanceof Error ? error.message : String(error),
      })
      reply.code(500)
      return reply
        .type('text/html')
        .send('<h2>Unsubscribe failed</h2><p>Please try again later.</p>')
    }
  })
}
